from datetime import UTC, datetime, time, timedelta

from fastapi.testclient import TestClient

from app.config import get_settings
from app.database import Base, SessionLocal, engine
from app.main import app
from app.models import Order, OrderItem, OrderStatus


def setup_function() -> None:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def register_payload(login_id: str, store_name: str) -> dict:
    return {
        "name": store_name,
        "loginId": login_id,
        "password": "password1234",
        "storeName": store_name,
        "storePhone": "010-0000-0000",
        "zipNo": "12345",
        "roadAddress": "서울시 테스트로 1",
        "jibunAddress": "서울시 테스트동 1-1",
        "addressDetail": "101호",
    }


def register_approve_and_login(client: TestClient, *, login_id: str, store_name: str) -> dict:
    registered = client.post("/api/auth/register", json=register_payload(login_id, store_name))
    assert registered.status_code == 201
    user_id = registered.json()["user"]["id"]
    approved = client.patch(
        f"/api/admin/users/{user_id}/approval",
        json={"approvalStatus": "APPROVED"},
        headers={"X-Admin-Token": get_settings().admin_token},
    )
    assert approved.status_code == 200
    logged_in = client.post(
        "/api/auth/login",
        json={"loginId": login_id, "password": "password1234"},
    )
    assert logged_in.status_code == 200
    return logged_in.json()


def auth_header(access_token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {access_token}"}


def test_kds_stats_returns_summary_hourly_menu_kitchen_and_insights() -> None:
    with TestClient(app) as client:
        owner = register_approve_and_login(
            client,
            login_id="owner-stats",
            store_name="Stats Store",
        )

        today = datetime.combine(datetime.now(UTC).date(), time.min, tzinfo=UTC)
        _create_order(
            store_id=owner["store"]["storeId"],
            external_order_id="today-fast",
            order_number="S-001",
            created_at=today + timedelta(hours=10),
            completed_at=today + timedelta(hours=10, minutes=5),
            items=[("짜장면", 2, 7000, 14000)],
        )
        _create_order(
            store_id=owner["store"]["storeId"],
            external_order_id="today-slow",
            order_number="S-002",
            created_at=today + timedelta(hours=12),
            completed_at=today + timedelta(hours=12, minutes=13),
            items=[("짬뽕", 1, 9000, 9000), ("짜장면", 1, 7000, 7000)],
        )
        _create_order(
            store_id=owner["store"]["storeId"],
            external_order_id="today-new",
            order_number="S-003",
            created_at=today + timedelta(hours=12, minutes=20),
            status=OrderStatus.NEW,
            items=[("탕수육", 1, 18000, 18000)],
        )
        _create_order(
            store_id=owner["store"]["storeId"],
            external_order_id="yesterday",
            order_number="S-004",
            created_at=today - timedelta(hours=2),
            completed_at=today - timedelta(hours=1, minutes=54),
            items=[("짜장면", 1, 7000, 7000)],
        )

        response = client.get("/api/kds/stats", headers=auth_header(owner["accessToken"]))

    assert response.status_code == 200
    body = response.json()
    assert body["date"] == today.date().isoformat()
    assert body["summary"] == {
        "total_orders": 3,
        "completed_orders": 2,
        "completion_rate": 66.7,
        "revenue": 48000,
        "average_completion_seconds": 540,
        "delayed_orders": 1,
        "peak_hour": "12:00~13:00",
    }
    assert body["comparison"]["vs_yesterday"]["orders_delta"] == 2
    assert body["comparison"]["vs_7d_average"]["orders_delta_rate"] is not None
    assert body["hourly"][1] == {
        "hour": "12:00~13:00",
        "orders": 2,
        "revenue": 34000,
        "average_completion_seconds": 780,
        "delayed_orders": 1,
    }
    jjajang = next(menu for menu in body["menus"] if menu["menu_name"] == "짜장면")
    assert jjajang["orders"] == 3
    assert jjajang["revenue"] == 21000
    assert jjajang["average_completion_seconds"] == 540
    assert jjajang["delayed_orders"] == 1
    assert body["kitchen"]["on_time_rate"] == 50.0
    assert body["kitchen"]["slowest_order_seconds"] == 780
    assert body["kitchen"]["bottleneck_hour"] == "12:00~13:00"
    assert body["kitchen"]["bottleneck_menu"] == "짜장면"
    assert len(body["insights"]) >= 2


def test_kds_stats_handles_empty_store() -> None:
    with TestClient(app) as client:
        owner = register_approve_and_login(
            client,
            login_id="owner-empty-stats",
            store_name="Empty Stats Store",
        )

        response = client.get("/api/kds/stats", headers=auth_header(owner["accessToken"]))

    assert response.status_code == 200
    body = response.json()
    assert body["summary"]["total_orders"] == 0
    assert body["summary"]["average_completion_seconds"] is None
    assert body["summary"]["peak_hour"] is None
    assert body["hourly"] == []
    assert body["menus"] == []
    assert body["kitchen"]["on_time_rate"] is None
    assert body["insights"] == ["오늘은 아직 주문이 없어요."]


def _create_order(
    *,
    store_id: str,
    external_order_id: str,
    order_number: str,
    created_at: datetime,
    items: list[tuple[str, int, int, int]],
    status: OrderStatus = OrderStatus.DONE,
    completed_at: datetime | None = None,
) -> None:
    with SessionLocal() as db:
        order = Order(
            platform="MOCK_DELIVERY",
            store_id=store_id,
            external_order_id=external_order_id,
            order_number=order_number,
            status=status,
            completed_at=completed_at,
            created_at=created_at,
            updated_at=created_at,
            raw_payload={},
        )
        order.items = [
            OrderItem(name=name, quantity=quantity, unit_price=unit_price, total_price=total_price)
            for name, quantity, unit_price, total_price in items
        ]
        db.add(order)
        db.commit()
