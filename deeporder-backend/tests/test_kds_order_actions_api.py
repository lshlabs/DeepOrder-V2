from fastapi.testclient import TestClient

from app.config import get_settings  # noqa: E402
from app.database import Base, engine  # noqa: E402
from app.main import app  # noqa: E402


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


def sample_payload(
    *,
    event_id: str,
    order_id: str,
    store_id: str,
    order_number: str,
    quantity: int = 1,
) -> dict:
    return {
        "eventId": event_id,
        "eventType": "ORDER_CREATED",
        "platform": "MOCK_DELIVERY",
        "storeId": store_id,
        "order": {
            "orderId": order_id,
            "orderNumber": order_number,
            "customerRequest": "양파 빼주세요.",
            "deliveryRequest": "문 앞",
            "items": [
                {
                    "name": "후라이드치킨",
                    "quantity": quantity,
                    "options": ["콜라 추가"],
                    "unitPrice": 18000,
                    "totalPrice": 18000 * quantity,
                }
            ],
        },
    }


def setup_function() -> None:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


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


def test_order_hide_archive_and_item_progress_persist_in_kds_orders() -> None:
    with TestClient(app) as client:
        owner = register_approve_and_login(
            client,
            login_id="owner-order-actions",
            store_name="Order Action Store",
        )

        webhook = client.post(
            "/api/external/orders/webhook",
            json=sample_payload(
                event_id="evt-action-1",
                order_id="order-action-1",
                store_id=owner["store"]["storeId"],
                order_number="OA-001",
            ),
        )
        assert webhook.status_code == 200

        orders_response = client.get("/api/kds/orders", headers=auth_header(owner["accessToken"]))
        assert orders_response.status_code == 200
        order = orders_response.json()["orders"][0]
        item = order["items"][0]
        assert order["hidden"] is False
        assert order["archived"] is False
        assert order["deliveryPhone"] is None
        assert order["deliveryZipNo"] is None
        assert order["deliveryRoadAddress"] is None
        assert order["deliveryJibunAddress"] is None
        assert order["deliveryAddressDetail"] is None
        assert item["done"] is False
        assert item["targetQuantity"] == 1
        assert item["completedQuantity"] == 0
        assert item["options"][0]["label"] == "콜라 추가"
        assert item["options"][0]["targetQuantity"] == 1
        assert item["options"][0]["completedQuantity"] == 0

        progress = client.patch(
            f"/api/kds/order-items/{item['id']}/progress",
            json={"done": True},
            headers=auth_header(owner["accessToken"]),
        )
        assert progress.status_code == 200
        assert progress.json()["done"] is True
        assert progress.json()["targetQuantity"] == 1
        assert progress.json()["completedQuantity"] == 1
        assert progress.json()["doneAt"] is not None

        orders_after_progress = client.get("/api/kds/orders", headers=auth_header(owner["accessToken"]))
        progressed_item = orders_after_progress.json()["orders"][0]["items"][0]
        assert progressed_item["done"] is True
        assert progressed_item["completedQuantity"] == 1
        assert progressed_item["doneAt"] is not None
        assert progressed_item["options"][0]["done"] is False
        assert progressed_item["options"][0]["completedQuantity"] == 0

        hidden = client.patch(
            f"/api/kds/orders/{order['id']}/hide",
            headers=auth_header(owner["accessToken"]),
        )
        assert hidden.status_code == 200
        assert hidden.json() == {"orderId": order["id"], "hidden": True}

        orders_after_hide = client.get("/api/kds/orders", headers=auth_header(owner["accessToken"]))
        hidden_order = orders_after_hide.json()["orders"][0]
        assert hidden_order["hidden"] is True
        assert hidden_order["hiddenAt"] is not None

        status_done = client.patch(
            f"/api/orders/{order['id']}/status",
            json={"status": "DONE"},
            headers=auth_header(owner["accessToken"]),
        )
        assert status_done.status_code == 200

        archived = client.post(
            "/api/kds/orders/archive-completed",
            headers=auth_header(owner["accessToken"]),
        )
        assert archived.status_code == 200
        assert archived.json()["archivedCount"] == 1

        orders_after_archive = client.get("/api/kds/orders", headers=auth_header(owner["accessToken"]))
        archived_order = orders_after_archive.json()["orders"][0]
        assert archived_order["archived"] is True
        assert archived_order["archivedAt"] is not None


def test_order_board_actions_block_other_store_access() -> None:
    with TestClient(app) as client:
        owner_one = register_approve_and_login(
            client,
            login_id="owner-order-one",
            store_name="Order One",
        )
        owner_two = register_approve_and_login(
            client,
            login_id="owner-order-two",
            store_name="Order Two",
        )

        webhook = client.post(
            "/api/external/orders/webhook",
            json=sample_payload(
                event_id="evt-action-scope",
                order_id="order-action-scope",
                store_id=owner_two["store"]["storeId"],
                order_number="OA-002",
            ),
        )
        assert webhook.status_code == 200

        orders_response = client.get("/api/kds/orders", headers=auth_header(owner_two["accessToken"]))
        assert orders_response.status_code == 200
        order = orders_response.json()["orders"][0]
        item = order["items"][0]

        forbidden_hide = client.patch(
            f"/api/kds/orders/{order['id']}/hide",
            headers=auth_header(owner_one["accessToken"]),
        )
        assert forbidden_hide.status_code == 403

        forbidden_progress = client.patch(
            f"/api/kds/order-items/{item['id']}/progress",
            json={"done": True},
            headers=auth_header(owner_one["accessToken"]),
        )
        assert forbidden_progress.status_code == 403

        forbidden_option_progress = client.patch(
            f"/api/kds/order-items/{item['id']}/options/0/progress",
            json={"delta": 1},
            headers=auth_header(owner_one["accessToken"]),
        )
        assert forbidden_option_progress.status_code == 403


def test_quantity_progress_and_option_progress_persist_in_kds_orders() -> None:
    with TestClient(app) as client:
        owner = register_approve_and_login(
            client,
            login_id="owner-quantity-progress",
            store_name="Quantity Progress Store",
        )

        webhook = client.post(
            "/api/external/orders/webhook",
            json=sample_payload(
                event_id="evt-quantity-progress",
                order_id="order-quantity-progress",
                store_id=owner["store"]["storeId"],
                order_number="QP-001",
                quantity=2,
            ),
        )
        assert webhook.status_code == 200

        orders_response = client.get("/api/kds/orders", headers=auth_header(owner["accessToken"]))
        item = orders_response.json()["orders"][0]["items"][0]
        assert item["targetQuantity"] == 2
        assert item["completedQuantity"] == 0
        assert item["done"] is False
        assert item["options"][0]["targetQuantity"] == 2
        assert item["options"][0]["completedQuantity"] == 0

        first_progress = client.patch(
            f"/api/kds/order-items/{item['id']}/progress",
            json={"delta": 1},
            headers=auth_header(owner["accessToken"]),
        )
        assert first_progress.status_code == 200
        assert first_progress.json()["completedQuantity"] == 1
        assert first_progress.json()["done"] is False

        orders_after_first = client.get("/api/kds/orders", headers=auth_header(owner["accessToken"]))
        first_item = orders_after_first.json()["orders"][0]["items"][0]
        assert first_item["completedQuantity"] == 1
        assert first_item["done"] is False
        assert first_item["options"][0]["completedQuantity"] == 0
        assert first_item["options"][0]["done"] is False

        second_progress = client.patch(
            f"/api/kds/order-items/{item['id']}/progress",
            json={"delta": 1},
            headers=auth_header(owner["accessToken"]),
        )
        assert second_progress.status_code == 200
        assert second_progress.json()["completedQuantity"] == 2
        assert second_progress.json()["done"] is True

        orders_after_second = client.get("/api/kds/orders", headers=auth_header(owner["accessToken"]))
        second_item = orders_after_second.json()["orders"][0]["items"][0]
        assert second_item["completedQuantity"] == 2
        assert second_item["done"] is True
        assert second_item["options"][0]["completedQuantity"] == 0
        assert second_item["options"][0]["done"] is False

        option_progress = client.patch(
            f"/api/kds/order-items/{item['id']}/options/0/progress",
            json={"completedQuantity": 2},
            headers=auth_header(owner["accessToken"]),
        )
        assert option_progress.status_code == 200
        assert option_progress.json()["optionIndex"] == 0
        assert option_progress.json()["completedQuantity"] == 2
        assert option_progress.json()["done"] is True

        orders_after_option_progress = client.get("/api/kds/orders", headers=auth_header(owner["accessToken"]))
        option_progress_item = orders_after_option_progress.json()["orders"][0]["items"][0]
        assert option_progress_item["completedQuantity"] == 2
        assert option_progress_item["options"][0]["completedQuantity"] == 2
        assert option_progress_item["options"][0]["done"] is True
        assert option_progress_item["done"] is True


def test_item_and_option_progress_do_not_auto_sync() -> None:
    with TestClient(app) as client:
        owner = register_approve_and_login(
            client,
            login_id="owner-independent-progress",
            store_name="Independent Progress Store",
        )

        webhook = client.post(
            "/api/external/orders/webhook",
            json=sample_payload(
                event_id="evt-independent-progress",
                order_id="order-independent-progress",
                store_id=owner["store"]["storeId"],
                order_number="IP-001",
                quantity=2,
            ),
        )
        assert webhook.status_code == 200

        orders_response = client.get("/api/kds/orders", headers=auth_header(owner["accessToken"]))
        item = orders_response.json()["orders"][0]["items"][0]

        option_complete = client.patch(
            f"/api/kds/order-items/{item['id']}/options/0/progress",
            json={"completedQuantity": 2},
            headers=auth_header(owner["accessToken"]),
        )
        assert option_complete.status_code == 200

        orders_after_option = client.get("/api/kds/orders", headers=auth_header(owner["accessToken"]))
        item_after_option = orders_after_option.json()["orders"][0]["items"][0]
        assert item_after_option["completedQuantity"] == 0
        assert item_after_option["done"] is False
        assert item_after_option["options"][0]["completedQuantity"] == 2
        assert item_after_option["options"][0]["done"] is True

        item_complete = client.patch(
            f"/api/kds/order-items/{item['id']}/progress",
            json={"completedQuantity": 2},
            headers=auth_header(owner["accessToken"]),
        )
        assert item_complete.status_code == 200

        option_reset = client.patch(
            f"/api/kds/order-items/{item['id']}/options/0/progress",
            json={"completedQuantity": 0},
            headers=auth_header(owner["accessToken"]),
        )
        assert option_reset.status_code == 200

        orders_after_item = client.get("/api/kds/orders", headers=auth_header(owner["accessToken"]))
        item_after_item = orders_after_item.json()["orders"][0]["items"][0]
        assert item_after_item["completedQuantity"] == 2
        assert item_after_item["done"] is True
        assert item_after_item["options"][0]["completedQuantity"] == 0
        assert item_after_item["options"][0]["done"] is False
