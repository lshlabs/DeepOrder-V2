import {
  Bell,
  Bot,
  CheckCircle,
  ClipboardList,
  Headphones,
  KeyRound,
  ListChecks,
  MessageCircleQuestionMark,
  RefreshCcw,
  Settings,
  Store,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { QNA_INITIAL_OPTIONS, QNA_STEPS } from "../../data/supportData";

const INITIAL_OPTION_HINTS: Record<string, string> = {
  "q-orders": "신규/완료/취소",
  "q-alerts": "소리/권한/기기",
  "q-handling": "완료/체크/알레르기",
  "q-status": "일시중지/브레이크",
  "q-tasks": "담당 메뉴/수량",
  "q-staff": "로그인/PIN/비활성",
  "q-account": "비밀번호/재인증",
  "q-agent": "상담원에게 전달",
};

function getInitialOptionIcon(id: string) {
  const className = "h-4 w-4";
  if (id === "q-orders") return <ClipboardList className={className} aria-hidden="true" />;
  if (id === "q-alerts") return <Bell className={className} aria-hidden="true" />;
  if (id === "q-handling") return <ListChecks className={className} aria-hidden="true" />;
  if (id === "q-status") return <Store className={className} aria-hidden="true" />;
  if (id === "q-tasks") return <CheckCircle className={className} aria-hidden="true" />;
  if (id === "q-staff") return <KeyRound className={className} aria-hidden="true" />;
  if (id === "q-account") return <Settings className={className} aria-hidden="true" />;
  if (id === "q-agent") return <Headphones className={className} aria-hidden="true" />;
  return <MessageCircleQuestionMark className={className} aria-hidden="true" />;
}

type ChooseHandler = (
  label: string,
  nextStepId?: string,
  terminal?: string,
  answer?: string,
) => void;

type ChatbotSuggestionsProps = {
  stepId: string;
  escalationOnly?: boolean;
  onChoose: ChooseHandler;
  onTerminal: (choice: "resolved" | "unresolved" | "ai" | "agent" | "restart") => void;
};

const compactButton = "h-auto min-h-9 justify-start whitespace-normal px-3 py-2 text-left text-xs";

export function ChatbotSuggestions({
  stepId,
  escalationOnly = false,
  onChoose,
  onTerminal,
}: ChatbotSuggestionsProps) {
  if (escalationOnly) {
    return (
      <div className="grid grid-cols-2 gap-2">
        <Button className={compactButton} onClick={() => onTerminal("ai")} type="button" variant="outline">
          <Bot className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" /> AI에게 질문
        </Button>
        <Button className={compactButton} onClick={() => onTerminal("agent")} type="button" variant="outline">
          <Headphones className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" /> 상담원 연결
        </Button>
      </div>
    );
  }

  if (stepId === "terminal") {
    const choices = [
      { key: "resolved" as const, label: "해결됐어요", icon: CheckCircle, className: "text-success" },
      { key: "unresolved" as const, label: "해결되지 않았어요", icon: XCircle, className: "text-destructive" },
      { key: "ai" as const, label: "AI에게 질문", icon: Bot, className: "text-primary" },
      { key: "agent" as const, label: "상담원 연결", icon: Headphones, className: "" },
      { key: "restart" as const, label: "처음으로", icon: RefreshCcw, className: "col-span-2" },
    ];

    return (
      <div className="grid grid-cols-2 gap-2">
        {choices.map(({ key, label, icon: Icon, className }) => (
          <Button
            key={key}
            className={cn(compactButton, className)}
            onClick={() => onTerminal(key)}
            type="button"
            variant="outline"
          >
            <Icon className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" /> {label}
          </Button>
        ))}
      </div>
    );
  }

  const options =
    stepId === "initial"
      ? QNA_INITIAL_OPTIONS
      : (QNA_STEPS[stepId]?.options ?? []);

  if (options.length === 0) return null;

  return (
    <div className={cn("grid gap-2", stepId === "initial" ? "grid-cols-2" : "grid-cols-1")}>
      {options.map((option) => (
        <Button
          key={option.id}
          className={cn(
            "h-auto min-h-10 whitespace-normal border-border/70 bg-card px-3 py-2 text-left",
            stepId === "initial" ? "justify-start" : "justify-between",
          )}
          onClick={() => onChoose(option.label, option.nextStepId, option.terminal, option.answer)}
          type="button"
          variant="outline"
        >
          {stepId === "initial" ? (
            <>
              <span className="mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                {getInitialOptionIcon(option.id)}
              </span>
              <span className="flex min-w-0 flex-col items-start">
                <span className="text-xs font-semibold">{option.label}</span>
                <span className="text-[10px] font-normal text-muted-foreground">
                  {INITIAL_OPTION_HINTS[option.id]}
                </span>
              </span>
            </>
          ) : (
            <span className="text-xs">{option.label}</span>
          )}
        </Button>
      ))}
    </div>
  );
}
