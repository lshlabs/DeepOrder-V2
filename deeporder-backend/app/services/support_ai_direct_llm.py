from __future__ import annotations

import json
import time

import httpx
from pydantic import BaseModel, Field, ValidationError

from app.config import get_settings
from app.services.support_ai_provider import (
    SupportAiContext,
    SupportAiReply,
    SupportHandoffRecommendation,
    SupportAiProvider,
)


class DirectLlmReply(BaseModel):
    content: str = Field(min_length=1)
    summary: str | None = None
    shouldRecommendHandoff: bool = False
    handoffReason: str | None = None
    confidence: float | None = None


class DirectLlmSupportAiProvider(SupportAiProvider):
    provider_name = "direct_llm"

    def generate_reply(self, context: SupportAiContext) -> SupportAiReply:
        started_at = time.perf_counter()
        settings = get_settings()
        if not settings.openai_api_key or not settings.openai_model:
            return SupportAiReply(
                content="현재 AI 상담 서비스가 준비 중입니다. 잠시 후 다시 이용해 주세요.",
                summary=None,
                should_recommend_handoff=False,
                confidence=0.0,
                fallback=True,
                model=settings.openai_model or None,
                error_type="configuration_missing",
                error_message="direct_llm provider is not configured",
                latency_ms=_elapsed_ms(started_at),
            )

        request_payload = {
            "model": settings.openai_model,
            "messages": [
                {"role": "system", "content": _system_instruction()},
                {"role": "user", "content": json.dumps(_build_input(context), ensure_ascii=False)},
            ],
            "temperature": 0.2,
            "response_format": {"type": "json_object"},
        }
        try:
            response, retry_count = _post_with_retry(
                f"{settings.openai_base_url.rstrip('/')}/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.openai_api_key}",
                    "Content-Type": "application/json",
                },
                json_payload=request_payload,
            )
            response.raise_for_status()
            response_json = response.json()
            content = response_json["choices"][0]["message"]["content"]
            parsed = DirectLlmReply.model_validate(json.loads(content))
        except DirectLlmRequestError as exc:
            return _fallback_reply(settings.openai_model, started_at, exc.error_type, exc.safe_message, exc.retry_count)
        except httpx.TimeoutException:
            return _fallback_reply(settings.openai_model, started_at, "timeout", "provider request timed out", 0)
        except httpx.HTTPStatusError as exc:
            return _fallback_reply(
                settings.openai_model,
                started_at,
                f"http_{exc.response.status_code}",
                "provider returned an error status",
                0,
            )
        except (json.JSONDecodeError, KeyError, TypeError, ValidationError):
            return _fallback_reply(settings.openai_model, started_at, "invalid_response", "provider response was invalid", 0)
        usage = response_json.get("usage") or {}
        return SupportAiReply(
            content=parsed.content,
            summary=parsed.summary,
            should_recommend_handoff=parsed.shouldRecommendHandoff,
            handoff_reason=parsed.handoffReason,
            confidence=parsed.confidence,
            model=settings.openai_model,
            latency_ms=_elapsed_ms(started_at),
            input_tokens=usage.get("prompt_tokens"),
            output_tokens=usage.get("completion_tokens"),
            retry_count=retry_count,
        )

    def summarize_conversation(self, context: SupportAiContext) -> str | None:
        user_messages = [message.content for message in context.recent_messages if message.sender_type == "USER"]
        return " / ".join(user_messages[-3:]) or None

    def recommend_handoff(self, context: SupportAiContext) -> SupportHandoffRecommendation:
        latest_user_message = next(
            (message.content for message in reversed(context.recent_messages) if message.sender_type == "USER"),
            "",
        )
        needs_handoff = any(keyword in latest_user_message for keyword in ("상담원", "직원", "사람", "환불", "장애"))
        return SupportHandoffRecommendation(
            recommended=needs_handoff,
            reason="사용자 메시지에 상담원 연결 의도가 포함되어 있습니다." if needs_handoff else None,
        )


def _system_instruction() -> str:
    return (
        "You are a Korean customer support assistant for DeepOrder KDS. "
        "Answer only with guidance. Do not claim to change orders, staff, account, or store settings directly. "
        "Return JSON only with fields: content, summary, shouldRecommendHandoff, handoffReason, confidence."
    )


def _build_input(context: SupportAiContext) -> dict:
    return {
        "storeId": context.store_id,
        "user": {
            "id": context.current_user.id,
            "accountType": context.current_user.account_type,
            "role": context.current_user.role,
        },
        "conversation": {
            "id": context.conversation.id,
            "status": context.conversation.status,
            "mode": context.conversation.mode,
            "source": context.conversation.source,
            "summary": context.conversation.summary,
        },
        "recentMessages": [
            {
                "senderType": message.sender_type,
                "content": message.content,
                "createdAt": message.created_at.isoformat() if message.created_at else None,
            }
            for message in context.recent_messages[-12:]
        ],
    }


class DirectLlmRequestError(RuntimeError):
    def __init__(self, *, error_type: str, safe_message: str, retry_count: int) -> None:
        super().__init__(safe_message)
        self.error_type = error_type
        self.safe_message = safe_message
        self.retry_count = retry_count


def _post_with_retry(url: str, *, headers: dict[str, str], json_payload: dict) -> tuple[httpx.Response, int]:
    timeout = httpx.Timeout(20.0, connect=3.0, read=15.0)
    retryable_errors = (httpx.ConnectError, httpx.ReadTimeout, httpx.ConnectTimeout, httpx.NetworkError)
    try:
        return httpx.post(url, headers=headers, json=json_payload, timeout=timeout), 0
    except retryable_errors as first_error:
        try:
            return httpx.post(url, headers=headers, json=json_payload, timeout=timeout), 1
        except retryable_errors as second_error:
            error = second_error
            if isinstance(first_error, (httpx.ReadTimeout, httpx.ConnectTimeout)):
                error = first_error
            raise DirectLlmRequestError(
                error_type=type(error).__name__,
                safe_message="provider request timed out"
                if isinstance(error, (httpx.ReadTimeout, httpx.ConnectTimeout))
                else "provider request failed",
                retry_count=1,
            ) from second_error


def _elapsed_ms(started_at: float) -> int:
    return int((time.perf_counter() - started_at) * 1000)


def _fallback_reply(
    model: str | None,
    started_at: float,
    error_type: str,
    error_message: str,
    retry_count: int,
) -> SupportAiReply:
    return SupportAiReply(
        content="현재 AI 상담 연결이 원활하지 않습니다. 잠시 후 다시 시도하거나 상담원 연결을 요청해 주세요.",
        fallback=True,
        model=model,
        confidence=0.0,
        latency_ms=_elapsed_ms(started_at),
        error_type=error_type,
        error_message=error_message,
        retry_count=retry_count,
    )
