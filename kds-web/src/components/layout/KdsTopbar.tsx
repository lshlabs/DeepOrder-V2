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
      <header className="relative flex h-12 shrink-0 items-center justify-between gap-3 border-b bg-card px-2 md:px-4">
        <div className="hidden shrink-0 items-center gap-2 md:flex">
          {isWorkTab && renderStoreStatusControl ? renderStoreStatusControl() : null}
        </div>

        {isWorkTab ? (
          <div
            className="absolute left-11 right-0 flex h-full items-stretch md:left-1/2 md:right-auto md:h-auto md:-translate-x-1/2 md:items-center"
            role="tablist"
          >
            {KDS_TOPBAR_SECTIONS.map((section) => {
              const count = getSectionCount(section.id);
              const active = activeTab === section.id;
              return (
                <Button
                  aria-selected={active}
                  className={cn(
                    "h-12 min-w-0 flex-1 rounded-none border-b-2 border-transparent px-3 text-xs md:h-9 md:flex-none md:text-sm",
                    active
                      ? "border-primary bg-transparent font-semibold text-foreground hover:bg-muted/50"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                  )}
                  key={section.id}
                  onClick={() => onTabChange(section.id)}
                  role="tab"
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
          <h1 className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold">
            {activeSection.label}
          </h1>
        )}

        <div className="hidden shrink-0 items-center gap-1.5 md:flex">
          {rightContent}
          {showArchiveAction ? (
            <Button
              aria-label="완료 주문 내역 정리"
              disabled={archivingCompleted}
              onClick={onArchiveClick}
              size="icon"
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
                onClick={onSortToggle}
                size="icon"
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
                disabled={busy}
                onClick={() => void onRefresh()}
                size="icon"
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
        <div className="fixed bottom-5 right-4 z-40 md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button aria-label="주문 작업 메뉴" className="size-14 rounded-full shadow-lg" size="icon">
                <Menu aria-hidden="true" className="size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60" side="top" sideOffset={10}>
              {renderStoreStatusControl ? (
                <div className="p-2">{renderStoreStatusControl()}</div>
              ) : null}
              {renderStoreStatusControl && (showOrderControls || showArchiveAction) ? (
                <DropdownMenuSeparator />
              ) : null}
              {showOrderControls ? (
                <DropdownMenuItem onSelect={onSortToggle}>
                  {orderSortDirection === "newest-first" ? (
                    <ClockArrowDown aria-hidden="true" />
                  ) : (
                    <ClockArrowUp aria-hidden="true" />
                  )}
                  {orderSortDirection === "newest-first" ? "최신 주문 우선" : "과거 주문 우선"}
                </DropdownMenuItem>
              ) : null}
              {showOrderControls ? (
                <DropdownMenuItem disabled={busy} onSelect={() => void onRefresh()}>
                  <RefreshCw aria-hidden="true" className={cn(busy && "animate-spin")} />
                  주문 새로고침
                </DropdownMenuItem>
              ) : null}
              {showArchiveAction ? (
                <DropdownMenuItem
                  className="text-destructive focus:bg-destructive/10 focus:text-destructive"
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
