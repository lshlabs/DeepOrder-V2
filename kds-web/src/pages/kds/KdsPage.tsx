import {
  KdsSectionRenderer,
  KdsWorkspaceOverlays,
  KdsWorkspaceSidebar,
  KdsWorkspaceTopbar,
  useKdsWorkspace,
} from "@/app/kds";
import { KdsShell } from "@/components/layout";
import type { AuthSession } from "@/features/auth";

type KdsPageProps = {
  session: AuthSession;
  onLogout: () => Promise<void>;
  onUnauthorized: () => Promise<string | null>;
};

export function KdsPage({ session, onLogout, onUnauthorized }: KdsPageProps) {
  const workspace = useKdsWorkspace({ session, onLogout, onUnauthorized });

  return (
    <KdsShell
      overlays={<KdsWorkspaceOverlays workspace={workspace} />}
      sidebar={<KdsWorkspaceSidebar workspace={workspace} />}
      topbar={<KdsWorkspaceTopbar workspace={workspace} />}
    >
      {workspace.orders.counts.CANCELLED > 0 ? (
        <div className="border-b border-warning/30 bg-warning/10 px-4 py-[7px] text-xs font-medium text-warning">
          취소 주문 {workspace.orders.counts.CANCELLED}건은 보드에서 제외되어 집계로만 관리됩니다.
        </div>
      ) : null}
      <KdsSectionRenderer workspace={workspace} />
    </KdsShell>
  );
}
