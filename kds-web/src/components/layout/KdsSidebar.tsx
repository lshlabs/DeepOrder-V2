import { useEffect, useState } from "react";
import { Menu } from "lucide-react";

import { KDS_SIDEBAR_SECTIONS, getKdsSection } from "@/app/navigation/kds-sections";
import type { KdsSectionId } from "@/app/navigation/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

import { KdsAccountMenu, type KdsAccountIdentity } from "./KdsAccountMenu";

type KdsSidebarProps = {
  account: KdsAccountIdentity;
  activeOrderCount: number;
  activeTab: KdsSectionId;
  isManager: boolean;
  loggingOut: boolean;
  open: boolean;
  onLogout: () => Promise<void>;
  onOpenChange: (open: boolean) => void;
  onTabChange: (tab: KdsSectionId) => void;
};

export function KdsSidebar(props: KdsSidebarProps) {
  const { open, onOpenChange } = props;
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const sync = () => setIsDesktop(mediaQuery.matches);
    sync();
    mediaQuery.addEventListener("change", sync);
    return () => mediaQuery.removeEventListener("change", sync);
  }, []);

  return (
    <>
      <aside
        className={cn(
          "hidden shrink-0 border-r border-border bg-card transition-[width] duration-200 md:flex md:flex-col",
          open ? "md:w-48" : "md:w-12",
        )}
      >
        <div className="flex h-12 items-center border-b border-border px-1.5">
          <Button
            aria-label={open ? "사이드바 접기" : "사이드바 펼치기"}
            className={cn(
              "h-9 w-full justify-center gap-2 rounded-control px-2 text-muted-foreground hover:bg-surface-2 hover:text-foreground",
              open && "justify-start px-3",
            )}
            onClick={() => onOpenChange(!open)}
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <Menu aria-hidden="true" className="size-[18px]" />
            {open ? <span className="truncate text-xs font-semibold text-foreground">KDS</span> : null}
          </Button>
        </div>
        <SidebarNavigation {...props} compact={!open} />
        <div className="mt-auto border-t border-border p-1.5">
          <KdsAccountMenu
            account={props.account}
            expanded={open}
            loggingOut={props.loggingOut}
            onLogout={props.onLogout}
          />
        </div>
      </aside>

      <aside className="flex w-[42px] shrink-0 flex-col border-r border-border bg-card md:hidden">
        <div className="flex h-12 items-center justify-center border-b border-border">
          <Button
            aria-label="메뉴 열기"
            className="text-muted-foreground hover:bg-surface-2 hover:text-foreground"
            onClick={() => onOpenChange(true)}
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <Menu aria-hidden="true" className="size-[18px]" />
          </Button>
        </div>
      </aside>

      <Sheet open={!isDesktop && open} onOpenChange={onOpenChange}>
        <SheetContent className="flex w-[min(18rem,calc(100vw-2rem))] flex-col overflow-hidden p-0" density="compact" side="left">
          <SheetHeader className="border-b border-border px-4 py-3 text-left">
            <SheetTitle>DeepOrder KDS</SheetTitle>
            <SheetDescription>{props.account.storeName}</SheetDescription>
          </SheetHeader>
          <SidebarNavigation {...props} />
          <div className="mt-auto border-t border-border p-3">
            <KdsAccountMenu
              account={props.account}
              expanded
              loggingOut={props.loggingOut}
              onLogout={props.onLogout}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

type SidebarNavigationProps = KdsSidebarProps & { compact?: boolean };

function SidebarNavigation({
  activeOrderCount,
  activeTab,
  compact = false,
  isManager,
  onOpenChange,
  onTabChange,
}: SidebarNavigationProps) {
  const activeRoot = getKdsSection(activeTab).sidebarRootId;
  const visibleSections = KDS_SIDEBAR_SECTIONS.filter(
    (section) => !section.managerOnly || isManager,
  );

  return (
    <nav
      aria-label="메인 내비게이션"
      className={cn("flex flex-1 flex-col overflow-y-auto", compact ? "gap-0.5 p-1.5" : "gap-1 p-2")}
    >
      {visibleSections.map((section) => {
        const Icon = section.icon;
        const active = activeRoot === section.id;
        const showCount = section.id === "RECEIVED" && activeOrderCount > 0;

        return (
          <Button
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative w-full text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground",
              compact
                ? "h-9 justify-center rounded-control px-0"
                : "h-10 justify-start rounded-control px-3 text-[13px] font-medium",
              active && "bg-primary-soft text-primary hover:bg-primary-soft hover:text-primary",
            )}
            key={section.id}
            onClick={() => {
              onTabChange(section.id);
              onOpenChange(false);
            }}
            size={compact ? "icon-sm" : "compact"}
            title={compact ? section.sidebarLabel : undefined}
            type="button"
            variant="ghost"
          >
            <Icon aria-hidden="true" className="size-[18px] shrink-0" />
            {!compact ? <span className="truncate">{section.sidebarLabel}</span> : null}
            {showCount ? (
              compact ? (
                <span className="absolute right-1 top-1 size-2 rounded-full bg-primary ring-2 ring-card" />
              ) : (
                <Badge className="ml-auto min-w-5 justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground hover:bg-primary" variant="default">
                  {activeOrderCount}
                </Badge>
              )
            ) : null}
          </Button>
        );
      })}
    </nav>
  );
}
