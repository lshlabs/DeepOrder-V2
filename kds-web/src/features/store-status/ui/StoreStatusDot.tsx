import { cn } from "@/lib/utils";

import type { StoreStatus } from "../types";

type StoreStatusDotProps = {
  status: StoreStatus;
};

export function StoreStatusDot({ status }: StoreStatusDotProps) {
  const coreTone =
    status === "OPEN"
      ? "bg-success"
      : status === "PAUSED"
        ? "bg-warning"
        : "bg-destructive";

  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative inline-flex size-4 shrink-0 items-center justify-center overflow-hidden rounded-full",
        status === "OPEN" && "bg-success/15",
        status === "PAUSED" && "bg-warning/15",
        status === "CLOSED" && "bg-destructive/15",
      )}
    >
      <span className={cn("size-2 rounded-full", coreTone)} />
      {status === "OPEN" ? (
        <span className={cn("absolute size-2 animate-status-ping rounded-full", coreTone)} />
      ) : null}
    </span>
  );
}
