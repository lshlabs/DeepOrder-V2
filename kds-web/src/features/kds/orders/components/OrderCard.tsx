import { useEffect, useRef } from "react";
import type { CSSProperties, KeyboardEvent, MouseEvent, PointerEvent } from "react";
import { AlarmClock, Check, Pin, TriangleAlert } from "lucide-react";

import { Button } from "../../../../components/ui";
import { getAllergyRiskItemIds } from "../lib/analysisHelpers";
import {
  formatElapsedLabel,
  formatOrderCardTime,
  getElapsedMinutes,
  getOrderTypeLabel,
} from "../lib/orderFormatters";
import type { Order, OrderStatus } from "../../../../types";
import { RequestPanel } from "./RequestPanel";

type OrderCardProps = {
  now: number;
  onContextMenu: (orderId: number, x: number, y: number) => void;
  onHeightChange?: (height: number) => void;
  onCycleItem: (itemId: number, completedQuantity: number, targetQuantity: number) => void;
  onCycleItemOption: (
    itemId: number,
    optionIndex: number,
    completedQuantity: number,
    targetQuantity: number,
  ) => void;
  onUpdateStatus: (orderId: number, status: OrderStatus) => Promise<void>;
  order: Order;
  pinned: boolean;
  updatingItemId: string | null;
  updating: boolean;
};

export function OrderCard({
  now,
  onContextMenu,
  onHeightChange,
  onCycleItem,
  onCycleItemOption,
  onUpdateStatus,
  order,
  pinned,
  updatingItemId,
  updating,
}: OrderCardProps) {
  const longPressTimerRef = useRef<number | null>(null);
  const cardRef = useRef<HTMLElement>(null);

  const orderTimestamp = order.ordered_at ?? order.created_at;
  const orderedTime = formatOrderCardTime(orderTimestamp);
  const elapsedLabel = order.status === "DONE" ? null : formatElapsedLabel(now, orderTimestamp);
  const elapsedMinutes = getElapsedMinutes(now, orderTimestamp);
  const allergyRiskItemIds = getAllergyRiskItemIds(order.aiAnalysis);
  const isUrgent = elapsedMinutes >= 15;
  const isWarning = elapsedMinutes >= 8 && elapsedMinutes < 15;
  const orderTypeLabel = getOrderTypeLabel(order.platform);

  function handlePointerDown(e: PointerEvent<HTMLElement>) {
    if (e.button !== 0) return;
    longPressTimerRef.current = window.setTimeout(() => {
      onContextMenu(order.id, e.clientX, e.clientY);
    }, 600);
  }

  function handlePointerUp() {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }

  function handleContextMenu(e: MouseEvent<HTMLElement>) {
    e.preventDefault();
    onContextMenu(order.id, e.clientX, e.clientY);
  }

  function handleItemKeyDown(
    e: KeyboardEvent<HTMLDivElement>,
    isUpdatingItem: boolean,
    onAdvance: () => void,
  ) {
    if ((e.key === "Enter" || e.key === " ") && !isUpdatingItem) {
      onAdvance();
    }
  }

  useEffect(() => {
    const cardEl = cardRef.current;
    if (!cardEl || !onHeightChange) return;
    const updateHeight = () => onHeightChange(Math.ceil(cardEl.getBoundingClientRect().height));
    updateHeight();
    const observer = new ResizeObserver(() => updateHeight());
    observer.observe(cardEl);
    return () => observer.disconnect();
  }, [onHeightChange, order.id]);

  return (
    <article
      className={`kds-card flex w-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] transition-colors${order.status === "DONE" ? " done opacity-60" : ""}${pinned ? " pinned border-[var(--color-accent-border)]" : ""}`}
      ref={cardRef}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onContextMenu={handleContextMenu}
    >
      <div className={`kds-card-head flex items-center justify-between border-b border-[var(--color-border)] px-3 py-[9px]${pinned ? " bg-[var(--color-accent-subtle)] border-b-[var(--color-accent-border)]" : ""}`}>
        <div className="kds-card-head-left flex items-center gap-2">
          {pinned ? (
            <span className="kds-card-pin inline-flex h-[22px] w-[22px] flex-none items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-accent-border)] bg-[var(--color-surface)] text-[var(--color-accent)]" aria-label="고정된 주문" title="고정된 주문">
              <Pin size={13} aria-hidden="true" />
            </span>
          ) : null}
          <span className="kds-order-num text-[20px] font-extrabold leading-none tracking-[-0.5px] text-[var(--color-text)]">#{order.order_number ?? order.id}</span>
          <span className={`kds-elapsed-badge inline-flex items-center gap-[3px] text-[11px] font-semibold${isUrgent ? " urgent text-[var(--color-red)]" : isWarning ? " warning text-[var(--color-amber)]" : " text-[var(--color-text-muted)]"}`}>
            <AlarmClock size={11} aria-hidden="true" />
            {elapsedLabel ? `${orderedTime} · ${elapsedLabel}` : orderedTime}
          </span>
        </div>
        <span className={`kds-order-type-badge rounded-[var(--radius-sm)] px-[7px] py-0.5 text-[11px] font-bold kds-order-type-badge--${order.platform?.toLowerCase().includes("delivery") || order.platform?.toLowerCase().includes("배달") ? "delivery bg-[rgba(249,115,22,0.1)] text-[var(--color-accent)]" : order.platform?.toLowerCase().includes("takeout") || order.platform?.toLowerCase().includes("포장") ? "takeout bg-[rgba(99,102,241,0.1)] text-[#818cf8]" : "dine bg-[var(--color-surface-2)] text-[var(--color-text-muted)]"}`}>
          {orderTypeLabel}
        </span>
      </div>

      <div className="kds-items">
        {order.items.map((item, idx) => {
          const isDone = item.done;
          const isLast = idx === order.items.length - 1;
          const hasAllergy = allergyRiskItemIds.has(item.id);
          const isUpdatingItem = updatingItemId === `item:${item.id}`;
          const itemProgressRatio = getProgressRatio(item.completedQuantity, item.targetQuantity);
          return (
            <div className="kds-item-group" key={item.id}>
              <div
                className={`kds-item flex cursor-pointer select-none items-start gap-0 px-3 py-[9px] transition-[background]${hasAllergy ? " allergy [--kds-row-bg:rgba(220,38,38,0.06)]" : " [--kds-row-bg:var(--color-surface)]"}${isDone ? " done [--kds-row-bg:rgba(34,197,94,0.05)] hover:[--kds-row-bg:rgba(34,197,94,0.08)]" : " hover:[--kds-row-bg:var(--color-surface-2)]"}${isLast && item.options.length === 0 ? " last" : ""}`}
                onClick={() => !isUpdatingItem && onCycleItem(item.id, item.completedQuantity, item.targetQuantity)}
                role="button"
                tabIndex={0}
                aria-pressed={isDone}
                style={{ "--kds-progress-ratio": itemProgressRatio } as CSSProperties}
                onKeyDown={(e) => handleItemKeyDown(e, isUpdatingItem, () => (
                  onCycleItem(item.id, item.completedQuantity, item.targetQuantity)
                ))}
              >
                <span className={`kds-item-qty min-w-6 shrink-0 pt-px text-[13px] font-bold ${isDone ? "text-[var(--color-green)] opacity-80" : "text-[var(--color-text-muted)]"}`}>{item.quantity}</span>
                <div className="kds-item-content flex flex-1 flex-col gap-0.5 pl-1">
                  <span className={`kds-item-name text-sm font-semibold leading-[1.3] ${isDone ? "text-[var(--color-green)] opacity-80 line-through" : "text-[var(--color-text)]"}`}>{item.name}</span>
                </div>
                {hasAllergy && !isDone ? (
                  <span className="kds-item-flag allergy ml-1 flex shrink-0 justify-center pt-0.5 text-[var(--color-red)]" aria-label="알레르기 주의" title="알레르기 주의">
                    <TriangleAlert size={12} aria-hidden="true" />
                  </span>
                ) : isDone ? (
                  <span className="kds-item-flag done ml-1 flex shrink-0 justify-center pt-0.5 text-[var(--color-green)]" aria-label="완료">
                    <Check size={12} aria-hidden="true" />
                  </span>
                ) : null}
              </div>
              {item.options.map((option, optionIndex) => {
                const isOptionDone = option.done;
                const isUpdatingOption = updatingItemId === `option:${item.id}:${optionIndex}`;
                const optionProgressRatio = getProgressRatio(option.completedQuantity, option.targetQuantity);
                return (
                  <div
                    key={option.id}
                    className={`kds-item kds-item--option flex cursor-pointer select-none items-start gap-0 px-3 py-[9px] pl-6 transition-[background]${isOptionDone ? " done [--kds-row-bg:rgba(34,197,94,0.05)] hover:[--kds-row-bg:rgba(34,197,94,0.08)]" : " [--kds-row-bg:var(--color-surface)] hover:[--kds-row-bg:var(--color-surface-2)]"}${isLast && optionIndex === item.options.length - 1 ? " last" : ""}`}
                    onClick={() => !isUpdatingOption && (
                      onCycleItemOption(item.id, optionIndex, option.completedQuantity, option.targetQuantity)
                    )}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isOptionDone}
                    style={{ "--kds-progress-ratio": optionProgressRatio } as CSSProperties}
                    onKeyDown={(e) => handleItemKeyDown(e, isUpdatingOption, () => (
                      onCycleItemOption(item.id, optionIndex, option.completedQuantity, option.targetQuantity)
                    ))}
                  >
                    <span className={`kds-item-qty min-w-6 shrink-0 pt-px text-[13px] font-bold ${isOptionDone ? "text-[var(--color-green)] opacity-80" : "text-[var(--color-text-muted)]"}`} aria-hidden="true" />
                    <div className="kds-item-content flex flex-1 flex-col gap-0.5 pl-1">
                      <span className={`kds-item-name text-[13px] font-medium leading-[1.3] before:mr-1.5 before:text-[10px] before:text-[var(--color-text-muted)] before:opacity-55 before:content-['└'] ${isOptionDone ? "text-[var(--color-green)] opacity-80 line-through" : "text-[var(--color-text-subtle)]"}`}>{option.label}</span>
                    </div>
                    {isOptionDone ? (
                      <span className="kds-item-flag done ml-1 flex shrink-0 justify-center pt-0.5 text-[var(--color-green)]" aria-label="완료">
                        <Check size={12} aria-hidden="true" />
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <RequestPanel analysis={order.aiAnalysis} customerRequest={order.customer_request} />

      {order.status === "NEW" ? (
        <Button
          className="kds-action-btn start mt-auto h-11 w-full rounded-none border-0 border-t border-transparent bg-[var(--color-green)] text-[13px] font-bold tracking-[-0.1px] text-[var(--color-accent-fg)] hover:bg-[#15803d]"
          disabled={updating}
          onClick={() => void onUpdateStatus(order.id, "COOKING")}
          type="button"
          variant="ghost"
        >
          {updating ? "변경중…" : "조리 시작"}
        </Button>
      ) : order.status === "COOKING" ? (
        <Button
          className="kds-action-btn complete mt-auto h-11 w-full rounded-none border-0 border-t border-transparent bg-[var(--color-accent)] text-[13px] font-bold tracking-[-0.1px] text-[var(--color-accent-fg)] hover:bg-[var(--color-accent-hover)]"
          disabled={updating}
          onClick={() => void onUpdateStatus(order.id, "DONE")}
          type="button"
          variant="ghost"
        >
          {updating ? "변경중…" : "완료"}
        </Button>
      ) : null}
    </article>
  );
}

function getProgressRatio(completedQuantity: number, targetQuantity: number) {
  if (targetQuantity <= 0) return 0;
  return Math.max(0, Math.min(completedQuantity / targetQuantity, 1));
}
