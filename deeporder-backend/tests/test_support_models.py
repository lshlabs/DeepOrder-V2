from datetime import UTC, datetime, timedelta

from sqlalchemy import select

from app.database import Base, SessionLocal, engine
from app.models import (
    ApprovalStatus,
    Store,
    SupportConversation,
    SupportConversationMode,
    SupportConversationStatus,
    SupportMessage,
    SupportMessageSenderType,
    User,
)


def setup_function() -> None:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def create_store_user(*, store_id: str, login_id: str) -> tuple[Store, User]:
    store = Store(
        store_id=store_id,
        store_name=f"{store_id} Store",
        approval_status=ApprovalStatus.APPROVED,
    )
    user = User(
        login_id=login_id,
        password_hash="hashed",
        name=login_id,
        approval_status=ApprovalStatus.APPROVED,
        store_id=store_id,
    )
    return store, user


def test_support_conversation_and_message_models_are_persisted() -> None:
    with SessionLocal() as db:
        store, user = create_store_user(store_id="STORE-SUPPORT-1", login_id="support-owner-1")
        db.add_all([store, user])
        db.flush()

        expires_at = datetime.now(UTC) + timedelta(minutes=10)
        conversation = SupportConversation(
            store_id=store.store_id,
            user_id=user.id,
            status=SupportConversationStatus.BOT,
            mode=SupportConversationMode.BOT,
            source="kds-web",
            expires_at=expires_at,
        )
        db.add(conversation)
        db.flush()

        message = SupportMessage(
            conversation_id=conversation.id,
            sender_type=SupportMessageSenderType.USER,
            sender_id=user.id,
            content="주문 알림이 울리지 않아요.",
            metadata_json={"tab": "SUPPORT"},
        )
        db.add(message)
        db.commit()

        saved = db.scalar(
            select(SupportConversation).where(SupportConversation.id == conversation.id)
        )
        assert saved is not None
        assert saved.store_id == "STORE-SUPPORT-1"
        assert saved.user_id == user.id
        assert saved.status == SupportConversationStatus.BOT
        assert saved.mode == SupportConversationMode.BOT
        assert saved.expires_at is not None
        assert len(saved.messages) == 1
        assert saved.messages[0].sender_type == SupportMessageSenderType.USER
        assert saved.messages[0].sender_id == user.id
        assert saved.messages[0].content == "주문 알림이 울리지 않아요."
        assert saved.messages[0].metadata_json == {"tab": "SUPPORT"}


def test_support_conversation_lookup_is_scoped_to_user_store() -> None:
    with SessionLocal() as db:
        store_one, user_one = create_store_user(store_id="STORE-SUPPORT-A", login_id="support-a")
        store_two, user_two = create_store_user(store_id="STORE-SUPPORT-B", login_id="support-b")
        db.add_all([store_one, user_one, store_two, user_two])
        db.flush()

        conversation = SupportConversation(
            store_id=store_two.store_id,
            user_id=user_two.id,
            status=SupportConversationStatus.AI,
            mode=SupportConversationMode.AI,
            source="kds-web",
        )
        db.add(conversation)
        db.flush()

        message = SupportMessage(
            conversation_id=conversation.id,
            sender_type=SupportMessageSenderType.AI,
            content="알림 설정을 확인해 주세요.",
            metadata_json={},
        )
        db.add(message)
        db.commit()

        own_store_conversation = db.scalar(
            select(SupportConversation).where(
                SupportConversation.id == conversation.id,
                SupportConversation.store_id == user_two.store_id,
            )
        )
        other_store_conversation = db.scalar(
            select(SupportConversation).where(
                SupportConversation.id == conversation.id,
                SupportConversation.store_id == user_one.store_id,
            )
        )

        assert own_store_conversation is not None
        assert own_store_conversation.messages[0].content == "알림 설정을 확인해 주세요."
        assert other_store_conversation is None
