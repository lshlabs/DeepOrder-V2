import { KdsSidebar, KdsTopbar } from "@/components/layout";
import { StatsDatePicker } from "@/features/stats";
import { StoreStatusControl } from "@/features/store-status";

import type { KdsWorkspace } from "./model/use-kds-workspace";

type KdsWorkspaceChromeProps = { workspace: KdsWorkspace };

export function KdsWorkspaceSidebar({ workspace }: KdsWorkspaceChromeProps) {
  return (
    <KdsSidebar
      account={{
        loginId: workspace.session.user.loginId,
        storeName: workspace.session.store.storeName,
        userName: workspace.session.user.name,
      }}
      activeOrderCount={workspace.orders.counts.NEW + workspace.orders.counts.COOKING}
      activeTab={workspace.activeSection}
      isManager={workspace.isManager}
      loggingOut={workspace.loggingOut}
      open={workspace.sidebarOpen}
      onLogout={workspace.handleLogout}
      onOpenChange={workspace.setSidebarOpen}
      onTabChange={workspace.changeSection}
    />
  );
}

export function KdsWorkspaceTopbar({ workspace }: KdsWorkspaceChromeProps) {
  const { orders, store } = workspace;

  return (
    <KdsTopbar
      activeTab={workspace.activeSection}
      archivingCompleted={orders.archivingCompleted}
      doneCount={orders.doneOrders.length}
      loading={orders.loading}
      orderSortDirection={orders.orderSortDirection}
      receivedCount={orders.receivedOrders.length}
      refreshing={orders.refreshing}
      renderStoreStatusControl={() => (
        <StoreStatusControl
          pauseMinutes={store.pauseMinutes}
          saving={store.savingStoreStatus}
          status={store.storeStatus}
          onCancelPendingPaused={store.revertPendingPausedStatus}
          onConfirmPaused={store.confirmStoreStatusChange}
          onPauseMinutesChange={store.setPauseMinutes}
          onStatusChange={store.changeStoreStatus}
        />
      )}
      rightContent={workspace.activeSection === "STATS" ? <StatsDatePicker /> : null}
      onArchiveClick={workspace.openClearDoneConfirm}
      onRefresh={workspace.refreshAll}
      onSortToggle={() =>
        orders.setOrderSortDirection(
          orders.orderSortDirection === "newest-first" ? "oldest-first" : "newest-first",
        )
      }
      onTabChange={workspace.changeSection}
    />
  );
}
