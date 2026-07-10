import type { KeyboardEvent, RefObject, UIEvent } from "react";
import { Loader2, RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ChatMessage, ChatSessionStatus } from "../../types/support";
import { ChatbotComposer } from "./ChatbotComposer";
import { ChatbotHeader } from "./ChatbotHeader";
import { ChatbotMessageList } from "./ChatbotMessageList";

type ChoiceHandler = (
  label: string,
  nextStepId?: string,
  terminal?: string,
  answer?: string,
) => void;

type ChatbotWindowProps = {
  activeChoicesMessageId: string | null;
  botTyping: boolean;
  cancelingHandoff: boolean;
  escalationOnly: boolean;
  input: string;
  messages: ChatMessage[];
  sending: boolean;
  status: ChatSessionStatus;
  stepId: string | null;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  viewportRef: RefObject<HTMLDivElement | null>;
  waitingElapsedLabel: string;
  onCancelHandoff: () => void;
  onChangeInput: (value: string) => void;
  onChoose: ChoiceHandler;
  onClose: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onMinimize: () => void;
  onRestart: () => void;
  onScroll: (event: UIEvent<HTMLDivElement>) => void;
  onSend: () => void;
  onTerminal: (choice: "resolved" | "unresolved" | "ai" | "agent" | "restart") => void;
};

export function ChatbotWindow({
  activeChoicesMessageId,
  botTyping,
  cancelingHandoff,
  escalationOnly,
  input,
  messages,
  sending,
  status,
  stepId,
  textareaRef,
  viewportRef,
  waitingElapsedLabel,
  onCancelHandoff,
  onChangeInput,
  onChoose,
  onClose,
  onKeyDown,
  onMinimize,
  onRestart,
  onScroll,
  onSend,
  onTerminal,
}: ChatbotWindowProps) {
  const canType = status === "AI" || status === "AGENT";

  return (
    <>
      <button
        aria-label="챗봇 닫기"
        className="fixed inset-0 z-40 bg-black/20 sm:bg-transparent"
        onClick={onClose}
        type="button"
      />
      <Card
        aria-label="챗봇 상담"
        aria-modal="false"
        className="fixed inset-x-2 bottom-20 top-2 z-50 flex min-h-0 flex-col overflow-hidden border shadow-2xl animate-floating-enter sm:inset-auto sm:bottom-20 sm:right-5 sm:h-[min(640px,calc(100vh-7rem))] sm:w-[400px]"
        role="dialog"
      >
        <ChatbotHeader status={status} onClose={onClose} onMinimize={onMinimize} onRestart={onRestart} />
        <ChatbotMessageList
          activeChoicesMessageId={activeChoicesMessageId}
          botTyping={botTyping}
          escalationOnly={escalationOnly}
          messages={messages}
          onChoose={onChoose}
          onScroll={onScroll}
          onTerminal={onTerminal}
          sending={sending}
          status={status}
          stepId={stepId}
          viewportRef={viewportRef}
        />
        {canType ? (
          <ChatbotComposer
            disabled={sending}
            onChange={onChangeInput}
            onKeyDown={onKeyDown}
            onSend={onSend}
            textareaRef={textareaRef}
            value={input}
          />
        ) : null}
        {status === "WAITING_AGENT" ? (
          <div className="flex shrink-0 items-center gap-2 border-t bg-card px-3 py-2 text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            <span className="flex-1">상담원 연결 대기 중...</span>
            <span className="tabular-nums">{waitingElapsedLabel}</span>
            <Button disabled={cancelingHandoff} onClick={onCancelHandoff} size="sm" type="button" variant="outline">
              {cancelingHandoff ? "처리 중" : "종료"}
            </Button>
          </div>
        ) : null}
        {status === "CLOSED" ? (
          <div className="flex shrink-0 items-center justify-between gap-3 border-t bg-card px-3 py-3 text-xs text-muted-foreground">
            <span>상담이 종료되었습니다.</span>
            <Button className="gap-1" onClick={onRestart} size="sm" type="button" variant="outline">
              <RefreshCcw className="h-3.5 w-3.5" aria-hidden="true" /> 새 문의 시작
            </Button>
          </div>
        ) : null}
      </Card>
    </>
  );
}
