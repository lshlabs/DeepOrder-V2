import { useEffect, useState, type ReactNode } from "react";
import { ClockArrowDown, ClockArrowUp, Menu, RefreshCw, Trash2, X } from "lucide-react";

import type { BoardTab, OrderSortDirection, StoreStatus } from "../../types";
import { StoreStatusControl } from "../../store-status/components/StoreStatusControl";

type KdsTopbarProps = {
  activeTab: BoardTab;
  archivingCompleted: boolean;
  doneCount: number;
  loading: boolean;
  orderSortDirection: OrderSortDirection;
  pauseMinutes: number;
  receivedCount: number;
  refreshing: boolean;
  savingStoreStatus: boolean;
  storeStatus: StoreStatus;
  rightContent?: ReactNode;
  onArchiveClick: () => void;
  onCancelPendingPaused: () => void;
  onConfirmPaused: () => Promise<void>;
  onPauseMinutesChange: (updater: (minutes: number) => number) => void;
  onRefresh: () => Promise<void>;
  onSortToggle: () => void;
  onStatusChange: (status: StoreStatus) => Promise<void>;
  onTabChange: (tab: BoardTab) => void;
};

export function KdsTopbar({
  activeTab,
  archivingCompleted,
  doneCount,
  loading,
  orderSortDirection,
  pauseMinutes,
  receivedCount,
  refreshing,
  savingStoreStatus,
  storeStatus,
  rightContent,
  onArchiveClick,
  onCancelPendingPaused,
  onConfirmPaused,
  onPauseMinutesChange,
  onRefresh,
  onSortToggle,
  onStatusChange,
  onTabChange,
}: KdsTopbarProps) {
  const [fabOpen, setFabOpen] = useState(false);
  const isWorkTab = activeTab === "RECEIVED" || activeTab === "DONE" || activeTab === "MY_TASKS";
  const showOrderControls = activeTab === "RECEIVED" || activeTab === "DONE";
  const showArchiveAction = isWorkTab && activeTab === "DONE" && doneCount > 0;

  useEffect(() => {
    setFabOpen(false);
  }, [activeTab]);

  const iconButtonBase =
    "kds-icon-btn h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-transparent text-[var(--color-text-muted)] transition-[color,border-color,background] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)] disabled:cursor-default disabled:opacity-40";

  return (
    <>
      <header className={`kds-topbar kds-topbar--${activeTab.toLowerCase()} relative flex h-12 shrink-0 items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-0 md:px-[14px]`}>
        <div className="kds-topbar-left hidden shrink-0 items-center gap-2 md:flex">
          {isWorkTab ? (
            <div className="kds-topbar-status-slot md:inline-flex">
              <StoreStatusControl
                pauseMinutes={pauseMinutes}
                saving={savingStoreStatus}
                status={storeStatus}
                onCancelPendingPaused={onCancelPendingPaused}
                onConfirmPaused={onConfirmPaused}
                onPauseMinutesChange={onPauseMinutesChange}
                onStatusChange={onStatusChange}
              />
            </div>
          ) : null}
        </div>

        {isWorkTab ? (
          <div className="kds-topbar-tabs absolute left-[42px] right-0 flex h-full items-center md:left-1/2 md:right-auto md:h-auto md:-translate-x-1/2" role="tablist">
            <button
              aria-selected={activeTab === "RECEIVED"}
              className={`kds-tab flex h-12 min-w-0 flex-1 items-center justify-center gap-1.5 border-b-2 border-b-transparent px-2.5 text-xs font-medium text-[var(--color-text-muted)] transition-[color,border-color] hover:text-[var(--color-text-subtle)] md:h-auto md:flex-none md:justify-start md:px-[14px] md:text-[13px] ${activeTab === "RECEIVED" ? "active border-b-[var(--color-accent)] text-[var(--color-text)] font-semibold" : ""}`}
              onClick={() => onTabChange("RECEIVED")}
              role="tab"
              type="button"
            >
              접수
              {receivedCount > 0 ? <span className={`kds-tab-count inline-flex min-w-5 items-center justify-center rounded-full px-[5px] text-[11px] font-bold ${activeTab === "RECEIVED" ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)]" : "bg-[var(--color-surface-2)] text-[var(--color-text-muted)]"}`}>{receivedCount}</span> : null}
            </button>
            <button
              aria-selected={activeTab === "DONE"}
              className={`kds-tab flex h-12 min-w-0 flex-1 items-center justify-center gap-1.5 border-b-2 border-b-transparent px-2.5 text-xs font-medium text-[var(--color-text-muted)] transition-[color,border-color] hover:text-[var(--color-text-subtle)] md:h-auto md:flex-none md:justify-start md:px-[14px] md:text-[13px] ${activeTab === "DONE" ? "active border-b-[var(--color-accent)] text-[var(--color-text)] font-semibold" : ""}`}
              onClick={() => onTabChange("DONE")}
              role="tab"
              type="button"
            >
              완료
              {doneCount > 0 ? <span className={`kds-tab-count inline-flex min-w-5 items-center justify-center rounded-full px-[5px] text-[11px] font-bold ${activeTab === "DONE" ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)]" : "bg-[var(--color-surface-2)] text-[var(--color-text-muted)]"}`}>{doneCount}</span> : null}
            </button>
            <button
              aria-selected={activeTab === "MY_TASKS"}
              className={`kds-tab flex h-12 min-w-0 flex-1 items-center justify-center gap-1.5 border-b-2 border-b-transparent px-2.5 text-xs font-medium text-[var(--color-text-muted)] transition-[color,border-color] hover:text-[var(--color-text-subtle)] md:h-auto md:flex-none md:justify-start md:px-[14px] md:text-[13px] ${activeTab === "MY_TASKS" ? "active border-b-[var(--color-accent)] text-[var(--color-text)] font-semibold" : ""}`}
              onClick={() => onTabChange("MY_TASKS")}
              role="tab"
              type="button"
            >
              내 업무
            </button>
          </div>
        ) : (
          <div className="kds-topbar-page-title absolute left-1/2 -translate-x-1/2 text-sm font-semibold tracking-[-0.2px] text-[var(--color-text)]">
            {activeTab === "STAFF"
              ? "직원 관리"
              : activeTab === "STATS"
              ? "통계"
              : activeTab === "SUPPORT"
              ? "고객지원"
              : "설정"}
          </div>
        )}

        <div className="kds-topbar-right hidden shrink-0 items-center gap-1.5 md:flex">
          {rightContent}
          {showArchiveAction ? (
            <button
              aria-label="완료 주문 내역 정리"
              className={`${iconButtonBase} kds-topbar-action-btn md:inline-flex`}
              disabled={archivingCompleted}
              onClick={onArchiveClick}
              title="완료 주문 정리"
              type="button"
            >
              <Trash2 size={15} aria-hidden="true" />
            </button>
          ) : null}
          {showOrderControls ? (
            <>
              <button
                aria-label={
                  orderSortDirection === "newest-first"
                    ? "현재 최신 주문 우선, 클릭하여 과거 주문 우선으로 변경"
                    : "현재 과거 주문 우선, 클릭하여 최신 주문 우선으로 변경"
                }
                className={`${iconButtonBase} kds-topbar-action-btn md:inline-flex`}
                onClick={onSortToggle}
                title={orderSortDirection === "newest-first" ? "최신 주문 우선" : "과거 주문 우선"}
                type="button"
              >
                {orderSortDirection === "newest-first" ? (
                  <ClockArrowDown size={15} aria-hidden="true" />
                ) : (
                  <ClockArrowUp size={15} aria-hidden="true" />
                )}
              </button>
              <button
                aria-label="주문 새로고침"
                className={`${iconButtonBase} kds-refresh-btn md:inline-flex${loading || refreshing ? " spinning" : ""}`}
                disabled={loading || refreshing}
                onClick={() => void onRefresh()}
                type="button"
              >
                <RefreshCw size={15} aria-hidden="true" className={loading || refreshing ? "animate-[kds-spin_0.7s_linear_infinite]" : ""} />
              </button>
            </>
          ) : null}
        </div>
      </header>

      {isWorkTab ? (
        <div className={`kds-mobile-fab fixed bottom-[22px] right-4 z-[260] block md:hidden${fabOpen ? " open" : ""}`}>
          {fabOpen ? (
            <button
              className="kds-mobile-fab-overlay fixed inset-0 z-0 bg-transparent p-0"
              aria-label="주문 작업 메뉴 닫기"
              onClick={() => setFabOpen(false)}
              type="button"
            />
          ) : null}
          {fabOpen ? (
            <div className="kds-mobile-fab-menu absolute bottom-[68px] right-0 z-20 flex min-w-[184px] max-w-[calc(100vw-32px)] flex-col gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-[var(--shadow-floating-elevated)]" aria-label="주문 작업" role="group">
              <div className="kds-mobile-fab-status">
                <StoreStatusControl
                  pauseMinutes={pauseMinutes}
                  saving={savingStoreStatus}
                  status={storeStatus}
                  onCancelPendingPaused={onCancelPendingPaused}
                  onConfirmPaused={onConfirmPaused}
                  onPauseMinutesChange={onPauseMinutesChange}
                  onStatusChange={onStatusChange}
                />
              </div>
              {showOrderControls ? (
                <button
                  className="kds-mobile-fab-action flex h-[var(--kds-mobile-action-height)] w-full items-center gap-2.5 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-semibold text-[var(--color-text-subtle)] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
                  onClick={() => {
                    onSortToggle();
                    setFabOpen(false);
                  }}
                  type="button"
                >
                  {orderSortDirection === "newest-first" ? (
                    <ClockArrowDown size={17} aria-hidden="true" />
                  ) : (
                    <ClockArrowUp size={17} aria-hidden="true" />
                  )}
                  <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">{orderSortDirection === "newest-first" ? "최신 주문 우선" : "과거 주문 우선"}</span>
                </button>
              ) : null}
              {showArchiveAction ? (
                <button
                  className="kds-mobile-fab-action danger flex h-[var(--kds-mobile-action-height)] w-full items-center gap-2.5 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-semibold text-[var(--color-danger-text)] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface-2)]"
                  disabled={archivingCompleted}
                  onClick={() => {
                    onArchiveClick();
                    setFabOpen(false);
                  }}
                  type="button"
                >
                  <Trash2 size={17} aria-hidden="true" />
                  <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">완료 주문 정리</span>
                </button>
              ) : null}
            </div>
          ) : null}
          <button
            aria-expanded={fabOpen}
            aria-label={fabOpen ? "주문 작업 메뉴 닫기" : "주문 작업 메뉴 열기"}
            className="kds-mobile-fab-button relative z-[1] flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-accent-fg)] shadow-[0_10px_28px_rgba(0,0,0,0.22)] hover:bg-[var(--color-accent-hover)]"
            onClick={() => setFabOpen((value) => !value)}
            type="button"
          >
            {fabOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          </button>
        </div>
        ) : null}
    </>
  );
}
