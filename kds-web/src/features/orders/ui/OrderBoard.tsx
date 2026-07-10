import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type TouchEvent as ReactTouchEvent,
} from "react";
import { ArrowDown, Check, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

import { buildOrderLayoutColumns } from "../lib/orderLayout";
import type { Order, OrderStatus } from "../types";
import { OrderCard } from "./OrderCard";

type OrderBoardProps = {
  orders: Order[];
  pinnedOrderIds: number[];
  loading: boolean;
  newOrderSignal: number;
  now: number;
  refreshing: boolean;
  updatingOrderId: number | null;
  updatingItemId: string | null;
  emptyMessage: string;
  onRefresh: () => Promise<void>;
  onUpdateStatus: (orderId: number, status: OrderStatus) => Promise<void>;
  onCycleItem: (itemId: number, completedQuantity: number, targetQuantity: number) => Promise<void>;
  onCycleItemOption: (
    itemId: number,
    optionIndex: number,
    completedQuantity: number,
    targetQuantity: number,
  ) => Promise<void>;
  onOpenContextMenu: (orderId: number, x: number, y: number) => void;
};

const PULL_TO_REFRESH_THRESHOLD = 56;
const PULL_TO_REFRESH_MAX = 64;
const PULL_TO_REFRESH_REFRESHING_HEIGHT = 36;

type PullPhase = "idle" | "pulling" | "ready" | "refreshing" | "done";

export function OrderBoard({
  orders,
  pinnedOrderIds,
  loading,
  newOrderSignal,
  now,
  refreshing,
  updatingOrderId,
  updatingItemId,
  emptyMessage,
  onRefresh,
  onUpdateStatus,
  onCycleItem,
  onCycleItemOption,
  onOpenContextMenu,
}: OrderBoardProps) {
  const laneRef = useRef<HTMLDivElement>(null);
  const pullStartYRef = useRef<number | null>(null);
  const pullActiveRef = useRef(false);
  const pullDraggingRef = useRef(false);
  const [laneHeight, setLaneHeight] = useState(0);
  const [orderCardHeights, setOrderCardHeights] = useState<Record<number, number>>({});
  const [isMobile, setIsMobile] = useState(false);
  const [pullOffset, setPullOffset] = useState(0);
  const [pullPhase, setPullPhase] = useState<PullPhase>("idle");

  useEffect(() => {
    const mobileQuery = window.matchMedia("(max-width: 767px)");
    const updateIsMobile = () => setIsMobile(mobileQuery.matches);
    updateIsMobile();
    mobileQuery.addEventListener("change", updateIsMobile);
    return () => mobileQuery.removeEventListener("change", updateIsMobile);
  }, []);

  useEffect(() => {
    const laneElement = laneRef.current;
    if (!laneElement) return;
    const updateLaneHeight = () => setLaneHeight(laneElement.clientHeight);
    updateLaneHeight();
    const observer = new ResizeObserver(updateLaneHeight);
    observer.observe(laneElement);
    return () => observer.disconnect();
  }, [orders]);

  useEffect(() => {
    const laneElement = laneRef.current;
    if (!laneElement) return;
    const blockPullScroll = (event: TouchEvent) => {
      if (pullDraggingRef.current) event.preventDefault();
    };
    laneElement.addEventListener("touchmove", blockPullScroll, { passive: false });
    return () => laneElement.removeEventListener("touchmove", blockPullScroll);
  }, [orders]);

  useEffect(() => {
    if (newOrderSignal === 0 || refreshing || pullActiveRef.current || pullDraggingRef.current) return;
    const laneElement = laneRef.current;
    if (!laneElement) return;
    if (isMobile) laneElement.scrollTop = 0;
    else laneElement.scrollLeft = 0;
  }, [isMobile, newOrderSignal, refreshing]);

  const orderLayoutColumns = useMemo(
    () => buildOrderLayoutColumns(orders, orderCardHeights, laneHeight),
    [orders, orderCardHeights, laneHeight],
  );
  const pinnedOrderIdSet = useMemo(() => new Set(pinnedOrderIds), [pinnedOrderIds]);
  const renderedColumns = isMobile ? [{ width: "base" as const, orders }] : orderLayoutColumns;
  const displayPullPhase: PullPhase = refreshing && isMobile ? "refreshing" : pullPhase;
  const isPullActive = displayPullPhase !== "idle";
  const isPulling = displayPullPhase === "pulling" || displayPullPhase === "ready";
  const pullIndicatorHeight =
    displayPullPhase === "refreshing" || displayPullPhase === "done"
      ? PULL_TO_REFRESH_REFRESHING_HEIGHT
      : pullOffset;
  const pullProgress = Math.min(pullOffset / PULL_TO_REFRESH_THRESHOLD, 1);
  const laneStyle = {
    transform: isMobile ? `translateY(${pullOffset}px)` : undefined,
  } satisfies CSSProperties;

  function resetPullState() {
    pullActiveRef.current = false;
    pullDraggingRef.current = false;
    pullStartYRef.current = null;
    setPullOffset(0);
    setPullPhase("idle");
  }

  function handleTouchStart(event: ReactTouchEvent<HTMLDivElement>) {
    if (!isMobile || loading || refreshing) return;
    const laneElement = laneRef.current;
    if (!laneElement || laneElement.scrollTop > 0) return;
    pullActiveRef.current = true;
    pullDraggingRef.current = false;
    pullStartYRef.current = event.touches[0]?.clientY ?? null;
    setPullPhase("idle");
  }

  function handleTouchMove(event: ReactTouchEvent<HTMLDivElement>) {
    if (!pullActiveRef.current || pullStartYRef.current === null || loading || refreshing) return;
    const laneElement = laneRef.current;
    if (!laneElement || laneElement.scrollTop > 0) {
      resetPullState();
      return;
    }

    const deltaY = (event.touches[0]?.clientY ?? 0) - pullStartYRef.current;
    if (deltaY <= 0) {
      pullDraggingRef.current = false;
      setPullOffset(0);
      setPullPhase("idle");
      return;
    }

    const nextOffset = Math.min(deltaY * 0.35, PULL_TO_REFRESH_MAX);
    pullDraggingRef.current = true;
    if (event.cancelable) event.preventDefault();
    setPullOffset(nextOffset);
    setPullPhase(nextOffset >= PULL_TO_REFRESH_THRESHOLD ? "ready" : "pulling");
  }

  function handleTouchEnd() {
    if (!pullActiveRef.current) return;
    const shouldRefresh = isMobile && pullOffset >= PULL_TO_REFRESH_THRESHOLD && !loading && !refreshing;
    if (!shouldRefresh) {
      resetPullState();
      return;
    }

    pullActiveRef.current = false;
    pullDraggingRef.current = false;
    pullStartYRef.current = null;
    setPullOffset(PULL_TO_REFRESH_REFRESHING_HEIGHT);
    setPullPhase("refreshing");
    void onRefresh().finally(() => {
      setPullPhase("done");
      window.setTimeout(resetPullState, 500);
    });
  }

  function renderPullIndicatorIcon() {
    if (displayPullPhase === "done") {
      return <Check aria-hidden="true" size={14} strokeWidth={2} />;
    }
    if (displayPullPhase === "refreshing") {
      return <Loader2 aria-hidden="true" className="animate-spin" size={14} strokeWidth={1.75} />;
    }
    return (
      <ArrowDown
        aria-hidden="true"
        className={cn("transition-transform duration-150", displayPullPhase === "ready" && "rotate-180")}
        size={14}
        strokeWidth={1.75}
        style={{ opacity: 0.2 + pullProgress * 0.8 }}
      />
    );
  }

  return (
    <section
      aria-label="주문 보드"
      className="relative flex-1 overflow-hidden p-2.5 md:px-4 md:py-3.5"
      onTouchCancel={handleTouchEnd}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onTouchStart={handleTouchStart}
    >
      {isMobile ? (
        <div
          aria-hidden={!isPullActive}
          className={cn(
            "pointer-events-none absolute inset-x-2.5 top-0 z-0 flex items-center justify-center overflow-hidden text-muted-foreground transition-[height,opacity] duration-200",
            isPullActive ? "opacity-100" : "opacity-0",
          )}
          style={{ height: `${pullIndicatorHeight}px` }}
        >
          <span className="grid size-5 place-items-center">{renderPullIndicatorIcon()}</span>
        </div>
      ) : null}
      {orders.length === 0 ? (
        <div className="flex h-full w-full items-center justify-center text-[13px] text-muted-foreground">
          {loading ? "주문을 불러오는 중…" : emptyMessage}
        </div>
      ) : (
        <div
          className={cn(
            "relative z-[1] flex h-full flex-col items-start gap-2.5 overflow-x-hidden overflow-y-auto overscroll-y-contain transition-transform duration-300 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
            "md:static md:flex-row md:overflow-x-auto md:overflow-y-hidden md:overscroll-y-auto md:pb-2.5 md:[scroll-snap-type:x_proximity] md:transform-none md:transition-none",
            isPulling && "transition-none",
          )}
          ref={laneRef}
          style={laneStyle}
        >
          {renderedColumns.map((column) => (
            <div
              className={cn(
                "flex w-full flex-none flex-col gap-2.5 [scroll-snap-align:start] md:w-auto md:basis-[280px]",
                column.width === "wide" && "md:basis-[320px] lg:basis-[360px]",
                column.width === "xwide" && "md:basis-[384px] lg:basis-[440px]",
              )}
              key={`${column.width}-${column.orders.map((order) => order.id).join("-")}`}
            >
              {column.orders.map((order) => (
                <OrderCard
                  key={order.id}
                  now={now}
                  onContextMenu={onOpenContextMenu}
                  onHeightChange={(height) => {
                    setOrderCardHeights((previous) =>
                      previous[order.id] === height ? previous : { ...previous, [order.id]: height },
                    );
                  }}
                  onCycleItem={onCycleItem}
                  onCycleItemOption={onCycleItemOption}
                  onUpdateStatus={onUpdateStatus}
                  order={order}
                  pinned={pinnedOrderIdSet.has(order.id)}
                  updatingItemId={updatingItemId}
                  updating={updatingOrderId === order.id}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
