import { useState } from "react";

import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import type { StoreStatus } from "../types";
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

const STATUS_OPTIONS = ["OPEN", "PAUSED", "CLOSED"] as const satisfies readonly StoreStatus[];

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

  async function handleStatusChange(nextStatus: StoreStatus) {
    await onStatusChange(nextStatus);
    if (nextStatus !== "PAUSED") setOpen(false);
  }

  async function handleConfirmPaused() {
    await onConfirmPaused();
    setOpen(false);
  }

  function getStatusLabel(value: StoreStatus) {
    return value === "OPEN" ? "영업중" : value === "PAUSED" ? "일시중지" : "영업종료";
  }

  function getTone(value: StoreStatus) {
    if (value === "OPEN") return "border-success/30 bg-success/10 text-success";
    if (value === "PAUSED") return "border-warning/30 bg-warning/10 text-warning";
    return "border-destructive/30 bg-destructive/10 text-destructive";
  }

  return (
    <Popover
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) onCancelPendingPaused();
      }}
      open={open}
    >
      <PopoverTrigger asChild>
        <Button
          aria-label="매장 상태 변경"
          className={cn("h-8 gap-2 rounded-full px-3 text-xs font-semibold", getTone(status))}
          disabled={saving}
          type="button"
          variant="outline"
        >
          <StoreStatusDot status={status} />
          {getStatusLabel(status)}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 space-y-3 p-3" sideOffset={8}>
        <div>
          <p className="px-1 pb-2 text-xs font-semibold text-muted-foreground">매장 상태</p>
          <div aria-label="매장 상태" className="space-y-1" role="radiogroup">
            {STATUS_OPTIONS.map((nextStatus) => (
              <Button
                aria-checked={status === nextStatus}
                className={cn(
                  "w-full justify-start gap-2",
                  status === nextStatus && "bg-muted font-semibold",
                )}
                disabled={saving}
                key={nextStatus}
                onClick={() => void handleStatusChange(nextStatus)}
                role="radio"
                type="button"
                variant="ghost"
              >
                <StoreStatusDot status={nextStatus} />
                {getStatusLabel(nextStatus)}
              </Button>
            ))}
          </div>
        </div>

        {status === "PAUSED" ? (
          <>
            <Separator />
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground">일시중지 시간</p>
              <div className="flex items-center gap-2">
                <Button
                  aria-label="10분 감소"
                  disabled={saving}
                  onClick={() => onPauseMinutesChange((minutes) => Math.max(10, minutes - 10))}
                  size="icon"
                  type="button"
                  variant="outline"
                >
                  <Minus aria-hidden="true" className="size-4" />
                </Button>
                <span aria-live="polite" className="flex-1 text-center text-sm font-bold" role="status">
                  {pauseMinutes}분
                </span>
                <Button
                  aria-label="10분 증가"
                  disabled={saving}
                  onClick={() => onPauseMinutesChange((minutes) => minutes + 10)}
                  size="icon"
                  type="button"
                  variant="outline"
                >
                  <Plus aria-hidden="true" className="size-4" />
                </Button>
              </div>
              <Button
                className="w-full"
                disabled={saving}
                onClick={() => void handleConfirmPaused()}
                type="button"
              >
                {saving ? "저장 중…" : "확인"}
              </Button>
            </div>
          </>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
