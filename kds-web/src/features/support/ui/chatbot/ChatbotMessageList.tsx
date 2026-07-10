import type { RefObject, UIEvent } from "react";
import { Bot, Headphones, MessageCircleQuestionMark } from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { ChatMessage, ChatSessionStatus } from "../../types/support";
import { ChatbotMessage } from "./ChatbotMessage";
import { ChatbotSuggestions } from "./ChatbotSuggestions";

type ChoiceHandler = (
  label: string,
  nextStepId?: string,
  terminal?: string,
  answer?: string,
) => void;

type ChatbotMessageListProps = {
  activeChoicesMessageId: string | null;
  botTyping: boolean;
  escalationOnly: boolean;
  messages: ChatMessage[];
  status: ChatSessionStatus;
  sending: boolean;
  stepId: string | null;
  viewportRef: RefObject<HTMLDivElement | null>;
  onChoose: ChoiceHandler;
  onScroll: (event: UIEvent<HTMLDivElement>) => void;
  onTerminal: (choice: "resolved" | "unresolved" | "ai" | "agent" | "restart") => void;
};

function TypingIndicator({ status }: { status: ChatSessionStatus }) {
  const isAgent = status === "AGENT";
  const Icon = isAgent ? Headphones : status === "AI" ? Bot : MessageCircleQuestionMark;

  return (
    <div className="flex items-start gap-2 py-1" aria-label="답변 작성 중">
      <span
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-full",
          isAgent ? "bg-success/10 text-success" : "bg-primary/10 text-primary",
        )}
      >
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
      <div className="flex h-9 items-center gap-1 rounded-2xl rounded-tl-sm border bg-card px-3 shadow-sm">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className={cn(
              "h-1.5 w-1.5 rounded-full bg-muted-foreground animate-typing-bounce",
              index === 1 && "[animation-delay:150ms]",
              index === 2 && "[animation-delay:300ms]",
            )}
          />
        ))}
      </div>
    </div>
  );
}

export function ChatbotMessageList({
  activeChoicesMessageId,
  botTyping,
  escalationOnly,
  messages,
  status,
  sending,
  stepId,
  viewportRef,
  onChoose,
  onScroll,
  onTerminal,
}: ChatbotMessageListProps) {
  return (
    <ScrollArea
      className="min-h-0 flex-1 bg-muted/25"
      onViewportScroll={onScroll}
      viewportClassName="px-3 py-3"
      viewportRef={viewportRef}
    >
      <div className="space-y-1" role="log" aria-live="polite">
        {messages.map((message) => {
          const showSuggestions =
            message.role === "bot" &&
            message.id === activeChoicesMessageId &&
            stepId &&
            !botTyping;

          return (
            <ChatbotMessage key={message.id} message={message}>
              {showSuggestions ? (
                <ChatbotSuggestions
                  escalationOnly={escalationOnly}
                  onChoose={onChoose}
                  onTerminal={onTerminal}
                  stepId={stepId}
                />
              ) : null}
            </ChatbotMessage>
          );
        })}
        {sending && (status === "AI" || status === "AGENT") ? <TypingIndicator status={status} /> : null}
        {botTyping && status === "BOT" ? <TypingIndicator status={status} /> : null}
      </div>
    </ScrollArea>
  );
}
