import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Minus, Plus } from "lucide-react";

import { Button } from "../../../../components/ui/button";
import { PopoverPanel } from "../../../../shared/components/floating/PopoverPanel";
import type { StoreStatus } from "../../types";
import { StoreStatusDot } from "./StoreStatusDot";

type StoreStatusControlProps = {
  pauseMinutes: number;
  saving: boolean;
  status: StoreStatus;
  onCancelPendingPaused: () => void;
  onConfirmPaused: () => Promise<void>;
  onPauseMinutesChange: (updater: (minutes: number) => number) => void;
  onStatusChange: (status: StoreStatus) => Promise<void>;
};

export function StoreStatusControl({
  pauseMinutes,
  saving,
  status,
  onCancelPendingPaused,
  onConfirmPaused,
  onPauseMinutesChange,
  onStatusChange,
}: StoreStatusControlProps) {
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const titleId = useId();
  const sectionTitleId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const statusRefs = useRef<Record<StoreStatus, HTMLButtonElement | null>>({
    CLOSED: null,
    OPEN: null,
    PAUSED: null,
  });
  const statusOptions = ["OPEN", "PAUSED", "CLOSED"] as const satisfies readonly StoreStatus[];

  function getStatusLabel(nextStatus: StoreStatus) {
    return nextStatus === "OPEN" ? "영업중" : nextStatus === "PAUSED" ? "일시중지" : "영업종료";
  }

  function handleStatusChange(nextStatus: StoreStatus) {
    if (saving || nextStatus === status) {
      return;
    }
    if (nextStatus !== "PAUSED") {
      setOpen(false);
    }
    void onStatusChange(nextStatus);
  }

  function closeStatusPopup() {
    onCancelPendingPaused();
    setOpen(false);
  }

  function handleConfirmPaused() {
    setOpen(false);
    void onConfirmPaused();
  }

  function focusStatus(statusToFocus: StoreStatus) {
    statusRefs.current[statusToFocus]?.focus();
  }

  function handleStatusKeyDown(event: KeyboardEvent<HTMLButtonElement>, currentStatus: StoreStatus) {
    const currentIndex = statusOptions.indexOf(currentStatus);
    if (currentIndex === -1) return;

    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      handleStatusChange(currentStatus);
      return;
    }

    if (!["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft", "Home", "End"].includes(event.key)) {
      return;
    }

    event.preventDefault();

    let nextIndex = currentIndex;
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % statusOptions.length;
    } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + statusOptions.length) % statusOptions.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = statusOptions.length - 1;
    }

    const nextStatus = statusOptions[nextIndex];
    focusStatus(nextStatus);
    handleStatusChange(nextStatus);
  }

  useEffect(() => {
    if (!open) return;
    focusStatus(status);
  }, [open, status]);

  return (
    <div className="relative">
      <button
        className={`kds-store-status inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-xs font-semibold transition-colors kds-store-status--${status.toLowerCase()} ${
          status === "OPEN"
            ? "border-[var(--color-green-border)] bg-[var(--color-green-subtle)] text-[var(--color-green)]"
            : status === "PAUSED"
              ? "border-[rgba(250,204,21,0.32)] bg-[rgba(250,204,21,0.14)] text-[#ca8a04]"
              : "border-[var(--color-red-border)] bg-[var(--color-red-subtle)] text-[var(--color-red)]"
        }`}
        onClick={() => {
          if (open) {
            closeStatusPopup();
            return;
          }
          setOpen(true);
        }}
        onPointerDown={(event) => setAnchorEl(event.currentTarget)}
        ref={triggerRef}
        type="button"
        aria-label="매장 상태 변경"
        aria-expanded={open}
      >
        <StoreStatusDot status={status} />
        {getStatusLabel(status)}
      </button>

      <PopoverPanel
        ariaLabelledBy={titleId}
        className="kds-store-status-popup w-[min(248px,calc(100vw-24px))] min-w-[min(240px,calc(100vw-24px))] max-w-[min(260px,calc(100vw-24px))] rounded-md border border-border bg-background p-3 shadow-[var(--shadow-floating)]"
        onClose={closeStatusPopup}
        open={open}
        positioning={open ? { align: "end", anchorEl, side: "bottom" } : null}
        role="dialog"
      >
        <div className="kds-store-status-popup-surface flex flex-col gap-2">
          <p className="kds-store-status-popup-title px-2 py-1 text-xs font-semibold text-muted-foreground" id={titleId}>매장 상태</p>
          <div className="kds-store-status-options flex flex-col gap-px" role="radiogroup" aria-labelledby={titleId}>
            {statusOptions.map((nextStatus) => (
              <button
                key={nextStatus}
                ref={(node) => {
                  statusRefs.current[nextStatus] = node;
                }}
                className={`kds-store-status-popup-btn flex h-[var(--kds-select-item-height)] w-full items-center gap-2 rounded-sm px-3 text-left text-sm font-medium ${
                  status === nextStatus
                    ? "active bg-muted text-foreground font-semibold"
                    : "text-[var(--color-text-subtle)] hover:bg-muted hover:text-foreground"
                }`}
                onClick={() => handleStatusChange(nextStatus)}
                onKeyDown={(event) => handleStatusKeyDown(event, nextStatus)}
                type="button"
                role="radio"
                aria-checked={status === nextStatus}
                tabIndex={status === nextStatus ? 0 : -1}
              >
                <StoreStatusDot status={nextStatus} />
                {getStatusLabel(nextStatus)}
              </button>
            ))}
          </div>
          {status === "PAUSED" ? (
            <div className="kds-pause-duration mt-1 flex flex-col gap-2.5 border-t border-border pt-3" aria-labelledby={sectionTitleId}>
              <span className="kds-pause-duration-label text-xs font-semibold text-muted-foreground" id={sectionTitleId}>일시중지 시간</span>
              <div className="kds-pause-duration-control flex items-center justify-between gap-2">
                <button
                  className="kds-pause-stepper flex h-10 w-10 shrink-0 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                  onClick={() => onPauseMinutesChange((minutes) => Math.max(10, minutes - 10))}
                  type="button"
                  aria-label="10분 감소"
                >
                  <Minus size={16} aria-hidden="true" />
                </button>
                <span className="kds-pause-duration-value flex-1 text-center text-sm font-bold text-foreground" role="status" aria-live="polite">{pauseMinutes}분</span>
                <button
                  className="kds-pause-stepper flex h-10 w-10 shrink-0 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                  onClick={() => onPauseMinutesChange((minutes) => minutes + 10)}
                  type="button"
                  aria-label="10분 증가"
                >
                  <Plus size={16} aria-hidden="true" />
                </button>
              </div>
              <Button
                className="kds-pause-confirm h-10 w-full rounded-sm"
                disabled={saving}
                onClick={handleConfirmPaused}
                type="button"
              >
                확인
              </Button>
            </div>
          ) : null}
        </div>
      </PopoverPanel>
    </div>
  );
}
