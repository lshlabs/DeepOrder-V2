from __future__ import annotations

from copy import deepcopy
from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Order, OrderStatus, WebhookEvent

DELIVERY_INFO_RETENTION = timedelta(hours=1)
REDACTED_DELIVERY_VALUE = "***"

DELIVERY_PAYLOAD_KEYS = {
    "deliveryPhone",
    "deliveryZipNo",
    "deliveryRoadAddress",
    "deliveryJibunAddress",
    "deliveryAddressDetail",
}


def set_order_status_with_privacy(order: Order, status: OrderStatus, *, now: datetime | None = None) -> None:
    now = now or datetime.now(UTC)
    previous_status = order.status
    order.status = status

    if status == OrderStatus.DONE and previous_status != OrderStatus.DONE:
        order.completed_at = now
    elif status != OrderStatus.DONE:
        order.completed_at = None


def redact_expired_delivery_info(db: Session, orders: list[Order], *, now: datetime | None = None) -> bool:
    now = now or datetime.now(UTC)
    changed = False
    for order in orders:
        if should_redact_delivery_info(order, now=now):
            redact_order_delivery_info(db, order, now=now)
            changed = True
    return changed


def should_redact_delivery_info(order: Order, *, now: datetime) -> bool:
    if order.status != OrderStatus.DONE:
        return False
    if order.delivery_info_redacted_at is not None:
        return False
    if order.completed_at is None:
        return False
    return _as_utc(order.completed_at) + DELIVERY_INFO_RETENTION <= now


def redact_order_delivery_info(db: Session, order: Order, *, now: datetime | None = None) -> None:
    now = now or datetime.now(UTC)
    had_delivery_info = _order_has_delivery_info(order)

    order.delivery_phone = None
    order.delivery_zip_no = None
    order.delivery_road_address = None
    order.delivery_jibun_address = None
    order.delivery_address_detail = None

    redacted_raw_payload = _redact_payload(order.raw_payload)
    if redacted_raw_payload != order.raw_payload:
        order.raw_payload = redacted_raw_payload
        had_delivery_info = True

    for event in _webhook_events_for_order(db, order):
        redacted_event_payload = _redact_payload(event.raw_payload)
        if redacted_event_payload != event.raw_payload:
            event.raw_payload = redacted_event_payload
            had_delivery_info = True

    if had_delivery_info:
        order.delivery_info_redacted_at = now


def delivery_response_value(order: Order, value: str | None) -> str | None:
    if order.delivery_info_redacted_at is not None:
        return REDACTED_DELIVERY_VALUE
    return value


def _order_has_delivery_info(order: Order) -> bool:
    return any(
        value is not None
        for value in (
            order.delivery_phone,
            order.delivery_zip_no,
            order.delivery_road_address,
            order.delivery_jibun_address,
            order.delivery_address_detail,
        )
    )


def _webhook_events_for_order(db: Session, order: Order) -> list[WebhookEvent]:
    events = db.scalars(
        select(WebhookEvent).where(
            WebhookEvent.platform == order.platform,
            WebhookEvent.store_id == order.store_id,
        )
    ).all()
    return [
        event
        for event in events
        if _payload_order_id(event.raw_payload) == order.external_order_id
    ]


def _payload_order_id(payload: dict[str, Any] | None) -> str | None:
    if not isinstance(payload, dict):
        return None
    order_payload = payload.get("order")
    if not isinstance(order_payload, dict):
        return None
    order_id = order_payload.get("orderId")
    return order_id if isinstance(order_id, str) else None


def _redact_payload(payload: dict[str, Any] | None) -> dict[str, Any] | None:
    if not isinstance(payload, dict):
        return payload

    redacted = deepcopy(payload)
    order_payload = redacted.get("order")
    if isinstance(order_payload, dict):
        for key in DELIVERY_PAYLOAD_KEYS:
            order_payload.pop(key, None)
    return redacted


def _as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)
