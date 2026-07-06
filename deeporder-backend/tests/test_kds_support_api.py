from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient
import httpx
from sqlalchemy import select

from app.auth import create_access_token, hash_password
from app.config import get_settings  # noqa: E402
from app.database import Base, SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.models import (  # noqa: E402
    AccountType,
    ApprovalStatus,
    SupportConversation,
    SupportConversationMode,
    SupportConversationStatus,
    SupportEvent,
    SupportMessage,
    SupportMessageSenderType,
    User,
    UserRole,
)


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


def create_same_store_owner_token(owner: dict, *, login_id: str) -> str:
    with SessionLocal() as db:
        other_owner = User(
            login_id=login_id,
            password_hash=hash_password("password1234"),
            name="Other Owner",
            role=UserRole.STORE_OWNER,
            account_type=AccountType.OWNER,
            approval_status=ApprovalStatus.APPROVED,
            store_id=owner["store"]["storeId"],
        )
        db.add(other_owner)
        db.commit()
        db.refresh(other_owner)
        return create_access_token(other_owner.id)


def create_conversation(client: TestClient, access_token: str, *, source: str = "kds-web") -> dict:
    response = client.post(
        "/api/kds/support/conversations",
        headers=auth_header(access_token),
        json={"source": source},
    )
    assert response.status_code == 201
    return response.json()


def parse_utc(value: str) -> datetime:
    return datetime.fromisoformat(value).astimezone(UTC)


def test_support_conversation_create_current_message_and_close_flow() -> None:
    with TestClient(app) as client:
        owner = register_approve_and_login(
            client,
            login_id="support-owner-flow",
            store_name="Support Flow Store",
        )

        empty_current = client.get(
            "/api/kds/support/conversations/current",
            headers=auth_header(owner["accessToken"]),
        )
        assert empty_current.status_code == 200
        assert empty_current.json() is None

        conversation = create_conversation(client, owner["accessToken"])
        conversation_id = conversation["id"]
        assert conversation["store_id"] == owner["store"]["storeId"]
        assert conversation["user_id"] == owner["user"]["id"]
        assert conversation["status"] == "BOT"
        assert conversation["mode"] == "BOT"
        assert conversation["messages"] == []
        created_at = parse_utc(conversation["created_at"])
        expires_at = parse_utc(conversation["expires_at"])
        assert timedelta(minutes=9, seconds=50) <= expires_at - created_at <= timedelta(minutes=10, seconds=10)

        current = client.get(
            "/api/kds/support/conversations/current",
            headers=auth_header(owner["accessToken"]),
        )
        assert current.status_code == 200
        assert current.json()["id"] == conversation_id

        sent = client.post(
            f"/api/kds/support/conversations/{conversation_id}/messages",
            headers=auth_header(owner["accessToken"]),
            json={"content": "주문 알림이 울리지 않아요."},
        )
        assert sent.status_code == 200
        sent_body = sent.json()
        assert sent_body["status"] == "AI"
        assert sent_body["mode"] == "AI"
        assert sent_body["updated_at"].endswith("+00:00")
        sent_updated_at = parse_utc(sent_body["updated_at"])
        sent_expires_at = parse_utc(sent_body["expires_at"])
        assert timedelta(minutes=9, seconds=50) <= sent_expires_at - sent_updated_at <= timedelta(minutes=10, seconds=10)
        assert [message["sender_type"] for message in sent_body["messages"]] == ["USER", "AI"]
        assert sent_body["messages"][0]["sender_id"] == owner["user"]["id"]
        assert sent_body["messages"][0]["content"] == "주문 알림이 울리지 않아요."
        assert sent_body["messages"][0]["created_at"].endswith("+00:00")
        assert sent_body["messages"][1]["metadata_json"]["provider"] == "mock"
        assert sent_body["messages"][1]["metadata_json"]["fallback"] is False
        assert sent_body["messages"][1]["metadata_json"]["prompt_version"] == "support-v1"

        closed = client.post(
            f"/api/kds/support/conversations/{conversation_id}/close",
            headers=auth_header(owner["accessToken"]),
        )
        assert closed.status_code == 200
        closed_body = closed.json()
        assert closed_body["status"] == "CLOSED"
        assert closed_body["closed_at"] is not None
        assert closed_body["messages"][-1]["sender_type"] == "SYSTEM"

        send_after_close = client.post(
            f"/api/kds/support/conversations/{conversation_id}/messages",
            headers=auth_header(owner["accessToken"]),
            json={"content": "닫힌 후 메시지"},
        )
        assert send_after_close.status_code == 409


def test_support_conversation_access_is_scoped_to_current_store() -> None:
    with TestClient(app) as client:
        owner_one = register_approve_and_login(
            client,
            login_id="support-owner-one",
            store_name="Support One",
        )
        owner_two = register_approve_and_login(
            client,
            login_id="support-owner-two",
            store_name="Support Two",
        )

        conversation = create_conversation(client, owner_two["accessToken"])
        conversation_id = conversation["id"]

        forbidden_get = client.get(
            f"/api/kds/support/conversations/{conversation_id}",
            headers=auth_header(owner_one["accessToken"]),
        )
        assert forbidden_get.status_code == 404

        forbidden_message = client.post(
            f"/api/kds/support/conversations/{conversation_id}/messages",
            headers=auth_header(owner_one["accessToken"]),
            json={"content": "타 매장 접근"},
        )
        assert forbidden_message.status_code == 404

        owner_one_list = client.get(
            "/api/kds/support/conversations",
            headers=auth_header(owner_one["accessToken"]),
        )
        assert owner_one_list.status_code == 200
        assert owner_one_list.json()["conversations"] == []


def test_expired_support_conversation_is_not_current_and_cannot_receive_messages() -> None:
    with TestClient(app) as client:
        owner = register_approve_and_login(
            client,
            login_id="support-owner-expired",
            store_name="Support Expired",
        )
        conversation = create_conversation(client, owner["accessToken"])
        conversation_id = conversation["id"]

        with SessionLocal() as db:
            saved = db.get(SupportConversation, conversation_id)
            assert saved is not None
            saved.expires_at = datetime.now(UTC) - timedelta(minutes=1)
            db.commit()

        current = client.get(
            "/api/kds/support/conversations/current",
            headers=auth_header(owner["accessToken"]),
        )
        assert current.status_code == 200
        assert current.json() is None

        send_expired = client.post(
            f"/api/kds/support/conversations/{conversation_id}/messages",
            headers=auth_header(owner["accessToken"]),
            json={"content": "만료된 상담 메시지"},
        )
        assert send_expired.status_code == 409

        with SessionLocal() as db:
            expired = db.get(SupportConversation, conversation_id)
            assert expired is not None
            assert expired.status == SupportConversationStatus.EXPIRED


def test_support_message_uses_direct_llm_provider_when_configured(monkeypatch) -> None:
    settings = get_settings()
    monkeypatch.setattr(settings, "support_ai_provider", "direct_llm")
    monkeypatch.setattr(settings, "openai_api_key", "test-key")
    monkeypatch.setattr(settings, "openai_model", "test-model")

    class FakeResponse:
        def raise_for_status(self) -> None:
            return None

        def json(self) -> dict:
            return {
                "choices": [
                    {
                        "message": {
                            "content": (
                                '{"content":"알림 설정과 브라우저 권한을 확인해 주세요.",'
                                '"summary":"알림 문제",'
                                '"shouldRecommendHandoff":false,'
                                '"handoffReason":null,'
                                '"confidence":0.91}'
                            )
                        }
                    }
                ]
            }

    def fake_post(*args, **kwargs) -> FakeResponse:
        assert args[0].endswith("/chat/completions")
        assert kwargs["headers"]["Authorization"] == "Bearer test-key"
        assert kwargs["json"]["model"] == "test-model"
        return FakeResponse()

    monkeypatch.setattr("app.services.support_ai_direct_llm.httpx.post", fake_post)

    with TestClient(app) as client:
        owner = register_approve_and_login(
            client,
            login_id="support-owner-direct",
            store_name="Support Direct",
        )
        conversation = create_conversation(client, owner["accessToken"])

        sent = client.post(
            f"/api/kds/support/conversations/{conversation['id']}/messages",
            headers=auth_header(owner["accessToken"]),
            json={"content": "알림이 울리지 않아요."},
        )

        assert sent.status_code == 200
        ai_message = sent.json()["messages"][1]
        assert ai_message["sender_type"] == "AI"
        assert ai_message["content"] == "알림 설정과 브라우저 권한을 확인해 주세요."
        assert ai_message["metadata_json"]["provider"] == "direct_llm"
        assert ai_message["metadata_json"]["summary"] == "알림 문제"
        assert ai_message["metadata_json"]["confidence"] == 0.91
        assert ai_message["metadata_json"]["model"] == "test-model"
        assert ai_message["metadata_json"]["retry_count"] == 0


def test_support_message_returns_ai_fallback_when_direct_llm_is_not_configured(monkeypatch) -> None:
    settings = get_settings()
    monkeypatch.setattr(settings, "support_ai_provider", "direct_llm")
    monkeypatch.setattr(settings, "openai_api_key", "")
    monkeypatch.setattr(settings, "openai_model", "")

    with TestClient(app) as client:
        owner = register_approve_and_login(
            client,
            login_id="support-owner-direct-missing",
            store_name="Support Direct Missing Config",
        )
        conversation = create_conversation(client, owner["accessToken"])

        sent = client.post(
            f"/api/kds/support/conversations/{conversation['id']}/messages",
            headers=auth_header(owner["accessToken"]),
            json={"content": "AI 상담 가능한가요?"},
        )

        assert sent.status_code == 200
        body = sent.json()
        assert body["status"] == "AI"
        assert body["mode"] == "AI"
        ai_message = body["messages"][1]
        assert ai_message["sender_type"] == "AI"
        assert ai_message["content"] == "현재 AI 상담 서비스가 준비 중입니다. 잠시 후 다시 이용해 주세요."
        assert ai_message["metadata_json"]["provider"] == "direct_llm"
        assert ai_message["metadata_json"]["fallback"] is True
        assert ai_message["metadata_json"]["error_type"] == "configuration_missing"
        assert ai_message["metadata_json"]["retry_count"] == 0


def test_support_ai_failure_preserves_user_message_and_stores_ai_fallback(monkeypatch) -> None:
    settings = get_settings()
    monkeypatch.setattr(settings, "support_ai_provider", "direct_llm")
    monkeypatch.setattr(settings, "openai_api_key", "test-key")
    monkeypatch.setattr(settings, "openai_model", "test-model")

    def fake_post(*args, **kwargs):
        raise httpx.ConnectError("network unavailable")

    monkeypatch.setattr("app.services.support_ai_direct_llm.httpx.post", fake_post)

    with TestClient(app) as client:
        owner = register_approve_and_login(
            client,
            login_id="support-owner-ai-fail",
            store_name="Support AI Fail",
        )
        conversation = create_conversation(client, owner["accessToken"])

        sent = client.post(
            f"/api/kds/support/conversations/{conversation['id']}/messages",
            headers=auth_header(owner["accessToken"]),
            json={"content": "AI 실패 테스트"},
        )

        assert sent.status_code == 200
        messages = sent.json()["messages"]
        assert messages[0]["sender_type"] == "USER"
        assert messages[0]["content"] == "AI 실패 테스트"
        assert messages[1]["sender_type"] == "AI"
        assert messages[1]["content"] == "현재 AI 상담 연결이 원활하지 않습니다. 잠시 후 다시 시도하거나 상담원 연결을 요청해 주세요."
        assert messages[1]["metadata_json"]["provider"] == "direct_llm"
        assert messages[1]["metadata_json"]["fallback"] is True
        assert messages[1]["metadata_json"]["error_type"] == "ConnectError"
        assert messages[1]["metadata_json"]["error_message"] == "provider request failed"
        assert messages[1]["metadata_json"]["retry_count"] == 1
        assert "AI 실패 테스트" not in messages[1]["metadata_json"]["error_message"]


def test_support_direct_llm_retries_once_and_stores_retry_metadata(monkeypatch) -> None:
    settings = get_settings()
    monkeypatch.setattr(settings, "support_ai_provider", "direct_llm")
    monkeypatch.setattr(settings, "openai_api_key", "test-key")
    monkeypatch.setattr(settings, "openai_model", "test-model")

    class FakeResponse:
        def raise_for_status(self) -> None:
            return None

        def json(self) -> dict:
            return {
                "choices": [
                    {
                        "message": {
                            "content": (
                                '{"content":"재시도 후 응답입니다.",'
                                '"summary":"재시도",'
                                '"shouldRecommendHandoff":true,'
                                '"handoffReason":"retry_success",'
                                '"confidence":0.82}'
                            )
                        }
                    }
                ],
                "usage": {"prompt_tokens": 11, "completion_tokens": 7},
            }

    calls = {"count": 0}

    def fake_post(*args, **kwargs):
        calls["count"] += 1
        if calls["count"] == 1:
            raise httpx.ConnectError("transient")
        return FakeResponse()

    monkeypatch.setattr("app.services.support_ai_direct_llm.httpx.post", fake_post)

    with TestClient(app) as client:
        owner = register_approve_and_login(
            client,
            login_id="support-owner-retry-ok",
            store_name="Support Retry OK",
        )
        conversation = create_conversation(client, owner["accessToken"])

        sent = client.post(
            f"/api/kds/support/conversations/{conversation['id']}/messages",
            headers=auth_header(owner["accessToken"]),
            json={"content": "재시도 테스트"},
        )

        assert sent.status_code == 200
        metadata = sent.json()["messages"][1]["metadata_json"]
        assert calls["count"] == 2
        assert metadata["fallback"] is False
        assert metadata["retry_count"] == 1
        assert metadata["input_tokens"] == 11
        assert metadata["output_tokens"] == 7
        assert metadata["handoff_recommended"] is True
        assert metadata["handoff_reason"] == "retry_success"


def test_support_direct_llm_invalid_response_returns_standard_fallback(monkeypatch) -> None:
    settings = get_settings()
    monkeypatch.setattr(settings, "support_ai_provider", "direct_llm")
    monkeypatch.setattr(settings, "openai_api_key", "test-key")
    monkeypatch.setattr(settings, "openai_model", "test-model")

    class FakeResponse:
        def raise_for_status(self) -> None:
            return None

        def json(self) -> dict:
            return {"choices": [{"message": {"content": "not json"}}]}

    monkeypatch.setattr("app.services.support_ai_direct_llm.httpx.post", lambda *args, **kwargs: FakeResponse())

    with TestClient(app) as client:
        owner = register_approve_and_login(
            client,
            login_id="support-owner-parse-fail",
            store_name="Support Parse Fail",
        )
        conversation = create_conversation(client, owner["accessToken"])

        sent = client.post(
            f"/api/kds/support/conversations/{conversation['id']}/messages",
            headers=auth_header(owner["accessToken"]),
            json={"content": "파싱 실패 테스트"},
        )

        assert sent.status_code == 200
        metadata = sent.json()["messages"][1]["metadata_json"]
        assert metadata["provider"] == "direct_llm"
        assert metadata["fallback"] is True
        assert metadata["error_type"] == "invalid_response"
        assert metadata["error_message"] == "provider response was invalid"
        assert metadata["retry_count"] == 0


def test_support_handoff_assign_and_agent_message_flow() -> None:
    with TestClient(app) as client:
        owner = register_approve_and_login(
            client,
            login_id="support-owner-agent",
            store_name="Support Agent",
        )
        conversation = create_conversation(client, owner["accessToken"])
        conversation_id = conversation["id"]

        handoff = client.post(
            f"/api/kds/support/conversations/{conversation_id}/handoff",
            headers=auth_header(owner["accessToken"]),
        )
        assert handoff.status_code == 200
        handoff_body = handoff.json()
        assert handoff_body["status"] == "WAITING_AGENT"
        assert handoff_body["mode"] == "AGENT"
        assert handoff_body["messages"][-1]["sender_type"] == "SYSTEM"
        assert handoff_body["messages"][-1]["content"] == "상담원 연결을 요청했습니다."

        assigned = client.post(
            f"/api/kds/support/conversations/{conversation_id}/assign",
            headers=auth_header(owner["accessToken"]),
        )
        assert assigned.status_code == 200
        assigned_body = assigned.json()
        assert assigned_body["status"] == "AGENT"
        assert assigned_body["assigned_agent_id"] == owner["user"]["id"]
        assert [message["sender_type"] for message in assigned_body["messages"][-2:]] == ["SYSTEM", "AGENT"]

        agent_message = client.post(
            f"/api/kds/support/conversations/{conversation_id}/agent-messages",
            headers=auth_header(owner["accessToken"]),
            json={"content": "알림 권한 화면을 확인해 주세요."},
        )
        assert agent_message.status_code == 200
        agent_body = agent_message.json()
        assert agent_body["messages"][-1]["sender_type"] == "AGENT"
        assert agent_body["messages"][-1]["sender_id"] == owner["user"]["id"]
        assert agent_body["messages"][-1]["content"] == "알림 권한 화면을 확인해 주세요."

        user_message = client.post(
            f"/api/kds/support/conversations/{conversation_id}/messages",
            headers=auth_header(owner["accessToken"]),
            json={"content": "확인했습니다."},
        )
        assert user_message.status_code == 200
        messages = user_message.json()["messages"]
        assert messages[-1]["sender_type"] == "USER"
        assert messages[-1]["content"] == "확인했습니다."
        assert messages[-2]["sender_type"] == "AGENT"

        with SessionLocal() as db:
            saved = db.get(SupportConversation, conversation_id)
            assert saved is not None
            assert saved.status == SupportConversationStatus.AGENT
            assert saved.assigned_agent_id == owner["user"]["id"]
            assert saved.messages[-1].sender_type == SupportMessageSenderType.USER


def test_support_cancel_handoff_returns_waiting_conversation_to_ai() -> None:
    with TestClient(app) as client:
        owner = register_approve_and_login(
            client,
            login_id="support-owner-cancel-handoff",
            store_name="Support Cancel Handoff",
        )
        conversation = create_conversation(client, owner["accessToken"])
        conversation_id = conversation["id"]

        handoff = client.post(
            f"/api/kds/support/conversations/{conversation_id}/handoff",
            headers=auth_header(owner["accessToken"]),
        )
        assert handoff.status_code == 200
        previous_expires_at = handoff.json()["expires_at"]

        cancelled = client.post(
            f"/api/kds/support/conversations/{conversation_id}/cancel-handoff",
            headers=auth_header(owner["accessToken"]),
        )

        assert cancelled.status_code == 200
        body = cancelled.json()
        assert body["status"] == "AI"
        assert body["mode"] == "AI"
        assert body["assigned_agent_id"] is None
        assert body["expires_at"] != previous_expires_at
        assert body["messages"][-2]["sender_type"] == "SYSTEM"
        assert body["messages"][-2]["content"] == "상담원 연결 대기가 종료되었습니다. AI 상담으로 돌아갑니다."
        assert body["messages"][-2]["metadata_json"] == {
            "type": "handoff_cancelled",
            "from_status": "WAITING_AGENT",
            "to_status": "AI",
        }
        assert body["messages"][-1]["sender_type"] == "AI"
        assert body["messages"][-1]["content"] == "추가로 궁금한 점을 자유롭게 입력해 주세요."
        assert body["messages"][-1]["metadata_json"]["type"] == "handoff_cancelled_ai_greeting"

        with SessionLocal() as db:
            event = db.scalar(
                select(SupportEvent).where(
                    SupportEvent.conversation_id == conversation_id,
                    SupportEvent.event_type == "HANDOFF_CANCELLED",
                )
            )
            assert event is not None
            assert event.payload_json == {
                "reason": "user_cancelled_waiting",
                "visible_after_ms": 60000,
            }

        user_message = client.post(
            f"/api/kds/support/conversations/{conversation_id}/messages",
            headers=auth_header(owner["accessToken"]),
            json={"content": "AI 상담으로 다시 질문합니다."},
        )
        assert user_message.status_code == 200
        messages = user_message.json()["messages"]
        assert messages[-2]["sender_type"] == "USER"
        assert messages[-1]["sender_type"] == "AI"


def test_support_cancel_handoff_rejects_non_waiting_statuses() -> None:
    with TestClient(app) as client:
        owner = register_approve_and_login(
            client,
            login_id="support-owner-cancel-status",
            store_name="Support Cancel Status",
        )

        for target_status in [
            SupportConversationStatus.BOT,
            SupportConversationStatus.AI,
            SupportConversationStatus.AGENT,
            SupportConversationStatus.CLOSED,
            SupportConversationStatus.EXPIRED,
        ]:
            conversation = create_conversation(client, owner["accessToken"])
            conversation_id = conversation["id"]
            with SessionLocal() as db:
                saved = db.get(SupportConversation, conversation_id)
                assert saved is not None
                saved.status = target_status
                if target_status == SupportConversationStatus.AGENT:
                    saved.mode = SupportConversationMode.AGENT
                elif target_status == SupportConversationStatus.BOT:
                    saved.mode = SupportConversationMode.BOT
                else:
                    saved.mode = SupportConversationMode.AI
                db.commit()

            cancelled = client.post(
                f"/api/kds/support/conversations/{conversation_id}/cancel-handoff",
                headers=auth_header(owner["accessToken"]),
            )
            assert cancelled.status_code == 409


def test_support_cancel_handoff_is_scoped_to_store_and_user() -> None:
    with TestClient(app) as client:
        owner_one = register_approve_and_login(
            client,
            login_id="support-owner-cancel-one",
            store_name="Support Cancel One",
        )
        owner_two = register_approve_and_login(
            client,
            login_id="support-owner-cancel-two",
            store_name="Support Cancel Two",
        )
        same_store_other_token = create_same_store_owner_token(owner_one, login_id="support-owner-cancel-other")
        conversation = create_conversation(client, owner_one["accessToken"])
        conversation_id = conversation["id"]
        handoff = client.post(
            f"/api/kds/support/conversations/{conversation_id}/handoff",
            headers=auth_header(owner_one["accessToken"]),
        )
        assert handoff.status_code == 200

        other_user = client.post(
            f"/api/kds/support/conversations/{conversation_id}/cancel-handoff",
            headers=auth_header(same_store_other_token),
        )
        assert other_user.status_code == 404

        other_store = client.post(
            f"/api/kds/support/conversations/{conversation_id}/cancel-handoff",
            headers=auth_header(owner_two["accessToken"]),
        )
        assert other_store.status_code == 404


def test_waiting_agent_user_message_does_not_create_ai_reply() -> None:
    with TestClient(app) as client:
        owner = register_approve_and_login(
            client,
            login_id="support-owner-waiting-no-ai",
            store_name="Support Waiting No AI",
        )
        conversation = create_conversation(client, owner["accessToken"])
        conversation_id = conversation["id"]

        handoff = client.post(
            f"/api/kds/support/conversations/{conversation_id}/handoff",
            headers=auth_header(owner["accessToken"]),
        )
        assert handoff.status_code == 200

        sent = client.post(
            f"/api/kds/support/conversations/{conversation_id}/messages",
            headers=auth_header(owner["accessToken"]),
            json={"content": "상담원 기다리는 중 추가 내용입니다."},
        )

        assert sent.status_code == 200
        body = sent.json()
        assert body["status"] == "WAITING_AGENT"
        assert body["mode"] == "AGENT"
        assert [message["sender_type"] for message in body["messages"]] == ["SYSTEM", "USER"]


def test_bot_and_ai_status_create_ai_replies() -> None:
    with TestClient(app) as client:
        owner = register_approve_and_login(
            client,
            login_id="support-owner-ai-transition",
            store_name="Support AI Transition",
        )
        conversation = create_conversation(client, owner["accessToken"])
        conversation_id = conversation["id"]

        first = client.post(
            f"/api/kds/support/conversations/{conversation_id}/messages",
            headers=auth_header(owner["accessToken"]),
            json={"content": "첫 문의"},
        )
        assert first.status_code == 200
        assert [message["sender_type"] for message in first.json()["messages"]] == ["USER", "AI"]

        second = client.post(
            f"/api/kds/support/conversations/{conversation_id}/messages",
            headers=auth_header(owner["accessToken"]),
            json={"content": "추가 문의"},
        )
        assert second.status_code == 200
        assert [message["sender_type"] for message in second.json()["messages"]] == [
            "USER",
            "AI",
            "USER",
            "AI",
        ]


def test_closed_and_expired_conversation_reject_messages_with_409() -> None:
    with TestClient(app) as client:
        owner = register_approve_and_login(
            client,
            login_id="support-owner-closed-expired",
            store_name="Support Closed Expired",
        )
        closed_conversation = create_conversation(client, owner["accessToken"])
        close_response = client.post(
            f"/api/kds/support/conversations/{closed_conversation['id']}/close",
            headers=auth_header(owner["accessToken"]),
        )
        assert close_response.status_code == 200

        send_closed = client.post(
            f"/api/kds/support/conversations/{closed_conversation['id']}/messages",
            headers=auth_header(owner["accessToken"]),
            json={"content": "닫힌 상담"},
        )
        assert send_closed.status_code == 409

        expired_conversation = create_conversation(client, owner["accessToken"])
        with SessionLocal() as db:
            saved = db.get(SupportConversation, expired_conversation["id"])
            assert saved is not None
            saved.status = SupportConversationStatus.EXPIRED
            db.commit()

        send_expired = client.post(
            f"/api/kds/support/conversations/{expired_conversation['id']}/messages",
            headers=auth_header(owner["accessToken"]),
            json={"content": "만료된 상담"},
        )
        assert send_expired.status_code == 409


def test_client_message_id_prevents_duplicate_user_message() -> None:
    with TestClient(app) as client:
        owner = register_approve_and_login(
            client,
            login_id="support-owner-dedupe",
            store_name="Support Dedupe",
        )
        conversation = create_conversation(client, owner["accessToken"])
        payload = {"content": "중복 방지 메시지", "client_message_id": "client-msg-1"}

        first = client.post(
            f"/api/kds/support/conversations/{conversation['id']}/messages",
            headers=auth_header(owner["accessToken"]),
            json=payload,
        )
        second = client.post(
            f"/api/kds/support/conversations/{conversation['id']}/messages",
            headers=auth_header(owner["accessToken"]),
            json=payload,
        )

        assert first.status_code == 200
        assert second.status_code == 200
        assert len(second.json()["messages"]) == 2
        assert second.json()["messages"][0]["client_message_id"] == "client-msg-1"
        assert [message["sender_type"] for message in second.json()["messages"]] == ["USER", "AI"]

        with SessionLocal() as db:
            messages = db.scalars(
                select(SupportMessage).where(SupportMessage.conversation_id == conversation["id"])
            ).all()
            assert len(messages) == 2
            assert sum(1 for message in messages if message.sender_type == SupportMessageSenderType.AI) == 1

        different_client_id = client.post(
            f"/api/kds/support/conversations/{conversation['id']}/messages",
            headers=auth_header(owner["accessToken"]),
            json={"content": "다른 id 메시지", "client_message_id": "client-msg-2"},
        )
        assert different_client_id.status_code == 200
        assert len(different_client_id.json()["messages"]) == 4

        other_conversation = create_conversation(client, owner["accessToken"])
        same_id_other_conversation = client.post(
            f"/api/kds/support/conversations/{other_conversation['id']}/messages",
            headers=auth_header(owner["accessToken"]),
            json={"content": "다른 상담 같은 id", "client_message_id": "client-msg-1"},
        )
        assert same_id_other_conversation.status_code == 200
        assert len(same_id_other_conversation.json()["messages"]) == 2


def test_null_client_message_id_allows_multiple_system_ai_and_agent_messages() -> None:
    with TestClient(app) as client:
        owner = register_approve_and_login(
            client,
            login_id="support-owner-null-client-id",
            store_name="Support Null Client ID",
        )
        conversation = create_conversation(client, owner["accessToken"])
        conversation_id = conversation["id"]

        handoff = client.post(
            f"/api/kds/support/conversations/{conversation_id}/handoff",
            headers=auth_header(owner["accessToken"]),
        )
        assert handoff.status_code == 200
        assigned = client.post(
            f"/api/kds/support/conversations/{conversation_id}/assign",
            headers=auth_header(owner["accessToken"]),
        )
        assert assigned.status_code == 200
        agent_one = client.post(
            f"/api/kds/support/conversations/{conversation_id}/agent-messages",
            headers=auth_header(owner["accessToken"]),
            json={"content": "상담원 메시지 1"},
        )
        agent_two = client.post(
            f"/api/kds/support/conversations/{conversation_id}/agent-messages",
            headers=auth_header(owner["accessToken"]),
            json={"content": "상담원 메시지 2"},
        )
        assert agent_one.status_code == 200
        assert agent_two.status_code == 200

        with SessionLocal() as db:
            db.add_all(
                [
                    SupportMessage(
                        conversation_id=conversation_id,
                        sender_type=SupportMessageSenderType.AI,
                        content="수동 AI 메시지 1",
                        metadata_json={},
                    ),
                    SupportMessage(
                        conversation_id=conversation_id,
                        sender_type=SupportMessageSenderType.AI,
                        content="수동 AI 메시지 2",
                        metadata_json={},
                    ),
                ]
            )
            db.commit()
            messages = db.scalars(
                select(SupportMessage).where(
                    SupportMessage.conversation_id == conversation_id,
                    SupportMessage.client_message_id.is_(None),
                )
            ).all()
            assert len(messages) >= 6


def test_support_events_messages_pagination_and_after_id() -> None:
    with TestClient(app) as client:
        owner = register_approve_and_login(
            client,
            login_id="support-owner-events-page",
            store_name="Support Events Page",
        )
        conversation = create_conversation(client, owner["accessToken"])
        conversation_id = conversation["id"]

        event = client.post(
            f"/api/kds/support/conversations/{conversation_id}/events",
            headers=auth_header(owner["accessToken"]),
            json={
                "event_type": "FAQ_SELECTED",
                "payload": {
                    "faq_id": "order_not_printing",
                    "label": "주문이 출력되지 않아요",
                    "path": ["주문", "출력 문제"],
                },
            },
        )
        assert event.status_code == 201
        event_body = event.json()
        assert event_body["events"][0]["event_type"] == "FAQ_SELECTED"
        assert event_body["events"][0]["payload_json"]["faq_id"] == "order_not_printing"
        assert event_body["events"][0]["payload_json"]["label"] == "주문이 출력되지 않아요"
        assert event_body["events"][0]["payload_json"]["path"] == ["주문", "출력 문제"]

        for index in range(3):
            sent = client.post(
                f"/api/kds/support/conversations/{conversation_id}/messages",
                headers=auth_header(owner["accessToken"]),
                json={"content": f"페이지 메시지 {index}"},
            )
            assert sent.status_code == 200

        latest = client.get(
            f"/api/kds/support/conversations/{conversation_id}/messages?limit=3",
            headers=auth_header(owner["accessToken"]),
        )
        assert latest.status_code == 200
        latest_messages = latest.json()["messages"]
        assert len(latest_messages) == 3
        assert latest_messages == sorted(latest_messages, key=lambda message: message["id"])

        after = client.get(
            f"/api/kds/support/conversations/{conversation_id}/messages?after_id={latest_messages[0]['id']}",
            headers=auth_header(owner["accessToken"]),
        )
        assert after.status_code == 200
        assert all(message["id"] > latest_messages[0]["id"] for message in after.json()["messages"])

        before = client.get(
            f"/api/kds/support/conversations/{conversation_id}/messages?before_id={latest_messages[0]['id']}&limit=2",
            headers=auth_header(owner["accessToken"]),
        )
        assert before.status_code == 200
        assert all(message["id"] < latest_messages[0]["id"] for message in before.json()["messages"])
        assert before.json()["messages"] == sorted(before.json()["messages"], key=lambda message: message["id"])

        closed = client.post(
            f"/api/kds/support/conversations/{conversation_id}/close",
            headers=auth_header(owner["accessToken"]),
        )
        assert closed.status_code == 200
        event_after_close = client.post(
            f"/api/kds/support/conversations/{conversation_id}/events",
            headers=auth_header(owner["accessToken"]),
            json={"event_type": "FAQ_SELECTED", "payload": {"label": "닫힌 후 이벤트"}},
        )
        assert event_after_close.status_code == 409


def test_read_api_marks_only_counterparty_messages() -> None:
    with TestClient(app) as client:
        owner = register_approve_and_login(
            client,
            login_id="support-owner-read",
            store_name="Support Read",
        )
        conversation = create_conversation(client, owner["accessToken"])
        sent = client.post(
            f"/api/kds/support/conversations/{conversation['id']}/messages",
            headers=auth_header(owner["accessToken"]),
            json={"content": "읽음 처리 테스트"},
        )
        assert sent.status_code == 200
        user_message, ai_message = sent.json()["messages"]

        read = client.post(
            f"/api/kds/support/conversations/{conversation['id']}/read",
            headers=auth_header(owner["accessToken"]),
            json={"last_read_message_id": ai_message["id"]},
        )

        assert read.status_code == 200
        messages = read.json()["messages"]
        assert messages[0]["id"] == user_message["id"]
        assert messages[0]["read_at"] is None
        assert messages[1]["id"] == ai_message["id"]
        assert messages[1]["read_at"] is not None


def test_agent_read_marks_only_user_messages() -> None:
    with TestClient(app) as client:
        owner = register_approve_and_login(
            client,
            login_id="support-owner-agent-read",
            store_name="Support Agent Read",
        )
        agent_token = create_same_store_owner_token(owner, login_id="support-owner-agent-read-2")
        conversation = create_conversation(client, owner["accessToken"])
        conversation_id = conversation["id"]
        handoff = client.post(
            f"/api/kds/support/conversations/{conversation_id}/handoff",
            headers=auth_header(owner["accessToken"]),
        )
        assert handoff.status_code == 200
        assigned = client.post(
            f"/api/kds/support/conversations/{conversation_id}/assign",
            headers=auth_header(agent_token),
        )
        assert assigned.status_code == 200
        user_sent = client.post(
            f"/api/kds/support/conversations/{conversation_id}/messages",
            headers=auth_header(owner["accessToken"]),
            json={"content": "상담원이 읽을 사용자 메시지"},
        )
        assert user_sent.status_code == 200
        last_message_id = user_sent.json()["messages"][-1]["id"]

        read = client.post(
            f"/api/kds/support/conversations/{conversation_id}/read",
            headers=auth_header(agent_token),
            json={"last_read_message_id": last_message_id},
        )

        assert read.status_code == 200
        messages = read.json()["messages"]
        system_messages = [message for message in messages if message["sender_type"] == "SYSTEM"]
        agent_messages = [message for message in messages if message["sender_type"] == "AGENT"]
        user_messages = [message for message in messages if message["sender_type"] == "USER"]
        assert all(message["read_at"] is None for message in system_messages)
        assert all(message["read_at"] is None for message in agent_messages)
        assert user_messages[-1]["read_at"] is not None

        read_again = client.post(
            f"/api/kds/support/conversations/{conversation_id}/read",
            headers=auth_header(agent_token),
            json={"last_read_message_id": last_message_id},
        )
        assert read_again.status_code == 200


def test_agent_queue_and_assigned_agent_policy() -> None:
    with TestClient(app) as client:
        owner = register_approve_and_login(
            client,
            login_id="support-owner-agent-policy",
            store_name="Support Agent Policy",
        )
        other_agent_token = create_same_store_owner_token(owner, login_id="support-owner-agent-policy-other")
        conversation = create_conversation(client, owner["accessToken"])
        conversation_id = conversation["id"]
        handoff = client.post(
            f"/api/kds/support/conversations/{conversation_id}/handoff",
            headers=auth_header(owner["accessToken"]),
        )
        assert handoff.status_code == 200

        queue = client.get(
            "/api/kds/support/agent/queue",
            headers=auth_header(owner["accessToken"]),
        )
        assert queue.status_code == 200
        queue_item = queue.json()["conversations"][0]
        assert queue_item["conversation_id"] == conversation_id
        assert queue_item["status"] == "WAITING_AGENT"
        assert queue_item["mode"] == "AGENT"
        assert queue_item["user_id"] == owner["user"]["id"]
        assert queue_item["assigned_agent_id"] is None
        assert queue_item["latest_message_preview"] == "상담원 연결을 요청했습니다."
        assert queue_item["latest_message_sender_type"] == "SYSTEM"
        assert queue_item["unread_count"] == 0
        assert isinstance(queue_item["waiting_duration_seconds"], int)
        assert queue_item["created_at"].endswith("+00:00")
        assert queue_item["updated_at"].endswith("+00:00")

        employee = client.post(
            "/api/kds/staff",
            headers=auth_header(owner["accessToken"]),
            json={"name": "직원A", "loginId": "support-queue-staff", "positionLabel": "직원"},
        )
        assert employee.status_code == 201
        employee_login = client.post(
            "/api/auth/employee/login",
            json={"loginId": "support-queue-staff", "pin": employee.json()["temporaryPin"]},
        )
        assert employee_login.status_code == 200
        employee_queue = client.get(
            "/api/kds/support/agent/queue",
            headers=auth_header(employee_login.json()["accessToken"]),
        )
        assert employee_queue.status_code == 403

        assigned = client.post(
            f"/api/kds/support/conversations/{conversation_id}/assign",
            headers=auth_header(owner["accessToken"]),
        )
        assert assigned.status_code == 200

        forbidden = client.post(
            f"/api/kds/support/conversations/{conversation_id}/agent-messages",
            headers=auth_header(other_agent_token),
            json={"content": "다른 상담원 메시지"},
        )
        assert forbidden.status_code == 403


def test_agent_queue_is_scoped_to_store_and_sorted() -> None:
    with TestClient(app) as client:
        owner_one = register_approve_and_login(
            client,
            login_id="support-owner-queue-one",
            store_name="Support Queue One",
        )
        owner_two = register_approve_and_login(
            client,
            login_id="support-owner-queue-two",
            store_name="Support Queue Two",
        )
        first = create_conversation(client, owner_one["accessToken"])
        second = create_conversation(client, owner_one["accessToken"])
        other_store = create_conversation(client, owner_two["accessToken"])

        for access_token, conversation_id in [
            (owner_one["accessToken"], first["id"]),
            (owner_one["accessToken"], second["id"]),
            (owner_two["accessToken"], other_store["id"]),
        ]:
            response = client.post(
                f"/api/kds/support/conversations/{conversation_id}/handoff",
                headers=auth_header(access_token),
            )
            assert response.status_code == 200

        with SessionLocal() as db:
            older = db.get(SupportConversation, first["id"])
            newer = db.get(SupportConversation, second["id"])
            assert older is not None
            assert newer is not None
            older.updated_at = datetime.now(UTC) - timedelta(minutes=10)
            newer.updated_at = datetime.now(UTC) - timedelta(minutes=1)
            db.commit()

        queue = client.get(
            "/api/kds/support/agent/queue",
            headers=auth_header(owner_one["accessToken"]),
        )
        assert queue.status_code == 200
        ids = [item["conversation_id"] for item in queue.json()["conversations"]]
        assert ids == [first["id"], second["id"]]
        assert other_store["id"] not in ids
