import { PageHeader } from "@/components/blocks";

import { useChatbotSession } from "../model/useChatbotSession";
import { FaqSection } from "./FaqSection";

export function SupportPage() {
  const { open } = useChatbotSession();

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-4 sm:px-6" aria-label="고객지원">
      <PageHeader
        title="고객지원"
        description="자주 묻는 질문을 검색하거나 카테고리별로 찾아보세요. 해결되지 않으면 챗봇 상담을 이용해 주세요."
      />
      <FaqSection onOpenChatbot={open} />
    </section>
  );
}
