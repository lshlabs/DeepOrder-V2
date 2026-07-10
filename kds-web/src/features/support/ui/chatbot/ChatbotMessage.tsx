import { Bot, Headphones, MessageCircleQuestionMark } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ChatMessage as ChatMessageType } from "../../types/support";

function formatTime(date: Date): string {
  return date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Seoul",
  });
}

type ChatbotMessageProps = {
  message: ChatMessageType;
  children?: React.ReactNode;
};

function MessageLines({ content }: { content: string }) {
  return content.split("\n").map((line, index) => <p key={`${line}-${index}`}>{line || "\u00A0"}</p>);
}

export function ChatbotMessage({ message, children }: ChatbotMessageProps) {
  if (message.role === "system") {
    return (
      <div className="flex justify-center py-1">
        <span className="rounded-full bg-muted px-3 py-1 text-center text-[11px] text-muted-foreground">
          {message.content}
        </span>
      </div>
    );
  }

  if (message.role === "user") {
    return (
      <div className="flex justify-end py-1">
        <div className="max-w-[84%] space-y-1 text-right">
          <div className="rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-left text-sm leading-5 text-primary-foreground shadow-sm">
            <MessageLines content={message.content} />
          </div>
          <time className="block text-[10px] text-muted-foreground">{formatTime(message.timestamp)}</time>
        </div>
      </div>
    );
  }

  const isAgent = message.role === "agent";
  const isAi = message.role === "ai";
  const Icon = isAgent ? Headphones : isAi ? Bot : MessageCircleQuestionMark;

  return (
    <div className="space-y-2 py-1">
      <div className="flex items-start gap-2">
        <span
          className={cn(
            "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
            isAgent
              ? "bg-success/10 text-success"
              : isAi
                ? "bg-primary/10 text-primary"
                : "bg-secondary text-secondary-foreground",
          )}
          aria-hidden="true"
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
        <div className="max-w-[84%] space-y-1">
          <div className="rounded-2xl rounded-tl-sm border bg-card px-3 py-2 text-sm leading-5 shadow-sm">
            <MessageLines content={message.content} />
          </div>
          <time className="block text-[10px] text-muted-foreground">{formatTime(message.timestamp)}</time>
        </div>
      </div>
      {children ? <div className="pl-9">{children}</div> : null}
    </div>
  );
}
