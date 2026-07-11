import { LogOut } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type KdsAccountIdentity = {
  loginId: string;
  storeName: string;
  userName: string;
};

type KdsAccountMenuProps = {
  account: KdsAccountIdentity;
  loggingOut: boolean;
  expanded?: boolean;
  onLogout: () => Promise<void>;
};

export function KdsAccountMenu({
  loggingOut,
  account,
  expanded = false,
  onLogout,
}: KdsAccountMenuProps) {
  const initials = (account.storeName || account.userName || "K")
    .slice(0, 2)
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label={`${account.storeName} 계정 메뉴`}
          className={cn(
            "h-9 w-full gap-2 rounded-control px-2.5 text-foreground hover:bg-surface-2",
            expanded ? "justify-start" : "justify-center",
          )}
          size={expanded ? "compact" : "icon-sm"}
          title={account.storeName}
          type="button"
          variant="ghost"
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
            {initials}
          </span>
          {expanded ? (
            <span className="min-w-0 truncate text-sm font-medium">
              {account.storeName}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={expanded ? "start" : "end"}
        className="w-[232px]"
        density="compact"
        side={expanded ? "top" : "right"}
        sideOffset={8}
      >
        <DropdownMenuLabel className="flex items-center gap-3 py-2" density="compact">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {initials}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">
              {account.userName || account.storeName}
            </span>
            <span className="block truncate text-xs font-normal text-muted-foreground">
              {account.loginId}
            </span>
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:bg-destructive/10 focus:text-destructive"
          density="compact"
          disabled={loggingOut}
          onSelect={() => void onLogout()}
        >
          <LogOut aria-hidden="true" />
          {loggingOut ? "로그아웃 중…" : "로그아웃"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
