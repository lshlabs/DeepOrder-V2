import { Menu, X } from "lucide-react";

import { KDS_SIDEBAR_SECTIONS, getKdsSection } from "@/app/navigation/kds-sections";
import type { KdsSectionId } from "@/app/navigation/types";
import { Button } from "@/components/ui/button";
import type { AuthSession } from "@/types";

import { KdsAccountMenu } from "./KdsAccountMenu";

type KdsSidebarProps = {
  activeOrderCount: number;
  activeTab: KdsSectionId;
  isManager: boolean;
  loggingOut: boolean;
  open: boolean;
  session: AuthSession;
  onLogout: () => Promise<void>;
  onOpenChange: (open: boolean) => void;
  onTabChange: (tab: KdsSectionId) => void;
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
  const sidebarItemActive =
    "active bg-[var(--color-accent-subtle)] text-[var(--color-accent)] hover:bg-[var(--color-accent-subtle)]";
  const activeSidebarRootId = getKdsSection(activeTab).sidebarRootId;
  const visibleSections = KDS_SIDEBAR_SECTIONS.filter(
    (section) => !section.managerOnly || isManager,
  );

  return (
    <>
      <div
        aria-hidden="true"
        className={`kds-sidebar-backdrop fixed inset-0 z-20 bg-[rgba(17,19,24,0.18)] transition-opacity duration-200 ${open ? "open pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={() => onOpenChange(false)}
      />
      <nav
        aria-label="메인 내비게이션"
        className={`kds-sidebar relative z-30 w-[42px] shrink-0 overflow-visible md:w-12${open ? " open" : ""}`}
      >
        <div
          className={`kds-sidebar-surface fixed inset-y-0 left-0 z-30 flex h-full flex-col overflow-hidden border-r border-[var(--color-border)] bg-[var(--color-surface)] transition-[width,box-shadow] duration-200 md:absolute ${open ? "w-48 shadow-[8px_0_24px_rgba(17,19,24,0.12)]" : "w-[42px] shadow-none md:w-full"}`}
        >
          <Button
            aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
            className={`kds-sidebar-toggle h-12 w-full gap-2.5 rounded-none border-0 border-b border-[var(--color-border)] bg-transparent px-3.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)] ${open ? "justify-start" : "justify-center"}`}
            onClick={() => onOpenChange(!open)}
            type="button"
            variant="ghost"
          >
            {open ? <X aria-hidden="true" size={16} /> : <Menu aria-hidden="true" size={16} />}
            {open ? (
              <span className="kds-sidebar-toggle-label text-xs font-semibold text-[var(--color-text-subtle)]">
                닫기
              </span>
            ) : null}
          </Button>

          <div className="kds-sidebar-nav flex flex-1 flex-col gap-px px-[5px] py-1.5">
            {visibleSections.map((section) => {
              const Icon = section.icon;
              const active = activeSidebarRootId === section.id;
              const isWorkEntry = section.id === "RECEIVED";
              const label = section.sidebarLabel;

              return (
                <Button
                  className={`${sidebarItemBase} ${sidebarItemOpen} ${active ? sidebarItemActive : ""}`}
                  key={section.id}
                  onClick={() => {
                    onTabChange(section.id);
                    onOpenChange(false);
                  }}
                  size="sm"
                  title={label}
                  type="button"
                  variant="ghost"
                >
                  <Icon aria-hidden="true" size={16} />
                  {open ? (
                    <span className="flex items-center gap-[7px] overflow-hidden whitespace-nowrap">
                      {label}
                      {isWorkEntry && activeOrderCount > 0 ? (
                        <em className="kds-sidebar-badge inline-flex min-w-4 items-center justify-center rounded-full bg-[var(--color-accent)] px-1 text-[10px] font-bold not-italic text-white">
                          {activeOrderCount}
                        </em>
                      ) : null}
                    </span>
                  ) : null}
                  {!open && isWorkEntry && activeOrderCount > 0 ? (
                    <em
                      aria-hidden="true"
                      className="kds-sidebar-dot absolute right-[7px] top-[7px] block h-[7px] w-[7px] rounded-full border-2 border-[var(--color-surface)] bg-[var(--color-accent)] not-italic"
                    />
                  ) : null}
                </Button>
              );
            })}
          </div>

          <KdsAccountMenu
            loggingOut={loggingOut}
            onLogout={onLogout}
            session={session}
            sidebarOpen={open}
          />
        </div>
      </nav>
    </>
  );
}
