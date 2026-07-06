from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import get_approved_kds_user, get_approved_store_owner
from app.database import get_db
from app.models import (
    SupportConversation,
    SupportConversationMode,
    SupportConversationStatus,
    SupportEvent,
    SupportEventActorType,
    SupportMessage,
    SupportMessageSenderType,
    User,
)
from app.schemas import (
    CreateSupportConversationIn,
    CreateSupportEventIn,
    MarkSupportReadIn,
    SendSupportMessageIn,
    SupportAgentQueueItemOut,
    SupportAgentQueueOut,
    SupportConversationListOut,
    SupportConversationOut,
    SupportEventListOut,
    SupportMessageListOut,
)
from app.services.support_conversation import create_ai_error_message, create_ai_reply_message

router = APIRouter()

SUPPORT_SESSION_TTL_MINUTES = 10
SUPPORT_HANDOFF_CANCEL_VISIBLE_AFTER_MS = 60_000


@router.post(
    "/api/kds/support/conversations",
    response_model=SupportConversationOut,
    status_code=status.HTTP_201_CREATED,
)
def create_support_conversation(
    payload: CreateSupportConversationIn,
    current_user: User = Depends(get_approved_kds_user),
    db: Session = Depends(get_db),
) -> SupportConversationOut:
    conversation = SupportConversation(
        store_id=current_user.store_id,
        user_id=current_user.id,
        status=SupportConversationStatus.BOT,
        mode=SupportConversationMode.BOT,
        source=payload.source,
        expires_at=_default_expires_at(),
    )
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return conversation


@router.get("/api/kds/support/conversations/current", response_model=SupportConversationOut | None)
def get_current_support_conversation(
    current_user: User = Depends(get_approved_kds_user),
    db: Session = Depends(get_db),
) -> SupportConversationOut | None:
    conversation = db.scalar(
        select(SupportConversation)
        .where(
            SupportConversation.store_id == current_user.store_id,
            SupportConversation.user_id == current_user.id,
            SupportConversation.status.not_in(
                [SupportConversationStatus.CLOSED, SupportConversationStatus.EXPIRED]
            ),
        )
        .order_by(SupportConversation.updated_at.desc(), SupportConversation.id.desc())
    )
    if conversation is None:
        return None
    if _mark_expired_if_needed(db, conversation):
        return None
    return conversation


@router.get("/api/kds/support/conversations", response_model=SupportConversationListOut)
def list_support_conversations(
    current_user: User = Depends(get_approved_kds_user),
    db: Session = Depends(get_db),
) -> SupportConversationListOut:
    conversations = db.scalars(
        select(SupportConversation)
        .where(SupportConversation.store_id == current_user.store_id)
        .order_by(SupportConversation.updated_at.desc(), SupportConversation.id.desc())
    ).all()
    return SupportConversationListOut(conversations=list(conversations))


@router.get("/api/kds/support/conversations/{conversation_id}", response_model=SupportConversationOut)
def get_support_conversation(
    conversation_id: int,
    current_user: User = Depends(get_approved_kds_user),
    db: Session = Depends(get_db),
) -> SupportConversationOut:
    return _get_store_conversation(db, current_user, conversation_id)


@router.post(
    "/api/kds/support/conversations/{conversation_id}/messages",
    response_model=SupportConversationOut,
)
def send_support_message(
    conversation_id: int,
    payload: SendSupportMessageIn,
    current_user: User = Depends(get_approved_kds_user),
    db: Session = Depends(get_db),
) -> SupportConversationOut:
    conversation = _get_store_conversation(db, current_user, conversation_id)
    _ensure_writable(db, conversation)

    if payload.client_message_id:
        existing_message = db.scalar(
            select(SupportMessage).where(
                SupportMessage.conversation_id == conversation.id,
                SupportMessage.client_message_id == payload.client_message_id,
            )
        )
        if existing_message is not None:
            db.refresh(conversation)
            return conversation

    user_message = SupportMessage(
        conversation_id=conversation.id,
        sender_type=SupportMessageSenderType.USER,
        sender_id=current_user.id,
        content=payload.content.strip(),
        metadata_json={},
        client_message_id=payload.client_message_id,
    )
    db.add(user_message)
    db.flush()

    # Valid user-message transition table:
    # BOT -> AI reply is generated and status/mode become AI/AI.
    # AI -> AI reply is generated and status/mode remain AI/AI.
    # WAITING_AGENT -> user message only; AI must not re-enter the conversation.
    # AGENT -> user message only; assigned human remains the responder.
    # CLOSED/EXPIRED -> rejected by _ensure_writable with HTTP 409.
    if conversation.status in {SupportConversationStatus.BOT, SupportConversationStatus.AI}:
        conversation.status = SupportConversationStatus.AI
        conversation.mode = SupportConversationMode.AI
        try:
            ai_message = create_ai_reply_message(db, conversation=conversation, current_user=current_user)
        except Exception as exc:
            ai_message = create_ai_error_message(conversation_id=conversation.id, error=exc)
        db.add(ai_message)
    conversation.updated_at = datetime.now(UTC)
    conversation.expires_at = _default_expires_at()
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        conversation = _get_store_conversation(db, current_user, conversation_id)
    db.refresh(conversation)
    return conversation


@router.get(
    "/api/kds/support/conversations/{conversation_id}/messages",
    response_model=SupportMessageListOut,
)
def list_support_messages(
    conversation_id: int,
    after_id: int | None = Query(default=None, gt=0),
    before_id: int | None = Query(default=None, gt=0),
    limit: int = Query(default=30, ge=1, le=100),
    current_user: User = Depends(get_approved_kds_user),
    db: Session = Depends(get_db),
) -> SupportMessageListOut:
    _get_store_conversation(db, current_user, conversation_id)
    query = select(SupportMessage).where(SupportMessage.conversation_id == conversation_id)
    if after_id is not None:
        query = query.where(SupportMessage.id > after_id).order_by(
            SupportMessage.created_at.asc(), SupportMessage.id.asc()
        )
        messages = list(db.scalars(query.limit(limit)).all())
        return SupportMessageListOut(messages=messages)
    if before_id is not None:
        query = query.where(SupportMessage.id < before_id).order_by(
            SupportMessage.created_at.desc(), SupportMessage.id.desc()
        )
        messages = list(db.scalars(query.limit(limit)).all())
        messages.reverse()
        return SupportMessageListOut(messages=messages)
    messages = list(
        db.scalars(
            query.order_by(SupportMessage.created_at.desc(), SupportMessage.id.desc()).limit(limit)
        ).all()
    )
    messages.reverse()
    return SupportMessageListOut(messages=messages)


@router.post(
    "/api/kds/support/conversations/{conversation_id}/events",
    response_model=SupportEventListOut,
    status_code=status.HTTP_201_CREATED,
)
def create_support_event(
    conversation_id: int,
    payload: CreateSupportEventIn,
    current_user: User = Depends(get_approved_kds_user),
    db: Session = Depends(get_db),
) -> SupportEventListOut:
    conversation = _get_store_conversation(db, current_user, conversation_id)
    _ensure_writable(db, conversation)
    event = SupportEvent(
        conversation_id=conversation.id,
        event_type=payload.event_type,
        payload_json=payload.payload,
        actor_type=_actor_type_for_user(conversation, current_user),
        actor_id=current_user.id,
    )
    db.add(event)
    conversation.updated_at = datetime.now(UTC)
    db.commit()
    events = _list_support_events(db, conversation.id)
    return SupportEventListOut(events=events)


@router.get(
    "/api/kds/support/conversations/{conversation_id}/events",
    response_model=SupportEventListOut,
)
def list_support_events(
    conversation_id: int,
    current_user: User = Depends(get_approved_kds_user),
    db: Session = Depends(get_db),
) -> SupportEventListOut:
    conversation = _get_store_conversation(db, current_user, conversation_id)
    return SupportEventListOut(events=_list_support_events(db, conversation.id))


@router.post("/api/kds/support/conversations/{conversation_id}/read", response_model=SupportConversationOut)
def mark_support_conversation_read(
    conversation_id: int,
    payload: MarkSupportReadIn,
    current_user: User = Depends(get_approved_kds_user),
    db: Session = Depends(get_db),
) -> SupportConversationOut:
    conversation = _get_store_conversation(db, current_user, conversation_id)
    readable_sender_types = _readable_sender_types(conversation, current_user)
    now = datetime.now(UTC)
    messages = db.scalars(
        select(SupportMessage).where(
            SupportMessage.conversation_id == conversation.id,
            SupportMessage.id <= payload.last_read_message_id,
            SupportMessage.sender_type.in_(readable_sender_types),
            SupportMessage.read_at.is_(None),
        )
    ).all()
    for message in messages:
        message.read_at = now
    db.commit()
    db.refresh(conversation)
    return conversation


@router.post("/api/kds/support/conversations/{conversation_id}/handoff", response_model=SupportConversationOut)
def request_support_handoff(
    conversation_id: int,
    current_user: User = Depends(get_approved_kds_user),
    db: Session = Depends(get_db),
) -> SupportConversationOut:
    conversation = _get_store_conversation(db, current_user, conversation_id)
    _ensure_writable(db, conversation)
    if conversation.status != SupportConversationStatus.AGENT:
        conversation.status = SupportConversationStatus.WAITING_AGENT
        conversation.mode = SupportConversationMode.AGENT
        conversation.updated_at = datetime.now(UTC)
        conversation.expires_at = _default_expires_at()
        db.add(
            SupportEvent(
                conversation_id=conversation.id,
                event_type="HANDOFF_REQUESTED",
                payload_json={},
                actor_type=SupportEventActorType.USER,
                actor_id=current_user.id,
            )
        )
        db.add(
            SupportMessage(
                conversation_id=conversation.id,
                sender_type=SupportMessageSenderType.SYSTEM,
                content="상담원 연결을 요청했습니다.",
                metadata_json={},
            )
        )
        db.commit()
        db.refresh(conversation)
    return conversation


@router.post("/api/kds/support/conversations/{conversation_id}/cancel-handoff", response_model=SupportConversationOut)
def cancel_support_handoff(
    conversation_id: int,
    current_user: User = Depends(get_approved_kds_user),
    db: Session = Depends(get_db),
) -> SupportConversationOut:
    conversation = _get_user_store_conversation(db, current_user, conversation_id)
    _ensure_writable(db, conversation)
    if conversation.status != SupportConversationStatus.WAITING_AGENT:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Support conversation is not waiting for an agent.",
        )

    now = datetime.now(UTC)
    conversation.status = SupportConversationStatus.AI
    conversation.mode = SupportConversationMode.AI
    conversation.updated_at = now
    conversation.expires_at = _default_expires_at()
    db.add(
        SupportEvent(
            conversation_id=conversation.id,
            event_type="HANDOFF_CANCELLED",
            payload_json={
                "reason": "user_cancelled_waiting",
                "visible_after_ms": SUPPORT_HANDOFF_CANCEL_VISIBLE_AFTER_MS,
            },
            actor_type=SupportEventActorType.USER,
            actor_id=current_user.id,
        )
    )
    db.add(
        SupportMessage(
            conversation_id=conversation.id,
            sender_type=SupportMessageSenderType.SYSTEM,
            content="상담원 연결 대기가 종료되었습니다. AI 상담으로 돌아갑니다.",
            metadata_json={
                "type": "handoff_cancelled",
                "from_status": SupportConversationStatus.WAITING_AGENT.value,
                "to_status": SupportConversationStatus.AI.value,
            },
        )
    )
    db.add(
        SupportMessage(
            conversation_id=conversation.id,
            sender_type=SupportMessageSenderType.AI,
            content="추가로 궁금한 점을 자유롭게 입력해 주세요.",
            metadata_json={
                "type": "handoff_cancelled_ai_greeting",
                "provider": "system",
                "fallback": False,
            },
        )
    )
    db.commit()
    db.refresh(conversation)
    return conversation


@router.post("/api/kds/support/conversations/{conversation_id}/assign", response_model=SupportConversationOut)
def assign_support_conversation(
    conversation_id: int,
    current_user: User = Depends(get_approved_store_owner),
    db: Session = Depends(get_db),
) -> SupportConversationOut:
    conversation = _get_store_conversation(db, current_user, conversation_id)
    _ensure_writable(db, conversation)
    conversation.status = SupportConversationStatus.AGENT
    conversation.mode = SupportConversationMode.AGENT
    conversation.assigned_agent_id = current_user.id
    conversation.updated_at = datetime.now(UTC)
    conversation.expires_at = _default_expires_at()
    db.add(
        SupportEvent(
            conversation_id=conversation.id,
            event_type="CONVERSATION_ASSIGNED",
            payload_json={"assigned_agent_id": current_user.id},
            actor_type=SupportEventActorType.AGENT,
            actor_id=current_user.id,
        )
    )
    db.add(
        SupportMessage(
            conversation_id=conversation.id,
            sender_type=SupportMessageSenderType.SYSTEM,
            content="상담원이 배정되었습니다.",
            metadata_json={},
        )
    )
    db.add(
        SupportMessage(
            conversation_id=conversation.id,
            sender_type=SupportMessageSenderType.AGENT,
            sender_id=current_user.id,
            content="안녕하세요. 상담원입니다. 문의 내용을 확인하겠습니다.",
            metadata_json={},
        )
    )
    db.commit()
    db.refresh(conversation)
    return conversation


@router.post("/api/kds/support/conversations/{conversation_id}/agent-messages", response_model=SupportConversationOut)
def send_support_agent_message(
    conversation_id: int,
    payload: SendSupportMessageIn,
    current_user: User = Depends(get_approved_store_owner),
    db: Session = Depends(get_db),
) -> SupportConversationOut:
    conversation = _get_store_conversation(db, current_user, conversation_id)
    _ensure_writable(db, conversation)
    if conversation.status != SupportConversationStatus.AGENT:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Support conversation is not assigned.")
    if conversation.assigned_agent_id is not None and conversation.assigned_agent_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Support conversation assigned to another agent.")
    if conversation.assigned_agent_id is None:
        conversation.assigned_agent_id = current_user.id
    db.add(
        SupportMessage(
            conversation_id=conversation.id,
            sender_type=SupportMessageSenderType.AGENT,
            sender_id=current_user.id,
            content=payload.content.strip(),
            metadata_json={},
        )
    )
    conversation.updated_at = datetime.now(UTC)
    conversation.expires_at = _default_expires_at()
    db.commit()
    db.refresh(conversation)
    return conversation


@router.post("/api/kds/support/conversations/{conversation_id}/close", response_model=SupportConversationOut)
def close_support_conversation(
    conversation_id: int,
    current_user: User = Depends(get_approved_kds_user),
    db: Session = Depends(get_db),
) -> SupportConversationOut:
    conversation = _get_store_conversation(db, current_user, conversation_id)
    if conversation.status not in {SupportConversationStatus.CLOSED, SupportConversationStatus.EXPIRED}:
        conversation.status = SupportConversationStatus.CLOSED
        conversation.closed_at = datetime.now(UTC)
        conversation.updated_at = conversation.closed_at
        db.add(
            SupportEvent(
                conversation_id=conversation.id,
                event_type="CONVERSATION_CLOSED",
                payload_json={},
                actor_type=_actor_type_for_user(conversation, current_user),
                actor_id=current_user.id,
            )
        )
        db.add(
            SupportMessage(
                conversation_id=conversation.id,
                sender_type=SupportMessageSenderType.SYSTEM,
                content="상담이 종료되었습니다.",
                metadata_json={},
            )
        )
        db.commit()
        db.refresh(conversation)
    return conversation


@router.get("/api/kds/support/agent/queue", response_model=SupportAgentQueueOut)
def list_support_agent_queue(
    current_user: User = Depends(get_approved_store_owner),
    db: Session = Depends(get_db),
) -> SupportAgentQueueOut:
    conversations = db.scalars(
        select(SupportConversation)
        .where(
            SupportConversation.store_id == current_user.store_id,
            SupportConversation.status.in_(
                [SupportConversationStatus.WAITING_AGENT, SupportConversationStatus.AGENT]
            ),
        )
        .order_by(SupportConversation.updated_at.desc(), SupportConversation.id.desc())
    ).all()
    now = datetime.now(UTC)
    items = [_queue_item(conversation, now) for conversation in conversations]
    items.sort(
        key=lambda item: (
            0 if item.status == SupportConversationStatus.WAITING_AGENT else 1,
            -item.waiting_duration_seconds,
            -item.updated_at.timestamp(),
        )
    )
    return SupportAgentQueueOut(conversations=items)


def _get_store_conversation(db: Session, current_user: User, conversation_id: int) -> SupportConversation:
    conversation = db.scalar(
        select(SupportConversation).where(
            SupportConversation.id == conversation_id,
            SupportConversation.store_id == current_user.store_id,
        )
    )
    if conversation is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Support conversation not found.")
    return conversation


def _get_user_store_conversation(db: Session, current_user: User, conversation_id: int) -> SupportConversation:
    conversation = db.scalar(
        select(SupportConversation).where(
            SupportConversation.id == conversation_id,
            SupportConversation.store_id == current_user.store_id,
            SupportConversation.user_id == current_user.id,
        )
    )
    if conversation is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Support conversation not found.")
    return conversation


def _ensure_writable(db: Session, conversation: SupportConversation) -> None:
    if _mark_expired_if_needed(db, conversation):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Support conversation expired.")
    if conversation.status in {SupportConversationStatus.CLOSED, SupportConversationStatus.EXPIRED}:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Support conversation closed.")


def _mark_expired_if_needed(db: Session, conversation: SupportConversation) -> bool:
    if conversation.expires_at is None:
        return False
    expires_at = conversation.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=UTC)
    if expires_at > datetime.now(UTC):
        return False
    conversation.status = SupportConversationStatus.EXPIRED
    conversation.updated_at = datetime.now(UTC)
    db.commit()
    db.refresh(conversation)
    return True


def _default_expires_at() -> datetime:
    return datetime.now(UTC) + timedelta(minutes=SUPPORT_SESSION_TTL_MINUTES)


def _list_support_events(db: Session, conversation_id: int) -> list[SupportEvent]:
    return list(
        db.scalars(
            select(SupportEvent)
            .where(SupportEvent.conversation_id == conversation_id)
            .order_by(SupportEvent.created_at.asc(), SupportEvent.id.asc())
        ).all()
    )


def _actor_type_for_user(conversation: SupportConversation, current_user: User) -> SupportEventActorType:
    if conversation.user_id == current_user.id:
        return SupportEventActorType.USER
    return SupportEventActorType.AGENT


def _readable_sender_types(
    conversation: SupportConversation, current_user: User
) -> list[SupportMessageSenderType]:
    if conversation.assigned_agent_id == current_user.id and conversation.user_id != current_user.id:
        return [SupportMessageSenderType.USER]
    if conversation.user_id == current_user.id:
        return [
            SupportMessageSenderType.BOT,
            SupportMessageSenderType.AI,
            SupportMessageSenderType.AGENT,
            SupportMessageSenderType.SYSTEM,
        ]
    return [SupportMessageSenderType.USER]


def _queue_item(conversation: SupportConversation, now: datetime) -> SupportAgentQueueItemOut:
    latest_message = conversation.messages[-1] if conversation.messages else None
    waiting_from = conversation.updated_at
    if waiting_from.tzinfo is None:
        waiting_from = waiting_from.replace(tzinfo=UTC)
    unread_count = sum(
        1
        for message in conversation.messages
        if message.sender_type == SupportMessageSenderType.USER and message.read_at is None
    )
    return SupportAgentQueueItemOut(
        conversation_id=conversation.id,
        store_id=conversation.store_id,
        user_id=conversation.user_id,
        status=conversation.status,
        mode=conversation.mode,
        latest_message=latest_message,
        latest_message_preview=latest_message.content[:120] if latest_message else None,
        latest_message_sender_type=latest_message.sender_type if latest_message else None,
        waiting_duration_seconds=max(0, int((now - waiting_from).total_seconds())),
        assigned_agent_id=conversation.assigned_agent_id,
        unread_count=unread_count,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        summary=conversation.summary,
    )


__all__ = ["router"]
