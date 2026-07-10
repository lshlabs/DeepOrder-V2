import type { ReactNode } from "react";

type KdsShellProps = {
  children: ReactNode;
  overlays?: ReactNode;
  sidebar: ReactNode;
  topbar: ReactNode;
};

export function KdsShell({ children, overlays, sidebar, topbar }: KdsShellProps) {
  return (
    <div className="kds-shell flex h-dvh min-h-dvh overflow-hidden bg-[var(--color-bg)] md:h-screen md:min-h-screen">
      {sidebar}

      <div className="kds-main flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:overflow-visible">
        {topbar}
        {children}
      </div>

      {overlays}
    </div>
  );
}
