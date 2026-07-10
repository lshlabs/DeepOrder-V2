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

  return (
    <>
      <aside className="hidden w-14 shrink-0 flex-col border-r bg-card md:flex">
        <div className="flex h-12 items-center justify-center border-b">
          <span className="text-xs font-bold text-primary">KDS</span>
        </div>
        <SidebarNavigation {...props} compact />
        <div className="mt-auto border-t p-2">
          <KdsAccountMenu
            account={props.account}
            loggingOut={props.loggingOut}
            onLogout={props.onLogout}
          />
        </div>
      </aside>

      <aside className="flex w-11 shrink-0 flex-col border-r bg-card md:hidden">
        <div className="flex h-12 items-center justify-center border-b">
          <Button
            aria-label="메뉴 열기"
            onClick={() => onOpenChange(true)}
            size="icon"
            type="button"
            variant="ghost"
          >
            <Menu aria-hidden="true" className="size-4" />
          </Button>
        </div>
      </aside>

      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="flex w-72 flex-col p-0" side="left">
          <SheetHeader className="border-b px-4 py-4 text-left">
            <SheetTitle>DeepOrder KDS</SheetTitle>
            <SheetDescription>{props.account.storeName}</SheetDescription>
          </SheetHeader>
          <SidebarNavigation {...props} />
          <div className="mt-auto border-t p-3">
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
    <nav aria-label="메인 내비게이션" className="flex flex-1 flex-col gap-1 p-2">
      {visibleSections.map((section) => {
        const Icon = section.icon;
        const active = activeRoot === section.id;
        const showCount = section.id === "RECEIVED" && activeOrderCount > 0;

        return (
          <Button
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative gap-2",
              compact ? "h-10 justify-center px-0" : "h-10 justify-start px-3",
              active && "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary",
            )}
            key={section.id}
            onClick={() => {
              onTabChange(section.id);
              onOpenChange(false);
            }}
            title={compact ? section.sidebarLabel : undefined}
            type="button"
            variant="ghost"
          >
            <Icon aria-hidden="true" className="size-4 shrink-0" />
            {!compact ? <span className="truncate">{section.sidebarLabel}</span> : null}
            {showCount ? (
              compact ? (
                <span className="absolute right-1 top-1 size-2 rounded-full bg-primary ring-2 ring-card" />
              ) : (
                <Badge className="ml-auto min-w-5 justify-center px-1.5" variant="default">
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
