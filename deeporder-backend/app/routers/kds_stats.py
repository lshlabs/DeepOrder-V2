from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass, field
from datetime import UTC, datetime, time, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.auth import get_approved_kds_user
from app.database import get_db
from app.models import Order, OrderStatus, User
from app.schemas import (
    KdsStatsComparisonBucketOut,
    KdsStatsComparisonOut,
    KdsStatsHourlyOut,
    KdsStatsKitchenOut,
    KdsStatsMenuOut,
    KdsStatsResponse,
    KdsStatsSummaryOut,
)

router = APIRouter()

DELAYED_ORDER_THRESHOLD_SECONDS = 10 * 60
MENU_BOTTLENECK_MIN_ORDERS = 2


@dataclass
class _OrderStats:
    orders: int = 0
    revenue: int = 0
    completion_seconds: list[int] = field(default_factory=list)
    delayed_orders: int = 0


@dataclass
class _MenuStats:
    orders: int = 0
    revenue: int = 0
    completion_seconds: list[int] = field(default_factory=list)
    delayed_orders: int = 0


@router.get("/api/kds/stats", response_model=KdsStatsResponse)
def get_kds_stats(
    current_user: User = Depends(get_approved_kds_user),
    db: Session = Depends(get_db),
) -> KdsStatsResponse:
    now = datetime.now(UTC)
    today_start = _day_start(now)
    tomorrow_start = today_start + timedelta(days=1)
    yesterday_start = today_start - timedelta(days=1)
    seven_day_start = today_start - timedelta(days=7)

    orders = db.scalars(
        select(Order)
        .options(selectinload(Order.items))
        .where(
            Order.store_id == current_user.store_id,
            Order.created_at >= seven_day_start,
            Order.created_at < tomorrow_start,
        )
        .order_by(Order.created_at.asc(), Order.id.asc())
    ).all()

    today_orders = [order for order in orders if today_start <= _as_utc(order.created_at) < tomorrow_start]
    yesterday_orders = [
        order for order in orders if yesterday_start <= _as_utc(order.created_at) < today_start
    ]
    previous_seven_days_orders = [
        order for order in orders if seven_day_start <= _as_utc(order.created_at) < today_start
    ]

    today_stats = _aggregate_orders(today_orders)
    yesterday_stats = _aggregate_orders(yesterday_orders)
    seven_day_average = _average_daily_stats(previous_seven_days_orders, seven_day_start, today_start)
    hourly = _build_hourly(today_orders)
    menus = _build_menus(today_orders, yesterday_orders, previous_seven_days_orders)
    kitchen = _build_kitchen(today_orders, hourly, menus)
    summary = _build_summary(today_orders, today_stats, hourly)

    return KdsStatsResponse(
        date=today_start.date().isoformat(),
        summary=summary,
        comparison=KdsStatsComparisonOut(
            vs_yesterday=_build_comparison(today_stats, yesterday_stats, require_baseline=False),
            vs_7d_average=_build_comparison(today_stats, seven_day_average, require_baseline=True),
        ),
        hourly=hourly,
        menus=menus,
        kitchen=kitchen,
        insights=_build_insights(summary, kitchen, seven_day_average),
    )


def _build_summary(
    orders: list[Order],
    stats: _OrderStats,
    hourly: list[KdsStatsHourlyOut],
) -> KdsStatsSummaryOut:
    completed_orders = len(_completed_orders(orders))
    peak_hour = max(hourly, key=lambda item: item.orders).hour if hourly else None
    return KdsStatsSummaryOut(
        total_orders=len(orders),
        completed_orders=completed_orders,
        completion_rate=_rate(completed_orders, len(orders)),
        revenue=stats.revenue,
        average_completion_seconds=_average_seconds(stats.completion_seconds),
        delayed_orders=stats.delayed_orders,
        peak_hour=peak_hour,
    )


def _build_hourly(orders: list[Order]) -> list[KdsStatsHourlyOut]:
    by_hour: dict[int, _OrderStats] = defaultdict(_OrderStats)
    for order in orders:
        stats = by_hour[_as_utc(order.created_at).hour]
        stats.orders += 1
        stats.revenue += _order_revenue(order)
        completion_seconds = _completion_seconds(order)
        if completion_seconds is not None:
            stats.completion_seconds.append(completion_seconds)
            if completion_seconds > DELAYED_ORDER_THRESHOLD_SECONDS:
                stats.delayed_orders += 1

    return [
        KdsStatsHourlyOut(
            hour=_hour_label(hour),
            orders=stats.orders,
            revenue=stats.revenue,
            average_completion_seconds=_average_seconds(stats.completion_seconds),
            delayed_orders=stats.delayed_orders,
        )
        for hour, stats in sorted(by_hour.items())
    ]


def _build_menus(
    today_orders: list[Order],
    yesterday_orders: list[Order],
    previous_seven_days_orders: list[Order],
) -> list[KdsStatsMenuOut]:
    today = _aggregate_menus(today_orders)
    yesterday = _aggregate_menus(yesterday_orders)
    seven_day = _aggregate_menus(previous_seven_days_orders)

    menus: list[KdsStatsMenuOut] = []
    for menu_name, stats in sorted(today.items(), key=lambda item: (-item[1].orders, item[0])):
        menus.append(
            KdsStatsMenuOut(
                menu_name=menu_name,
                orders=stats.orders,
                revenue=stats.revenue,
                average_completion_seconds=_average_seconds(stats.completion_seconds),
                delayed_orders=stats.delayed_orders,
                yesterday_delta_rate=_delta_rate(stats.orders, yesterday.get(menu_name, _MenuStats()).orders),
                seven_day_average_delta_rate=_delta_rate(
                    stats.orders,
                    seven_day.get(menu_name, _MenuStats()).orders / 7,
                )
                if seven_day.get(menu_name)
                else None,
            )
        )
    return menus


def _build_kitchen(
    orders: list[Order],
    hourly: list[KdsStatsHourlyOut],
    menus: list[KdsStatsMenuOut],
) -> KdsStatsKitchenOut:
    completed = _completed_orders(orders)
    delayed_count = sum(1 for order in completed if (_completion_seconds(order) or 0) > DELAYED_ORDER_THRESHOLD_SECONDS)
    slowest = max((_completion_seconds(order) or 0 for order in completed), default=None)
    bottleneck_hour = None
    if hourly:
        bottleneck_hour = max(
            hourly,
            key=lambda item: (item.delayed_orders, item.average_completion_seconds or 0, item.orders),
        ).hour

    bottleneck_candidates = [
        menu for menu in menus if menu.orders >= MENU_BOTTLENECK_MIN_ORDERS and menu.average_completion_seconds is not None
    ]
    bottleneck_menu = None
    if bottleneck_candidates:
        bottleneck_menu = max(
            bottleneck_candidates,
            key=lambda menu: (menu.average_completion_seconds or 0, menu.delayed_orders, menu.orders),
        ).menu_name

    return KdsStatsKitchenOut(
        on_time_rate=_rate(len(completed) - delayed_count, len(completed)) if completed else None,
        slowest_order_seconds=slowest,
        bottleneck_hour=bottleneck_hour,
        bottleneck_menu=bottleneck_menu,
    )


def _build_insights(
    summary: KdsStatsSummaryOut,
    kitchen: KdsStatsKitchenOut,
    seven_day_average: _OrderStats | None,
) -> list[str]:
    if summary.total_orders == 0:
        return ["오늘은 아직 주문이 없어요."]

    insights: list[str] = []
    if seven_day_average and seven_day_average.orders > 0:
        delta_rate = _delta_rate(summary.total_orders, seven_day_average.orders)
        if delta_rate is not None:
            direction = "많아요" if delta_rate >= 0 else "적어요"
            insights.append(f"오늘 주문은 최근 7일 평균보다 {abs(delta_rate):.1f}% {direction}.")
    else:
        insights.append("최근 평균 비교는 주문이 더 쌓이면 표시돼요.")

    if summary.peak_hour:
        insights.append(f"{summary.peak_hour}에 주문이 가장 몰렸어요.")
    if summary.delayed_orders > 0:
        insights.append(f"오늘 지연 주문은 {summary.delayed_orders}건 발생했어요.")
    if kitchen.bottleneck_menu:
        insights.append(f"평균 완료 시간이 가장 긴 메뉴는 {kitchen.bottleneck_menu}예요.")
    if not insights:
        insights.append("아직 분석할 주문이 부족해요.")
    return insights[:3]


def _aggregate_orders(orders: list[Order]) -> _OrderStats:
    stats = _OrderStats(orders=len(orders))
    for order in orders:
        stats.revenue += _order_revenue(order)
        completion_seconds = _completion_seconds(order)
        if completion_seconds is not None:
            stats.completion_seconds.append(completion_seconds)
            if completion_seconds > DELAYED_ORDER_THRESHOLD_SECONDS:
                stats.delayed_orders += 1
    return stats


def _average_daily_stats(
    orders: list[Order],
    start: datetime,
    end: datetime,
) -> _OrderStats | None:
    day_count = max((end.date() - start.date()).days, 0)
    if day_count <= 0 or not orders:
        return None
    stats = _aggregate_orders(orders)
    stats.orders = stats.orders / day_count
    stats.revenue = int(round(stats.revenue / day_count))
    return stats


def _aggregate_menus(orders: list[Order]) -> dict[str, _MenuStats]:
    menus: dict[str, _MenuStats] = defaultdict(_MenuStats)
    for order in orders:
        completion_seconds = _completion_seconds(order)
        delayed = completion_seconds is not None and completion_seconds > DELAYED_ORDER_THRESHOLD_SECONDS
        for item in order.items:
            stats = menus[item.name]
            stats.orders += item.quantity
            stats.revenue += _item_revenue(item)
            if completion_seconds is not None:
                stats.completion_seconds.append(completion_seconds)
                if delayed:
                    stats.delayed_orders += 1
    return menus


def _build_comparison(
    today: _OrderStats,
    baseline: _OrderStats | None,
    *,
    require_baseline: bool,
) -> KdsStatsComparisonBucketOut:
    if baseline is None:
        return KdsStatsComparisonBucketOut()
    if require_baseline and baseline.orders <= 0:
        return KdsStatsComparisonBucketOut()
    today_average = _average_seconds(today.completion_seconds)
    baseline_average = _average_seconds(baseline.completion_seconds)
    return KdsStatsComparisonBucketOut(
        orders_delta=int(round(today.orders - baseline.orders)),
        orders_delta_rate=_delta_rate(today.orders, baseline.orders),
        revenue_delta=today.revenue - baseline.revenue,
        revenue_delta_rate=_delta_rate(today.revenue, baseline.revenue),
        average_completion_seconds_delta=(
            today_average - baseline_average
            if today_average is not None and baseline_average is not None
            else None
        ),
    )


def _completed_orders(orders: list[Order]) -> list[Order]:
    return [order for order in orders if order.status == OrderStatus.DONE and order.completed_at is not None]


def _completion_seconds(order: Order) -> int | None:
    if order.status != OrderStatus.DONE or order.completed_at is None:
        return None
    seconds = int((_as_utc(order.completed_at) - _as_utc(order.created_at)).total_seconds())
    return max(seconds, 0)


def _order_revenue(order: Order) -> int:
    if order.status == OrderStatus.CANCELLED:
        return 0
    return sum(_item_revenue(item) for item in order.items)


def _item_revenue(item: object) -> int:
    total_price = getattr(item, "total_price", None)
    if total_price is not None:
        return int(total_price)
    unit_price = getattr(item, "unit_price", None)
    quantity = getattr(item, "quantity", 0)
    if unit_price is None:
        return 0
    return int(unit_price) * int(quantity)


def _average_seconds(values: list[int]) -> int | None:
    if not values:
        return None
    return int(round(sum(values) / len(values)))


def _rate(numerator: float, denominator: float) -> float:
    if denominator <= 0:
        return 0.0
    return round((numerator / denominator) * 100, 1)


def _delta_rate(current: float, baseline: float) -> float | None:
    if baseline <= 0:
        return None
    return round(((current - baseline) / baseline) * 100, 1)


def _day_start(value: datetime) -> datetime:
    utc_value = _as_utc(value)
    return datetime.combine(utc_value.date(), time.min, tzinfo=UTC)


def _as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)


def _hour_label(hour: int) -> str:
    next_hour = (hour + 1) % 24
    return f"{hour:02d}:00~{next_hour:02d}:00"
