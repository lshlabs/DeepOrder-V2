import { useChatbotSession } from "../hooks/useChatbotSession";
import { FaqSection } from "./FaqSection";

export function SupportPanel() {
  const { open } = useChatbotSession();

  function handleOpenChatbot(context?: string) {
    open(context);
  }

  return (
    <div className="support-panel flex flex-1 overflow-y-auto overflow-x-hidden px-4 py-[14px]">
      <div className="support-faq-page flex min-w-0 flex-1 flex-col overflow-y-auto">
        {/* Page header */}
        <div className="support-page-header flex items-center justify-between border-b border-[var(--color-border)] pb-[14px]">
          <div>
            <h1 className="support-page-title text-[17px] font-bold tracking-[-0.3px] text-[var(--color-text)]">고객지원</h1>
            <p className="support-page-desc mt-[2px] text-xs leading-[1.5] text-[var(--color-text-muted)]">
              자주 묻는 질문을 검색하거나 카테고리별로 찾아보세요. 해결되지 않으면 챗봇 상담을 이용해 주세요.
            </p>
          </div>
        </div>

        {/* FAQ */}
        <FaqSection onOpenChatbot={handleOpenChatbot} />
      </div>
    </div>
  );
}
