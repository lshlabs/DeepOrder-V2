from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import (
    SupportConversation,
    SupportMessage,
    SupportMessageSenderType,
    User,
)
from app.services.support_ai_provider import SupportAiContext, get_support_ai_provider


def create_ai_reply_message(
    db: Session,
    *,
    conversation: SupportConversation,
    current_user: User,
) -> SupportMessage:
    recent_messages = db.scalars(
        select(SupportMessage)
        .where(SupportMessage.conversation_id == conversation.id)
        .order_by(SupportMessage.created_at.asc(), SupportMessage.id.asc())
    ).all()
    provider = get_support_ai_provider()
    context = SupportAiContext(
        conversation=conversation,
        recent_messages=list(recent_messages),
        current_user=current_user,
        store_id=current_user.store_id,
    )
    reply = provider.generate_reply(context)
    if reply.summary:
        conversation.summary = reply.summary
    metadata = {
        "provider": provider.provider_name,
        "model": reply.model,
        "prompt_version": reply.prompt_version,
        "fallback": reply.fallback,
        "confidence": reply.confidence,
        "latency_ms": reply.latency_ms,
        "input_tokens": reply.input_tokens,
        "output_tokens": reply.output_tokens,
        "handoff_recommended": reply.should_recommend_handoff,
        "handoff_reason": reply.handoff_reason,
        "summary": reply.summary,
        "retry_count": reply.retry_count,
    }
    if reply.error_type:
        metadata["error_type"] = reply.error_type
    if reply.error_message:
        metadata["error_message"] = reply.error_message[:240]
    return SupportMessage(
        conversation_id=conversation.id,
        sender_type=SupportMessageSenderType.AI,
        content=reply.content,
        metadata_json=metadata,
    )


def create_ai_error_message(
    *,
    conversation_id: int,
    error: Exception,
) -> SupportMessage:
    settings = get_settings()
    return SupportMessage(
        conversation_id=conversation_id,
        sender_type=SupportMessageSenderType.AI,
        content="현재 AI 상담 연결이 원활하지 않습니다. 잠시 후 다시 시도하거나 상담원 연결을 요청해 주세요.",
        metadata_json={
            "provider": settings.support_ai_provider,
            "model": settings.openai_model or None,
            "prompt_version": "support-v1",
            "fallback": True,
            "error_type": type(error).__name__,
            "error_message": _safe_error_message(error),
            "retry_count": 0,
        },
    )


def _safe_error_message(error: Exception) -> str:
    message = str(error).strip()
    if not message:
        return type(error).__name__
    return message[:240]
