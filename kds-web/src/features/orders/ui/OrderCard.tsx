import { useEffect, useRef } from "react";
import type { CSSProperties, MouseEvent, PointerEvent } from "react";
import { AlarmClock, Check, Pin, TriangleAlert } from "lucide-react";
import { cva } from "class-variance-authority";

import { Button, Card } from "@/components/ui";
import { cn } from "@/lib/utils";

import { getAllergyRiskItemIds } from "../lib/analysisHelpers";
import {
  formatElapsedLabel,
  formatOrderCardTime,
  getElapsedMinutes,
  getOrderTypeLabel,
} from "../lib/orderFormatters";
import type { Order, OrderStatus } from "../types";
import { RequestPanel } from "./RequestPanel";

type OrderCardProps = {
  order: Order;
  now: number;
  pinned: boolean;
  updating: boolean;
  updatingItemId: string | null;
  onHeightChange?: (height: number) => void;
  onUpdateStatus: (orderId: number, status: OrderStatus) => Promise<void>;
  onCycleItem: (itemId: number, completedQuantity: number, targetQuantity: number) => Promise<void>;
  onCycleItemOption: (
    itemId: number,
    optionIndex: number,
    completedQuantity: number,
    targetQuantity: number,
  ) => Promise<void>;
  onContextMenu: (orderId: number, x: number, y: number) => void;
};

const elapsedBadgeVariants = cva("inline-flex items-center gap-1 text-[11px] font-semibold", {
  variants: {
    tone: {
      default: "text-muted-foreground",
      warning: "text-warning",
      urgent: "text-destructive",
    },
  },
  defaultVariants: { tone: "default" },
});

const orderTypeBadgeVariants = cva("rounded-sm px-2 py-0.5 text-[11px] font-bold", {
  variants: {
    type: {
      delivery: "bg-primary/10 text-primary",
      takeout: "bg-indigo-500/10 text-indigo-500",
      dine: "bg-muted text-muted-foreground",
    },
  },
  defaultVariants: { type: "dine" },
});

export function OrderCard({
  order,
  now,
  pinned,
  updating,
  updatingItemId,
  onHeightChange,
  onUpdateStatus,
  onCycleItem,
  onCycleItemOption,
  onContextMenu,
}: OrderCardProps) {
  const longPressTimerRef = useRef<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const orderTimestamp = order.ordered_at ?? order.created_at;
  const elapsedMinutes = getElapsedMinutes(now, orderTimestamp);
  const elapsedLabel = formatElapsedLabel(now, orderTimestamp);
  const orderedTime = formatOrderCardTime(orderTimestamp);
  const allergyRiskItemIds = getAllergyRiskItemIds(order.aiAnalysis);
  const elapsedTone = elapsedMinutes >= 15 ? "urgent" : elapsedMinutes >= 8 ? "warning" : "default";
  const orderTypeLabel = getOrderTypeLabel(order.platform);
  const normalizedPlatform = order.platform?.toLowerCase() ?? "";
  const orderType =
    normalizedPlatform.includes("delivery") || normalizedPlatform.includes("배달")
      ? "delivery"
      : normalizedPlatform.includes("takeout") || normalizedPlatform.includes("포장")
        ? "takeout"
        : "dine";

  function handlePointerDown(event: PointerEvent<HTMLElement>) {
    if (event.button !== 0) return;
    longPressTimerRef.current = window.setTimeout(() => {
      onContextMenu(order.id, event.clientX, event.clientY);
    }, 600);
  }

  function clearLongPress() {
    if (longPressTimerRef.current === null) return;
    window.clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = null;
  }

  function handleContextMenu(event: MouseEvent<HTMLElement>) {
    event.preventDefault();
    onContextMenu(order.id, event.clientX, event.clientY);
  }

  useEffect(() => {
    const cardElement = cardRef.current;
    if (!cardElement || !onHeightChange) return;
    const updateHeight = () => onHeightChange(Math.ceil(cardElement.getBoundingClientRect().height));
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(cardElement);
    return () => observer.disconnect();
  }, [onHeightChange, order.items.length]);

  return (
    <Card
      className={cn(
        "flex w-full flex-col overflow-hidden transition-colors",
        order.status === "DONE" && "opacity-60",
        pinned && "border-primary/30",
      )}
      ref={cardRef}
      onContextMenu={handleContextMenu}
      onPointerDown={handlePointerDown}
      onPointerLeave={clearLongPress}
      onPointerUp={clearLongPress}
    >
      <div
        className={cn(
          "flex items-center justify-between border-b px-3 py-2.5",
          pinned && "border-primary/30 bg-primary/10",
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          {pinned ? (
            <span
              aria-label="고정된 주문"
              className="inline-flex size-[22px] flex-none items-center justify-center rounded-sm border border-primary/30 bg-card text-primary"
              title="고정된 주문"
            >
              <Pin aria-hidden="true" size={13} />
            </span>
          ) : null}
          <span className="truncate text-xl font-extrabold leading-none tracking-[-0.5px]">
            #{order.order_number ?? order.id}
          </span>
          <span className={elapsedBadgeVariants({ tone: elapsedTone })}>
            <AlarmClock aria-hidden="true" size={11} />
            {elapsedLabel ? `${orderedTime} · ${elapsedLabel}` : orderedTime}
          </span>
        </div>
        <span className={orderTypeBadgeVariants({ type: orderType })}>{orderTypeLabel}</span>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto">
        {order.items.map((item) => (
          <div className="flex flex-col border-b last:border-b-0" key={item.id}>
            <OrderProgressRow
              allergy={allergyRiskItemIds.has(item.id)}
              completedQuantity={item.completedQuantity}
              disabled={updatingItemId === `item:${item.id}`}
              done={item.done}
              label={item.name}
              quantity={item.quantity}
              targetQuantity={item.targetQuantity}
              onActivate={() => onCycleItem(item.id, item.completedQuantity, item.targetQuantity)}
            />
            {item.options.map((option, optionIndex) => (
              <OrderProgressRow
                completedQuantity={option.completedQuantity}
                disabled={updatingItemId === `option:${item.id}:${optionIndex}`}
                done={option.done}
                indented
                key={option.id}
                label={option.label}
                targetQuantity={option.targetQuantity}
                onActivate={() =>
                  onCycleItemOption(
                    item.id,
                    optionIndex,
                    option.completedQuantity,
                    option.targetQuantity,
                  )
                }
              />
            ))}
          </div>
        ))}
      </div>

      <RequestPanel analysis={order.aiAnalysis} customerRequest={order.customer_request} />

      {order.status === "NEW" ? (
        <Button
          className="mt-auto h-11 w-full rounded-none border-0 border-t bg-success text-[13px] font-bold text-success-foreground hover:bg-success/90"
          disabled={updating}
          onClick={() => void onUpdateStatus(order.id, "COOKING")}
          type="button"
        >
          {updating ? "변경중…" : "조리 시작"}
        </Button>
      ) : order.status === "COOKING" ? (
        <Button
          className="mt-auto h-11 w-full rounded-none border-0 border-t text-[13px] font-bold"
          disabled={updating}
          onClick={() => void onUpdateStatus(order.id, "DONE")}
          type="button"
        >
          {updating ? "변경중…" : "완료"}
        </Button>
      ) : null}
    </Card>
  );
}

type OrderProgressRowProps = {
  allergy?: boolean;
  completedQuantity: number;
  disabled: boolean;
  done: boolean;
  indented?: boolean;
  label: string;
  quantity?: number;
  targetQuantity: number;
  onActivate: () => void;
};

function OrderProgressRow({
  allergy = false,
  completedQuantity,
  disabled,
  done,
  indented = false,
  label,
  quantity,
  targetQuantity,
  onActivate,
}: OrderProgressRowProps) {
  const progressRatio = getProgressRatio(completedQuantity, targetQuantity);
  return (
    <Button
      aria-pressed={done}
      className={cn(
        "relative h-auto w-full justify-start overflow-hidden rounded-none px-3 py-2.5 text-left font-normal hover:bg-muted/80",
        indented && "pl-6",
        allergy && !done && "bg-destructive/5",
        done && "bg-success/5 hover:bg-success/10",
      )}
      disabled={disabled}
      onClick={onActivate}
      type="button"
      variant="ghost"
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 bg-success/10"
        style={{ width: `${progressRatio * 100}%` } satisfies CSSProperties}
      />
      <span
        className={cn(
          "relative min-w-6 shrink-0 pt-px text-[13px] font-bold",
          done ? "text-success opacity-80" : "text-muted-foreground",
        )}
      >
        {quantity ?? ""}
      </span>
      <span
        className={cn(
          "relative min-w-0 flex-1 pl-1 text-sm font-semibold leading-[1.3]",
          indented && "text-[13px] font-medium before:mr-1.5 before:text-[10px] before:text-muted-foreground before:opacity-55 before:content-['└']",
          done && "text-success opacity-80 line-through",
          !done && indented && "text-foreground/75",
        )}
      >
        {label}
      </span>
      {allergy && !done ? (
        <span className="relative ml-1 flex shrink-0 justify-center pt-0.5 text-destructive" aria-label="알레르기 주의" title="알레르기 주의">
          <TriangleAlert aria-hidden="true" size={12} />
        </span>
      ) : done ? (
        <span className="relative ml-1 flex shrink-0 justify-center pt-0.5 text-success" aria-label="완료">
          <Check aria-hidden="true" size={12} />
        </span>
      ) : null}
    </Button>
  );
}

function getProgressRatio(completedQuantity: number, targetQuantity: number) {
  if (targetQuantity <= 0) return 0;
  return Math.max(0, Math.min(completedQuantity / targetQuantity, 1));
}
