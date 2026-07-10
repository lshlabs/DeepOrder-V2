import { Bot, Headphones, MessageCircleQuestionMark, Minus, RotateCcw, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ChatSessionStatus } from "../../types/support";

type ChatbotHeaderProps = {
  status: ChatSessionStatus;
  onClose: () => void;
  onMinimize: () => void;
  onRestart: () => void;
};

function getHeader(status: ChatSessionStatus) {
  if (status === "AI") return { title: "AI 상담", icon: Bot };
  if (status === "WAITING_AGENT") return { title: "상담원 연결 대기", icon: Headphones };
  if (status === "AGENT") return { title: "상담원 상담", icon: Headphones };
  if (status === "CLOSED") return { title: "상담 종료", icon: MessageCircleQuestionMark };
  return { title: "고객지원 챗봇", icon: MessageCircleQuestionMark };
}

export function ChatbotHeader({ status, onClose, onMinimize, onRestart }: ChatbotHeaderProps) {
  const { title, icon: Icon } = getHeader(status);
  const showRestart = status === "AI" || status === "AGENT";

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-card px-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <h2 className="min-w-0 flex-1 truncate text-sm font-semibold">{title}</h2>
      {showRestart ? (
        <Button className="hidden gap-1 px-2 sm:inline-flex" onClick={onRestart} size="sm" type="button" variant="ghost">
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          처음으로
        </Button>
      ) : null}
      <Button aria-label="챗봇 최소화" onClick={onMinimize} size="icon" type="button" variant="ghost">
        <Minus className="h-4 w-4" aria-hidden="true" />
      </Button>
      <Button aria-label="챗봇 닫기" onClick={onClose} size="icon" type="button" variant="ghost">
        <X className="h-4 w-4" aria-hidden="true" />
      </Button>
    </header>
  );
}
