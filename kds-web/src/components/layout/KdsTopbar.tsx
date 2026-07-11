import type { ReactNode } from "react";
import { ClockArrowDown, ClockArrowUp, Menu, RefreshCw, Trash2 } from "lucide-react";

import {
  KDS_TOPBAR_SECTIONS,
  getKdsSection,
  isKdsWorkSection,
} from "@/app/navigation/kds-sections";
import type { KdsSectionId } from "@/app/navigation/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type OrderSortDirection = "newest-first" | "oldest-first";

type KdsTopbarProps = {
  activeTab: KdsSectionId;
  archivingCompleted: boolean;
  doneCount: number;
  loading: boolean;
  orderSortDirection: OrderSortDirection;
  receivedCount: number;
  refreshing: boolean;
  renderStoreStatusControl?: () => ReactNode;
  rightContent?: ReactNode;
  onArchiveClick: () => void;
  onRefresh: () => Promise<void>;
  onSortToggle: () => void;
  onTabChange: (tab: KdsSectionId) => void;
};

export function KdsTopbar({
  activeTab,
  archivingCompleted,
  doneCount,
  loading,
  orderSortDirection,
  receivedCount,
  refreshing,
  renderStoreStatusControl,
  rightContent,
  onArchiveClick,
  onRefresh,
  onSortToggle,
  onTabChange,
}: KdsTopbarProps) {
  const activeSection = getKdsSection(activeTab);
  const isWorkTab = isKdsWorkSection(activeTab);
  const showOrderControls = activeTab === "RECEIVED" || activeTab === "DONE";
  const showArchiveAction = activeTab === "DONE" && doneCount > 0;
  const busy = loading || refreshing;

  function getSectionCount(sectionId: KdsSectionId) {
    if (sectionId === "RECEIVED") return receivedCount;
    if (sectionId === "DONE") return doneCount;
    return 0;
  }

  return (
    <>
      <header className="relative flex h-12 shrink-0 items-center gap-2 border-b border-border bg-card px-2 md:px-3">
        <div className="hidden min-w-[172px] shrink-0 items-center gap-2 md:flex">
          {isWorkTab && renderStoreStatusControl ? renderStoreStatusControl() : null}
        </div>

        {isWorkTab ? (
          <div
            className="absolute left-11 right-2 flex h-full items-stretch md:left-1/2 md:right-auto md:h-auto md:-translate-x-1/2 md:items-center"
            role="tablist"
          >
            {KDS_TOPBAR_SECTIONS.map((section) => {
              const count = getSectionCount(section.id);
              const active = activeTab === section.id;
              return (
                <Button
                  aria-selected={active}
                  className={cn(
                    "h-12 min-w-0 flex-1 rounded-none border-b-2 border-transparent px-3 text-xs md:h-9 md:flex-none md:rounded-control md:px-3 md:text-[13px]",
                    active
                      ? "border-primary bg-transparent font-semibold text-foreground md:border-transparent md:bg-primary-soft md:text-primary md:hover:bg-primary-soft"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground md:hover:bg-surface-2",
                  )}
                  key={section.id}
                  onClick={() => onTabChange(section.id)}
                  role="tab"
                  size="compact"
                  type="button"
                  variant="ghost"
                >
                  {section.label}
                  {count > 0 ? (
                    <Badge
                      className={cn(
                        "ml-1 min-w-5 justify-center px-1.5",
                        active ? "bg-primary/10 text-primary hover:bg-primary/10" : "bg-muted text-muted-foreground hover:bg-muted",
                      )}
                      variant="secondary"
                    >
                      {count}
                    </Badge>
                  ) : null}
                </Button>
              );
            })}
          </div>
        ) : (
          <div className="min-w-0 flex-1 pl-1">
            <h1 className="truncate text-sm font-semibold text-foreground md:text-[15px]">
              {activeSection.label}
            </h1>
          </div>
        )}

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          {!isWorkTab ? <div className="hidden md:block">{rightContent}</div> : null}
          {showArchiveAction ? (
            <Button
              aria-label="완료 주문 내역 정리"
              className="hidden md:inline-flex"
              disabled={archivingCompleted}
              onClick={onArchiveClick}
              size="icon-sm"
              title="완료 주문 정리"
              type="button"
              variant="outline"
            >
              <Trash2 aria-hidden="true" className="size-4" />
            </Button>
          ) : null}
          {showOrderControls ? (
            <>
              <Button
                aria-label={
                  orderSortDirection === "newest-first"
                    ? "현재 최신 주문 우선, 클릭하여 과거 주문 우선으로 변경"
                    : "현재 과거 주문 우선, 클릭하여 최신 주문 우선으로 변경"
                }
                className="hidden md:inline-flex"
                onClick={onSortToggle}
                size="icon-sm"
                title={orderSortDirection === "newest-first" ? "최신 주문 우선" : "과거 주문 우선"}
                type="button"
                variant="outline"
              >
                {orderSortDirection === "newest-first" ? (
                  <ClockArrowDown aria-hidden="true" className="size-4" />
                ) : (
                  <ClockArrowUp aria-hidden="true" className="size-4" />
                )}
              </Button>
              <Button
                aria-label="주문 새로고침"
                className="hidden md:inline-flex"
                disabled={busy}
                onClick={() => void onRefresh()}
                size="icon-sm"
                type="button"
                variant="outline"
              >
                <RefreshCw aria-hidden="true" className={cn("size-4", busy && "animate-spin")} />
              </Button>
            </>
          ) : null}
        </div>
      </header>

      {isWorkTab ? (
        <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] right-4 z-40 md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button aria-label="주문 작업 메뉴" className="size-14 rounded-full shadow-floating-elevated" size="icon">
                <Menu aria-hidden="true" className="size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60" density="compact" side="top" sideOffset={10}>
              {renderStoreStatusControl ? (
                <div className="p-2">{renderStoreStatusControl()}</div>
              ) : null}
              {renderStoreStatusControl && (showOrderControls || showArchiveAction) ? (
                <DropdownMenuSeparator />
              ) : null}
              {showOrderControls ? (
                <DropdownMenuItem density="compact" onSelect={onSortToggle}>
                  {orderSortDirection === "newest-first" ? (
                    <ClockArrowDown aria-hidden="true" />
                  ) : (
                    <ClockArrowUp aria-hidden="true" />
                  )}
                  {orderSortDirection === "newest-first" ? "최신 주문 우선" : "과거 주문 우선"}
                </DropdownMenuItem>
              ) : null}
              {showOrderControls ? (
                <DropdownMenuItem density="compact" disabled={busy} onSelect={() => void onRefresh()}>
                  <RefreshCw aria-hidden="true" className={cn(busy && "animate-spin")} />
                  주문 새로고침
                </DropdownMenuItem>
              ) : null}
              {showArchiveAction ? (
                <DropdownMenuItem
                  className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                  density="compact"
                  disabled={archivingCompleted}
                  onSelect={onArchiveClick}
                >
                  <Trash2 aria-hidden="true" />
                  완료 주문 정리
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : null}
    </>
  );
}
