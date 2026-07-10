import { useEffect, useRef, useState, type KeyboardEvent, type UIEvent } from "react";
import { MessageCircleQuestionMark } from "lucide-react";

import { Button } from "@/components/ui/button";
import { QNA_STEPS } from "../../data/supportData";
import { useChatbotSession } from "../../model/useChatbotSession";
import type { QnaPathEntry } from "../../types/support";
import { ChatbotWindow } from "./ChatbotWindow";

const SIMULATED_AI = [
  "말씀하신 내용을 확인했습니다. 설정 메뉴에서 해당 항목을 먼저 확인해 보시겠어요?",
  "kds-web 기능 기준으로 안내해 드릴게요. 조금 더 구체적으로 설명해 주시면 더 정확히 안내 가능합니다.",
  "해당 문제는 권한 설정과 관련이 있을 수 있습니다. 매니저 계정으로 확인이 필요합니다.",
  "직접 데이터 변경은 지원하지 않지만, 화면에서 처리하는 방법을 안내해 드릴 수 있습니다.",
  "이 문제는 상담원 연결이 필요한 경우일 수 있습니다. 상담원 연결을 원하시면 아래 버튼을 눌러주세요.",
];

const BOT_REPLY_DELAY_MS = 520;
const initializedSessions = new Set<string>();
const greetedSessions = new Set<string>();
let simulatedAiIndex = 0;

function nextSimulatedAiReply() {
  const reply = SIMULATED_AI[simulatedAiIndex % SIMULATED_AI.length];
  simulatedAiIndex += 1;
  return reply;
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function formatElapsedTime(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function ChatbotFab() {
  const {
    session,
    messages,
    isApiBacked,
    open,
    close,
    minimize,
    addMessage,
    setStatus,
    setPath,
    setCurrentStep,
    markRead,
    incrementUnread,
    endSession,
    startNewSession,
    requestAgentHandoff,
    cancelAgentHandoff,
  } = useChatbotSession();

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [cancelingHandoff, setCancelingHandoff] = useState(false);
  const [waitingStartedAtMs, setWaitingStartedAtMs] = useState<number | null>(null);
  const [waitNowMs, setWaitNowMs] = useState(() => Date.now());
  const [botTyping, setBotTyping] = useState(false);
  const [showEscalationChoices, setShowEscalationChoices] = useState(false);
  const [activeChoicesMessageId, setActiveChoicesMessageId] = useState<string | null>(null);

  const viewportRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const agentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userScrolledUpRef = useRef(false);

  const { isOpen, isMinimized, status, selectedPath, currentStepId, unreadCount } = session;

  function handleStartNewSession() {
    initializedSessions.delete(session.sessionId);
    greetedSessions.delete(session.sessionId);
    setShowEscalationChoices(false);
    setActiveChoicesMessageId(null);
    startNewSession();
  }

  useEffect(() => {
    if (!isOpen || isMinimized || userScrolledUpRef.current) return;
    const viewport = viewportRef.current;
    if (viewport) viewport.scrollTop = viewport.scrollHeight;
  }, [botTyping, isMinimized, isOpen, messages]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      userScrolledUpRef.current = false;
      markRead();
    }
  }, [isMinimized, isOpen, markRead]);

  useEffect(() => {
    if (!isOpen || isMinimized) return;

    function handleEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") close();
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [close, isMinimized, isOpen]);

  useEffect(() => {
    if (status !== "BOT") return;

    if (initializedSessions.has(session.sessionId)) {
      if (messages.length > 0 && currentStepId) {
        const lastBotMessage = [...messages].reverse().find((message) => message.role === "bot");
        if (lastBotMessage) setActiveChoicesMessageId(lastBotMessage.id);
      } else if (messages.length === 0 && !greetedSessions.has(session.sessionId)) {
        greetedSessions.add(session.sessionId);
        const greeting = addMessage({ role: "bot", content: "문의 유형을 선택해 주세요." });
        setCurrentStep("initial");
        setActiveChoicesMessageId(greeting.id);
      }
      return;
    }

    initializedSessions.add(session.sessionId);
    if (messages.length > 0) {
      if (currentStepId) {
        const lastBotMessage = [...messages].reverse().find((message) => message.role === "bot");
        if (lastBotMessage) setActiveChoicesMessageId(lastBotMessage.id);
      }
      return;
    }

    if (greetedSessions.has(session.sessionId)) return;
    greetedSessions.add(session.sessionId);
    const faqContext =
      selectedPath.length === 1 && selectedPath[0].stepId === "faq"
        ? selectedPath[0].selectedOptionLabel
        : null;
    const greeting = addMessage({
      role: "bot",
      content: faqContext
        ? "FAQ에서 이어진 문의입니다.\n관련 유형을 선택해 주세요."
        : "문의 유형을 선택해 주세요.",
    });
    setCurrentStep("initial");
    setActiveChoicesMessageId(greeting.id);
    // Session id is the intentional initialization boundary.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.sessionId]);

  useEffect(() => {
    if (isApiBacked || status !== "WAITING_AGENT") return;
    if (agentTimerRef.current) window.clearTimeout(agentTimerRef.current);
    agentTimerRef.current = window.setTimeout(() => {
      setStatus("AGENT");
      addMessage({ role: "system", content: "상담원이 연결되었습니다." });
      incrementUnread();
      addMessage({
        role: "agent",
        content: "안녕하세요. 상담원입니다. 불편을 드려 죄송합니다. 확인한 내용을 바탕으로 도움을 드리겠습니다.",
      });
      setActiveChoicesMessageId(null);
      incrementUnread();
    }, 3000);

    return () => {
      if (agentTimerRef.current) window.clearTimeout(agentTimerRef.current);
    };
    // Status drives the local handoff simulation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    if (status !== "WAITING_AGENT") {
      setWaitingStartedAtMs(null);
      return;
    }

    const startedAt = Date.now();
    setWaitingStartedAtMs(startedAt);
    setWaitNowMs(startedAt);
    const timer = window.setInterval(() => setWaitNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [session.sessionId, status]);

  function handleMessagesScroll(event: UIEvent<HTMLDivElement>) {
    const viewport = event.currentTarget;
    const distanceFromBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
    userScrolledUpRef.current = distanceFromBottom > 60;
  }

  async function handleBotChoice(
    label: string,
    nextStepId?: string,
    terminal?: string,
    answer?: string,
  ) {
    if (botTyping) return;

    addMessage({ role: "user", content: label });
    setActiveChoicesMessageId(null);
    userScrolledUpRef.current = false;

    const entry: QnaPathEntry = {
      stepId: currentStepId ?? "initial",
      question:
        currentStepId === "initial"
          ? "어떻게 도와드릴까요?"
          : (QNA_STEPS[currentStepId ?? ""]?.question ?? ""),
      selectedOptionLabel: label,
    };
    const nextPath = [...selectedPath, entry];
    setPath(nextPath);

    setBotTyping(true);
    await wait(BOT_REPLY_DELAY_MS);
    setBotTyping(false);

    if (terminal === "resolved") {
      const message = addMessage({ role: "bot", content: "문제가 해결되었나요?" });
      setCurrentStep("terminal");
      setActiveChoicesMessageId(message.id);
      return;
    }
    if (terminal === "agent") {
      transitionToAgent();
      return;
    }
    if (terminal === "ai") {
      transitionToAi();
      return;
    }

    if (answer) addMessage({ role: "bot", content: answer });

    if (nextStepId === "terminal") {
      const message = addMessage({ role: "bot", content: "문제가 해결되었나요?" });
      setCurrentStep("terminal");
      setActiveChoicesMessageId(message.id);
      return;
    }

    if (nextStepId && QNA_STEPS[nextStepId]) {
      const nextStep = QNA_STEPS[nextStepId];
      const message = addMessage({ role: "bot", content: nextStep.question });
      if (nextStep.autoTerminal) {
        const terminalMessage = addMessage({ role: "bot", content: "문제가 해결되었나요?" });
        setCurrentStep("terminal");
        setActiveChoicesMessageId(terminalMessage.id);
      } else {
        setCurrentStep(nextStepId);
        setActiveChoicesMessageId(message.id);
      }
    }
  }

  function handleTerminalChoice(choice: "resolved" | "unresolved" | "ai" | "agent" | "restart") {
    setActiveChoicesMessageId(null);
    userScrolledUpRef.current = false;

    if (choice === "resolved") {
      setShowEscalationChoices(false);
      addMessage({ role: "system", content: "문제가 해결되었습니다. 도움이 되었으면 좋겠습니다." });
      endSession();
      return;
    }
    if (choice === "unresolved") {
      setShowEscalationChoices(true);
      const message = addMessage({ role: "bot", content: "어떤 방식으로 도와드릴까요?" });
      setActiveChoicesMessageId(message.id);
      return;
    }
    if (choice === "ai") {
      setShowEscalationChoices(false);
      transitionToAi();
      return;
    }
    if (choice === "agent") {
      setShowEscalationChoices(false);
      transitionToAgent();
      return;
    }

    setShowEscalationChoices(false);
    addMessage({ role: "system", content: "처음으로 돌아갑니다." });
    setPath([]);
    setCurrentStep("initial");
    setStatus("BOT");
    const message = addMessage({ role: "bot", content: "아래에서 문제 유형을 다시 선택해 주세요." });
    setActiveChoicesMessageId(message.id);
  }

  function transitionToAi() {
    setStatus("AI");
    addMessage({ role: "ai", content: "추가로 궁금한 점을 자유롭게 입력해 주세요." });
    setActiveChoicesMessageId(null);
    userScrolledUpRef.current = false;
    window.setTimeout(() => textareaRef.current?.focus(), 80);
  }

  function transitionToAgent() {
    requestAgentHandoff();
    addMessage({ role: "system", content: "이전 상담 내용을 전달하고 상담원을 연결하고 있습니다." });
    userScrolledUpRef.current = false;
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || sending || status === "CLOSED" || status === "BOT" || status === "WAITING_AGENT") return;

    setInput("");
    setSending(true);
    userScrolledUpRef.current = false;
    addMessage({ role: "user", content: text });

    if (status === "AI") {
      if (!isApiBacked) {
        await wait(900);
        addMessage({ role: "ai", content: nextSimulatedAiReply() });
        incrementUnread();
      }
    } else if (status === "AGENT") {
      await wait(1200);
      addMessage({ role: "agent", content: "확인했습니다. 조금 더 상세히 확인 후 안내해 드리겠습니다." });
      incrementUnread();
    }

    setSending(false);
    textareaRef.current?.focus();
  }

  async function handleCancelHandoff() {
    if (cancelingHandoff) return;
    setCancelingHandoff(true);
    const canceled = await cancelAgentHandoff();
    setCancelingHandoff(false);
    if (canceled) {
      setActiveChoicesMessageId(null);
      textareaRef.current?.focus();
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing &&
      event.keyCode !== 229
    ) {
      event.preventDefault();
      void handleSend();
    }
  }

  const waitingElapsedLabel =
    status === "WAITING_AGENT" && waitingStartedAtMs !== null
      ? formatElapsedTime(waitNowMs - waitingStartedAtMs)
      : "0:00";

  return (
    <>
      {isOpen && !isMinimized ? (
        <ChatbotWindow
          activeChoicesMessageId={activeChoicesMessageId}
          botTyping={botTyping}
          cancelingHandoff={cancelingHandoff}
          escalationOnly={showEscalationChoices}
          input={input}
          messages={messages}
          onCancelHandoff={() => void handleCancelHandoff()}
          onChangeInput={setInput}
          onChoose={handleBotChoice}
          onClose={close}
          onKeyDown={handleKeyDown}
          onMinimize={minimize}
          onRestart={handleStartNewSession}
          onScroll={handleMessagesScroll}
          onSend={() => void handleSend()}
          onTerminal={handleTerminalChoice}
          sending={sending}
          status={status}
          stepId={currentStepId}
          textareaRef={textareaRef}
          viewportRef={viewportRef}
          waitingElapsedLabel={waitingElapsedLabel}
        />
      ) : null}

      {!isOpen || isMinimized ? (
        <span className="fixed bottom-[5.4rem] right-5 z-40 hidden rounded-full bg-foreground px-2.5 py-1 text-[11px] font-medium text-background shadow sm:block">
          챗봇 문의
        </span>
      ) : null}

      <Button
        aria-label={isOpen && !isMinimized ? "챗봇 최소화" : "챗봇 상담 열기"}
        className="fixed bottom-5 right-5 z-[60] h-12 w-12 rounded-full shadow-lg"
        onClick={() => (isOpen && !isMinimized ? minimize() : open())}
        size="icon"
        type="button"
      >
        <MessageCircleQuestionMark className="h-5 w-5" aria-hidden="true" />
        {unreadCount > 0 && (!isOpen || isMinimized) ? (
          <span
            className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground ring-2 ring-background"
            aria-label={`읽지 않은 메시지 ${unreadCount}개`}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </Button>
    </>
  );
}
