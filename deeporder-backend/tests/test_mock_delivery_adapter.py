from datetime import datetime, timezone

import pytest
from fastapi import HTTPException

from app.models import Order
from app.normalization import NormalizedOrderEvent
from app.adapters.mock_delivery import MockDeliveryAdapter


def sample_payload() -> dict:
    return {
        "id": "external-top-level-id-should-be-ignored",
        "eventId": "evt_adapter_001",
        "eventType": "ORDER_CREATED",
        "platform": "MOCK_DELIVERY",
        "storeId": "STORE_FLAT",
        "order": {
            "id": "external-order-row-id-should-be-ignored",
            "orderId": "ORDER_001",
            "orderNumber": "A-001",
            "customerRequest": "양상추 빼주세요.",
            "deliveryRequest": "문 앞에 놓아주세요.",
            "deliveryPhone": "010-1234-5678",
            "deliveryZipNo": "04524",
            "deliveryRoadAddress": "서울 중구 세종대로 110",
            "deliveryJibunAddress": "서울 중구 태평로1가 31",
            "deliveryAddressDetail": "101호",
            "orderedAt": "2026-06-12T12:34:56+00:00",
            "createdAt": "1999-01-01T00:00:00+00:00",
            "updatedAt": "1998-01-01T00:00:00+00:00",
            "items": [
                {
                    "id": "external-item-row-id-should-be-ignored",
                    "itemId": "ITEM_EXT_001",
                    "name": "제육덮밥",
                    "quantity": 2,
                    "options": ["맵기: 보통", "치즈 추가"],
                    "unitPrice": 9000,
                    "totalPrice": 18000,
                }
            ],
        },
    }


def test_mock_delivery_adapter_can_handle_mock_platform() -> None:
    adapter = MockDeliveryAdapter()

    assert adapter.can_handle({}, sample_payload()) is True
    assert adapter.can_handle({}, {"platform": "BAEMIN"}) is False


def test_mock_delivery_adapter_signature_validation_is_explicit_noop() -> None:
    adapter = MockDeliveryAdapter()

    assert adapter.validate_signature({}, b"{}", sample_payload()) is None


def test_mock_delivery_adapter_parses_normalized_event() -> None:
    adapter = MockDeliveryAdapter()
    headers = {
        "content-type": "application/json",
        "x-test-header": "adapter-check",
    }

    normalized = adapter.parse_event(headers, sample_payload())

    assert isinstance(normalized, NormalizedOrderEvent)
    assert not isinstance(normalized, Order)

    assert normalized.source_platform == "MOCK_DELIVERY"
    assert normalized.source_event_id == "evt_adapter_001"
    assert normalized.source_event_type == "ORDER_CREATED"
    assert normalized.source_store_id == "STORE_FLAT"
    assert normalized.source_order_id == "ORDER_001"
    assert normalized.source_order_number == "A-001"
    assert normalized.customer_request == "양상추 빼주세요."
    assert normalized.delivery_request == "문 앞에 놓아주세요."
    assert normalized.delivery_phone == "010-1234-5678"
    assert normalized.delivery_zip_no == "04524"
    assert normalized.delivery_road_address == "서울 중구 세종대로 110"
    assert normalized.delivery_jibun_address == "서울 중구 태평로1가 31"
    assert normalized.delivery_address_detail == "101호"
    assert normalized.source_occurred_at == datetime(2026, 6, 12, 12, 34, 56, tzinfo=timezone.utc)
    assert normalized.raw_payload == sample_payload()
    assert normalized.raw_headers == headers

    assert len(normalized.items) == 1
    item = normalized.items[0]
    assert item.external_line_id == "ITEM_EXT_001"
    assert item.name == "제육덮밥"
    assert item.quantity == 2
    assert item.unit_price == 9000
    assert item.total_price == 18000

    assert len(item.options) == 2
    assert item.options[0].group_name == "맵기"
    assert item.options[0].option_name == "보통"
    assert item.options[0].raw_option == "맵기: 보통"
    assert item.options[1].group_name is None
    assert item.options[1].option_name == "치즈 추가"
    assert item.options[1].raw_option == "치즈 추가"


def test_mock_delivery_adapter_parses_selected_options_only() -> None:
    adapter = MockDeliveryAdapter()
    payload = sample_payload()
    item_payload = payload["order"]["items"][0]
    item_payload.pop("options")
    item_payload["selectedOptions"] = [
        {
            "groupName": "식사1",
            "optionName": "짜장면",
            "effect": "LINK_MENU",
            "additionalPrice": 0,
        },
        {
            "groupName": "식사2",
            "optionName": "짬뽕",
            "effect": "LINK_MENU",
            "additionalPrice": 1000,
        },
    ]

    normalized = adapter.parse_event({}, payload)
    options = normalized.items[0].options

    assert len(options) == 2
    assert options[0].group_name == "식사1"
    assert options[0].option_name == "짜장면"
    assert options[0].additional_price == 0
    assert options[0].model_extra["effect"] == "LINK_MENU"
    assert options[1].group_name == "식사2"
    assert options[1].option_name == "짬뽕"
    assert options[1].additional_price == 1000


def test_mock_delivery_adapter_preserves_options_and_selected_options_order_and_duplicates() -> None:
    adapter = MockDeliveryAdapter()
    payload = sample_payload()
    item_payload = payload["order"]["items"][0]
    item_payload["options"] = ["맵기: 보통", "맵기: 보통"]
    item_payload["selectedOptions"] = [
        {"groupName": "탕수육", "optionName": "소"},
        {"groupName": "탕수육", "optionName": "소"},
    ]

    normalized = adapter.parse_event({}, payload)
    options = normalized.items[0].options

    assert [(option.group_name, option.option_name) for option in options] == [
        ("맵기", "보통"),
        ("맵기", "보통"),
        ("탕수육", "소"),
        ("탕수육", "소"),
    ]


def test_mock_delivery_adapter_rejects_non_array_selected_options() -> None:
    adapter = MockDeliveryAdapter()
    payload = sample_payload()
    payload["order"]["items"][0]["selectedOptions"] = {"groupName": "맵기", "optionName": "보통"}

    with pytest.raises(HTTPException) as exc_info:
        adapter.parse_event({}, payload)

    assert exc_info.value.status_code == 422
    assert exc_info.value.detail == "Invalid mock delivery payload: item.selectedOptions must be an array."


def test_mock_delivery_adapter_normalizes_blank_delivery_info_to_none() -> None:
    adapter = MockDeliveryAdapter()
    payload = sample_payload()
    payload["order"]["deliveryPhone"] = " "
    payload["order"]["deliveryZipNo"] = ""
    payload["order"]["deliveryRoadAddress"] = " "
    payload["order"]["deliveryJibunAddress"] = ""
    payload["order"]["deliveryAddressDetail"] = " "

    normalized = adapter.parse_event({}, payload)

    assert normalized.delivery_phone is None
    assert normalized.delivery_zip_no is None
    assert normalized.delivery_road_address is None
    assert normalized.delivery_jibun_address is None
    assert normalized.delivery_address_detail is None
