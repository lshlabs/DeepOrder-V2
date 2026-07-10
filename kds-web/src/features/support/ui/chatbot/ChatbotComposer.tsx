import type { KeyboardEvent, RefObject } from "react";
import { Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type ChatbotComposerProps = {
  disabled: boolean;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (value: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onSend: () => void;
};

export function ChatbotComposer({
  disabled,
  textareaRef,
  value,
  onChange,
  onKeyDown,
  onSend,
}: ChatbotComposerProps) {
  return (
    <div className="flex shrink-0 items-end gap-2 border-t bg-card p-3">
      <Textarea
        ref={textareaRef}
        className="max-h-28 min-h-11 resize-none"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder="메시지를 입력하세요..."
        rows={2}
        value={value}
      />
      <Button
        aria-label="보내기"
        className="h-11 w-11 shrink-0"
        disabled={!value.trim() || disabled}
        onClick={onSend}
        size="icon"
        type="button"
      >
        <Send className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  );
}
