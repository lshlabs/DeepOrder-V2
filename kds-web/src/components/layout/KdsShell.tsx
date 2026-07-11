import type { ReactNode } from "react";

type KdsShellProps = {
  children: ReactNode;
  overlays?: ReactNode;
  sidebar: ReactNode;
  topbar: ReactNode;
};

export function KdsShell({ children, overlays, sidebar, topbar }: KdsShellProps) {
  return (
    <div className="relative flex h-dvh min-h-dvh overflow-hidden bg-background text-foreground">
      {sidebar}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background">
        {topbar}
        {children}
      </div>
      {overlays}
    </div>
  );
}
