import { getActionTone } from "../lib/analysisHelpers";
import type { OrderAIAnalysis } from "../../../../types";

type RequestPanelProps = {
  analysis: OrderAIAnalysis | null;
  customerRequest: string | null;
};

export function RequestPanel({
  analysis,
  customerRequest,
}: RequestPanelProps) {
  const rawText = customerRequest?.trim() ?? "";
  if (!analysis && !rawText) return null;

  if (!analysis) {
    return (
      <div className="kds-request-panel flex flex-col gap-1.5 border-t border-[rgba(234,179,8,0.18)] bg-[rgba(234,179,8,0.05)] px-3 py-[9px]">
        <span className="kds-request-label text-[9px] font-bold uppercase tracking-[0.07em] text-[#92400e]">요청사항</span>
        <p className="kds-request-text text-xs leading-[1.5] text-[var(--color-text-subtle)] [overflow-wrap:anywhere]">{rawText}</p>
      </div>
    );
  }

  const actions = analysis.kitchenActions ?? [];
  const hasActions = actions.length > 0;
  const hasRaw = rawText.length > 0;
  if (!hasActions && !hasRaw) return null;

  return (
    <div className={`kds-request-panel flex flex-col gap-1.5 px-3 py-[9px]${analysis.needsHumanCheck ? " needs-check border-t border-[var(--color-red-border)] bg-[rgba(239,68,68,0.04)]" : " border-t border-[rgba(234,179,8,0.18)] bg-[rgba(234,179,8,0.05)]"}`}>
      {analysis.needsHumanCheck ? (
        <span className="kds-request-label urgent text-[9px] font-bold uppercase tracking-[0.07em] text-[var(--color-red)]">AI 주의 요청</span>
      ) : (
        <span className="kds-request-label text-[9px] font-bold uppercase tracking-[0.07em] text-[#92400e]">요청사항</span>
      )}
      {hasActions ? (
        <div className="kds-action-chips flex flex-wrap gap-1">
          {actions.map((action, index) => (
            <span className={`kds-chip rounded-full px-2 py-0.5 text-[11px] font-semibold ${getActionTone(action) === "danger" ? "bg-[var(--color-red-subtle)] text-[var(--color-red)]" : getActionTone(action) === "cook" ? "bg-[var(--color-green-subtle)] text-[var(--color-green)]" : getActionTone(action) === "exclude" ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)]" : "bg-[var(--color-surface-3)] text-[var(--color-text-subtle)]"} ${getActionTone(action)}`} key={`${action.displayText}-${index}`}>
              {action.displayText}
            </span>
          ))}
        </div>
      ) : null}
      {hasRaw ? <p className="kds-request-text text-xs leading-[1.5] text-[var(--color-text-subtle)] [overflow-wrap:anywhere]">{rawText}</p> : null}
    </div>
  );
}
