import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

import { getActionTone } from "../lib/analysisHelpers";
import type { OrderAIAnalysis } from "../types";

const actionChipVariants = cva("rounded-full px-2 py-0.5 text-[11px] font-semibold", {
  variants: {
    tone: {
      danger: "bg-destructive/10 text-destructive",
      cook: "bg-success/10 text-success",
      exclude: "bg-primary/10 text-primary",
      neutral: "bg-muted text-foreground/75",
    },
  },
  defaultVariants: { tone: "neutral" },
});

type RequestPanelProps = {
  analysis: OrderAIAnalysis | null;
  customerRequest: string | null;
};

export function RequestPanel({ analysis, customerRequest }: RequestPanelProps) {
  const rawText = customerRequest?.trim() ?? "";
  if (!analysis && !rawText) return null;

  const actions = analysis?.kitchenActions ?? [];
  const hasActions = actions.length > 0;
  const hasRaw = rawText.length > 0;
  if (!hasActions && !hasRaw) return null;

  const needsHumanCheck = analysis?.needsHumanCheck ?? false;

  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 border-t px-3 py-2.5",
        needsHumanCheck ? "border-destructive/25 bg-destructive/5" : "border-warning/20 bg-warning/5",
      )}
    >
      <span
        className={cn(
          "text-[9px] font-bold uppercase tracking-[0.07em]",
          needsHumanCheck ? "text-destructive" : "text-warning",
        )}
      >
        {needsHumanCheck ? "AI 주의 요청" : "요청사항"}
      </span>
      {hasActions ? (
        <div className="flex flex-wrap gap-1">
          {actions.map((action, index) => (
            <span
              className={actionChipVariants({ tone: getActionTone(action) })}
              key={`${action.displayText}-${index}`}
            >
              {action.displayText}
            </span>
          ))}
        </div>
      ) : null}
      {hasRaw ? <p className="text-xs leading-relaxed text-foreground/75 [overflow-wrap:anywhere]">{rawText}</p> : null}
    </div>
  );
}
