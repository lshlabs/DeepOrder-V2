import { BarChart2, ClipboardList, HelpCircle, Menu, Settings, Users, X } from "lucide-react";

import { Button } from "../../../../components/ui/button";
import type { AuthSession } from "../../../../types";
import type { BoardTab } from "../../types";
import { KdsAccountMenu } from "./KdsAccountMenu";

type KdsSidebarProps = {
  activeOrderCount: number;
  activeTab: BoardTab;
  isManager: boolean;
  loggingOut: boolean;
  open: boolean;
  session: AuthSession;
  onLogout: () => Promise<void>;
  onOpenChange: (open: boolean) => void;
  onTabChange: (tab: BoardTab) => void;
};

export function KdsSidebar({
  activeOrderCount,
  activeTab,
  isManager,
  loggingOut,
  open,
  session,
  onLogout,
  onOpenChange,
  onTabChange,
}: KdsSidebarProps) {
  const sidebarItemBase =
    "kds-sidebar-item h-9 w-full justify-center gap-[9px] rounded-[var(--radius-md)] bg-transparent px-[9px] text-[13px] font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)] md:w-full";
  const sidebarItemOpen = open ? "justify-start" : "";
  const sidebarItemActive = "active bg-[var(--color-accent-subtle)] text-[var(--color-accent)] hover:bg-[var(--color-accent-subtle)]";

  return (
    <>
      <div
        aria-hidden="true"
        className={`kds-sidebar-backdrop fixed inset-0 z-20 bg-[rgba(17,19,24,0.18)] transition-opacity duration-200 ${open ? "open opacity-100 pointer-events-auto" : "pointer-events-none opacity-0"}`}
        onClick={() => onOpenChange(false)}
      />
      <nav className={`kds-sidebar relative z-30 shrink-0 overflow-visible w-[42px] md:w-12${open ? " open" : ""}`} aria-label="메인 내비게이션">
        <div className={`kds-sidebar-surface fixed inset-y-0 left-0 z-30 flex h-full flex-col overflow-hidden border-r border-[var(--color-border)] bg-[var(--color-surface)] transition-[width,box-shadow] duration-200 md:absolute ${open ? "w-48 shadow-[8px_0_24px_rgba(17,19,24,0.12)]" : "w-[42px] shadow-none md:w-full"}`}>
          <Button
            aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
            className={`kds-sidebar-toggle h-12 w-full gap-2.5 rounded-none border-0 border-b border-[var(--color-border)] bg-transparent px-3.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)] ${open ? "justify-start" : "justify-center"}`}
            onClick={() => onOpenChange(!open)}
            variant="ghost"
            type="button"
          >
            {open ? <X size={16} aria-hidden="true" /> : <Menu size={16} aria-hidden="true" />}
            {open ? <span className="kds-sidebar-toggle-label text-xs font-semibold text-[var(--color-text-subtle)]">닫기</span> : null}
          </Button>
 
          <div className="kds-sidebar-nav flex flex-1 flex-col gap-px px-[5px] py-1.5">
            <Button
              className={`${sidebarItemBase} ${sidebarItemOpen} ${(activeTab === "RECEIVED" || activeTab === "DONE" || activeTab === "MY_TASKS") ? sidebarItemActive : ""}`}
              onClick={() => {
                onTabChange("RECEIVED");
                onOpenChange(false);
              }}
              size="sm"
              type="button"
              title="업무"
              variant="ghost"
            >
              <ClipboardList size={16} aria-hidden="true" />
              {open ? (
                <span className="flex items-center gap-[7px] overflow-hidden whitespace-nowrap">
                  업무
                  {activeOrderCount > 0 ? <em className="kds-sidebar-badge inline-flex min-w-4 items-center justify-center rounded-full bg-[var(--color-accent)] px-1 text-[10px] font-bold not-italic text-white">{activeOrderCount}</em> : null}
                </span>
              ) : null}
              {!open && activeOrderCount > 0 ? <em className="kds-sidebar-dot absolute right-[7px] top-[7px] block h-[7px] w-[7px] rounded-full border-2 border-[var(--color-surface)] bg-[var(--color-accent)] not-italic" aria-hidden="true" /> : null}
            </Button>

            {isManager ? (
              <Button
                className={`${sidebarItemBase} ${sidebarItemOpen} ${activeTab === "STAFF" ? sidebarItemActive : ""}`}
                onClick={() => {
                  onTabChange("STAFF");
                  onOpenChange(false);
                }}
                size="sm"
                type="button"
                title="직원"
                variant="ghost"
              >
                <Users size={16} aria-hidden="true" />
                {open ? <span>직원</span> : null}
              </Button>
            ) : null}

            {isManager ? (
              <Button
                className={`${sidebarItemBase} ${sidebarItemOpen} ${activeTab === "STATS" ? sidebarItemActive : ""}`}
                onClick={() => {
                  onTabChange("STATS");
                  onOpenChange(false);
                }}
                size="sm"
                type="button"
                title="통계"
                variant="ghost"
              >
                <BarChart2 size={16} aria-hidden="true" />
                {open ? <span>통계</span> : null}
              </Button>
            ) : null}

            {isManager ? (
              <Button
                className={`${sidebarItemBase} ${sidebarItemOpen} ${activeTab === "SETTINGS" ? sidebarItemActive : ""}`}
                onClick={() => {
                  onTabChange("SETTINGS");
                  onOpenChange(false);
                }}
                size="sm"
                type="button"
                title="설정"
                variant="ghost"
              >
                <Settings size={16} aria-hidden="true" />
                {open ? <span>설정</span> : null}
              </Button>
            ) : null}

            <Button
              className={`${sidebarItemBase} ${sidebarItemOpen} ${activeTab === "SUPPORT" ? sidebarItemActive : ""}`}
              onClick={() => {
                onTabChange("SUPPORT");
                onOpenChange(false);
              }}
              size="sm"
              type="button"
              title="고객지원"
              variant="ghost"
            >
              <HelpCircle size={16} aria-hidden="true" />
              {open ? <span>고객지원</span> : null}
            </Button>
          </div>

          <KdsAccountMenu
            loggingOut={loggingOut}
            session={session}
            sidebarOpen={open}
            onLogout={onLogout}
          />
        </div>
      </nav>
    </>
  );
}
