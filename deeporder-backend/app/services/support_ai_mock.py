from __future__ import annotations

from app.services.support_ai_provider import (
    SupportAiContext,
    SupportAiReply,
    SupportHandoffRecommendation,
    SupportAiProvider,
)


class MockSupportAiProvider(SupportAiProvider):
    provider_name = "mock"

    def generate_reply(self, context: SupportAiContext) -> SupportAiReply:
        latest_user_message = next(
            (message.content for message in reversed(context.recent_messages) if message.sender_type == "USER"),
            "",
        )
        content = (
            "문의 내용을 확인했습니다. 현재는 테스트용 AI 응답입니다. "
            "KDS 설정, 알림 권한, 매장 상태를 순서대로 확인해 주세요."
        )
        if latest_user_message:
            content = f"{content}\n접수 내용: {latest_user_message}"
        return SupportAiReply(
            content=content,
            summary=latest_user_message[:120] or None,
            should_recommend_handoff=False,
            confidence=1.0,
        )

    def summarize_conversation(self, context: SupportAiContext) -> str | None:
        user_messages = [message.content for message in context.recent_messages if message.sender_type == "USER"]
        return " / ".join(user_messages[-3:]) or None

    def recommend_handoff(self, context: SupportAiContext) -> SupportHandoffRecommendation:
        return SupportHandoffRecommendation(recommended=False)
