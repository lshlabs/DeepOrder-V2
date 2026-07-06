from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from app.config import get_settings
from app.models import SupportConversation, SupportMessage, User


@dataclass(frozen=True)
class SupportAiContext:
    conversation: SupportConversation
    recent_messages: list[SupportMessage]
    current_user: User
    store_id: str


@dataclass(frozen=True)
class SupportAiReply:
    content: str
    summary: str | None = None
    should_recommend_handoff: bool = False
    handoff_reason: str | None = None
    confidence: float | None = None
    fallback: bool = False
    model: str | None = None
    prompt_version: str = "support-v1"
    latency_ms: int | None = None
    input_tokens: int | None = None
    output_tokens: int | None = None
    error_type: str | None = None
    error_message: str | None = None
    retry_count: int = 0


@dataclass(frozen=True)
class SupportHandoffRecommendation:
    recommended: bool
    reason: str | None = None


class SupportAiProvider(Protocol):
    provider_name: str

    def generate_reply(self, context: SupportAiContext) -> SupportAiReply:
        ...

    def summarize_conversation(self, context: SupportAiContext) -> str | None:
        ...

    def recommend_handoff(self, context: SupportAiContext) -> SupportHandoffRecommendation:
        ...


def get_support_ai_provider() -> SupportAiProvider:
    provider = get_settings().support_ai_provider.strip().lower()
    if provider == "mock":
        from app.services.support_ai_mock import MockSupportAiProvider

        return MockSupportAiProvider()
    if provider == "direct_llm":
        from app.services.support_ai_direct_llm import DirectLlmSupportAiProvider

        return DirectLlmSupportAiProvider()
    raise RuntimeError(f"Unsupported support AI provider: {get_settings().support_ai_provider}")
