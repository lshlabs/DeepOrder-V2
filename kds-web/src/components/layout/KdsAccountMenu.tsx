import { useRef, useState } from "react";
import { LogOut } from "lucide-react";

import { PopoverPanel } from "@/shared/components/floating/PopoverPanel";
import type { AuthSession } from "@/features/auth";

type KdsAccountMenuProps = {
  loggingOut: boolean;
  session: AuthSession;
  sidebarOpen: boolean;
  onLogout: () => Promise<void>;
};

export function KdsAccountMenu({
  loggingOut,
  session,
  sidebarOpen,
  onLogout,
}: KdsAccountMenuProps) {
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const initials = (session.user.name ?? session.store.storeName ?? "?").slice(0, 2).toUpperCase();

  async function handleLogout() {
    setOpen(false);
    await onLogout();
  }

  return (
    <div className="kds-sidebar-account relative border-t border-[var(--color-border)] px-[5px] py-1.5">
      <PopoverPanel
        ariaLabel="계정 정보"
        className="kds-account-popover w-[min(232px,calc(100vw-24px))] min-w-[min(220px,calc(100vw-24px))] max-w-[min(240px,calc(100vw-24px))] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-[var(--kds-floating-padding-panel)] shadow-[var(--shadow-floating)]"
        onClose={() => setOpen(false)}
        open={open}
        positioning={open ? { align: "end", anchorEl, side: "top" } : null}
        role="dialog"
      >
        <div className="kds-account-popover-surface flex flex-col gap-3">
          <div className="kds-account-popover-info flex items-center gap-[9px]">
            <div className="kds-account-avatar large flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-[13px] font-bold text-white">{initials}</div>
            <div>
              <p className="kds-account-name text-sm font-semibold text-[var(--color-text)]">{session.user.name ?? session.store.storeName}</p>
              <p className="kds-account-login-id mt-px overflow-hidden text-ellipsis whitespace-nowrap text-[13px] text-[var(--color-text-muted)]">{session.user.loginId}</p>
            </div>
          </div>
          <div className="kds-account-popover-divider h-px bg-[var(--color-border)]" />
          <button
            className="kds-account-popover-item signout flex h-[var(--kds-menu-item-height)] w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-3 text-left text-sm font-medium text-[var(--color-error-text)] hover:bg-[var(--color-error-bg)]"
            disabled={loggingOut}
            onClick={() => void handleLogout()}
            type="button"
          >
            <LogOut size={18} aria-hidden="true" />
            {loggingOut ? "로그아웃 중…" : "로그아웃"}
          </button>
        </div>
      </PopoverPanel>

      <button
        className={`kds-account-trigger flex h-9 w-full items-center gap-[9px] rounded-[var(--radius-md)] px-[9px] ${sidebarOpen ? "justify-start" : "justify-center"} ${open ? "active bg-[var(--color-surface-2)]" : "bg-transparent hover:bg-[var(--color-surface-2)]"}`}
        onClick={() => setOpen((value) => !value)}
        onPointerDown={(event) => setAnchorEl(event.currentTarget)}
        ref={triggerRef}
        type="button"
        title={session.store.storeName}
        aria-expanded={open}
      >
        <div className="kds-account-avatar flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-[11px] font-bold text-white">{initials}</div>
        {sidebarOpen ? <span className="kds-account-trigger-name overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-medium text-[var(--color-text)]">{session.store.storeName}</span> : null}
      </button>
    </div>
  );
}
