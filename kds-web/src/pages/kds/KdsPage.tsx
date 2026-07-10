import { useState } from "react";

import type { KdsSectionId } from "@/app/navigation/types";
import { KdsShell, KdsSidebar, KdsTopbar } from "@/components/layout";
import { ClearCompletedDialog } from "@/features/kds/orders/components/ClearCompletedDialog";
import { OrderBoard } from "@/features/kds/orders/components/OrderBoard";
import { OrderContextMenu } from "@/features/kds/orders/components/OrderContextMenu";
import { OrderDetailModal } from "@/features/kds/orders/components/OrderDetailModal";
import { RemoveOrderDialog } from "@/features/kds/orders/components/RemoveOrderDialog";
import { useKdsOrders } from "@/features/kds/orders/hooks/useKdsOrders";
import { useOrderOverlays } from "@/features/kds/orders/hooks/useOrderOverlays";
import { ChangePasswordDialog, SettingsPage, useKdsSettings } from "@/features/settings";
import { StaffPage } from "@/features/staff";
import { StatsDatePicker } from "@/features/kds/stats/components/StatsDatePicker";
import { StatsPanel } from "@/features/kds/stats/components/StatsPanel";
import { useKdsStats } from "@/features/kds/stats/hooks/useKdsStats";
import { StoreStatusControl, useStoreContext } from "@/features/store-status";
import { ChatbotFab } from "@/features/kds/support/components/ChatbotFab";
import { SupportPanel } from "@/features/kds/support/components/SupportPanel";
import { TasksPage, useAssignedMenus } from "@/features/tasks";
import { useClock } from "@/lib/date/use-clock";
import { showToast } from "@/lib/notifications";
import type { AuthSession } from "@/features/auth";

type KdsPageProps = {
  session: AuthSession;
  onLogout: () => Promise<void>;
  onUnauthorized: () => Promise<string | null>;
};

export function KdsPage({ session, onLogout, onUnauthorized }: KdsPageProps) {
  const [loggingOut, setLoggingOut] = useState(false);
  const [activeTab, setActiveTab] = useState<KdsSectionId>("RECEIVED");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [clearDoneConfirm, setClearDoneConfirm] = useState(false);
  const [pwModal, setPwModal] = useState(false);
  const now = useClock().getTime();
  const {
    archiveCompletedOrders,
    archivingCompleted,
    boardOrders,
    counts,
    cycleOrderItem,
    cycleOrderItemOption,
    doneOrders,
    hideOrder,
    hidingOrderId,
    loading,
    newOrderSignal,
    orderSortDirection,
    orders,
    receivedOrders,
    refreshOrders,
    refreshing,
    runManualRefresh,
    setOrderSortDirection,
    updateOrderStatus,
    updatingOrderId,
    updatingOrderItemId,
  } = useKdsOrders({
    accessToken: session.accessToken,
    onUnauthorized,
    showToast,
  });
  const {
    assignedMenus,
    createAssignedMenu,
    deleteAssignedMenu,
    loading: assignedMenusLoading,
    refreshAssignedMenus,
    saving: assignedMenusSaving,
    updateAssignedMenu,
  } = useAssignedMenus({
    accessToken: session.accessToken,
    onUnauthorized,
    showToast,
  });
  const {
    loading: storeSettingsLoading,
    refreshSettings,
    saving: savingSettings,
    settings,
    updateSettings,
  } = useKdsSettings({
    accessToken: session.accessToken,
    onUnauthorized,
    showToast,
  });
  const {
    loading: statsLoading,
    refreshStats,
    stats,
  } = useKdsStats({
    accessToken: session.accessToken,
    onUnauthorized,
    showToast,
  });
  const {
    changeStoreStatus,
    confirmStoreStatusChange,
    pauseMinutes,
    refreshStoreContext,
    revertPendingPausedStatus,
    savingStoreStatus,
    setPauseMinutes,
    storeStatus,
  } = useStoreContext({
    accessToken: session.accessToken,
    onUnauthorized,
    showToast,
  });
  const {
    activeOrders,
    cancelRemoveOrder,
    closeContextMenu,
    closeOrderDetail,
    confirmRemoveOrder,
    contextMenu,
    contextOrder,
    openContextMenu,
    openOrderDetail,
    openRemoveOrder,
    pinnedOrderIds,
    removeOrderId,
    selectedOrder,
    togglePinnedOrder,
  } = useOrderOverlays({
    activeTab,
    doneOrders,
    hideOrder,
    orders,
    receivedOrders,
  });

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await onLogout();
    } finally {
      setLoggingOut(false);
    }
  }

  function openChangePasswordModal() {
    setPwModal(true);
  }

  function handleRefreshAll() {
    return runManualRefresh(() =>
      Promise.all([
        refreshOrders(),
        refreshStoreContext(),
        refreshSettings(),
        refreshAssignedMenus(),
        refreshStats(),
      ]).then(() => undefined),
    );
  }

  function handleTopbarTabChange(tab: KdsSectionId) {
    setActiveTab(tab);
    if (
      tab === "MY_TASKS" ||
      tab === "STAFF" ||
      tab === "STATS" ||
      tab === "SETTINGS" ||
      tab === "RECEIVED" ||
      tab === "SUPPORT"
    ) {
      setSidebarOpen(false);
    }
  }

  function handleConfirmClearCompleted() {
    void archiveCompletedOrders().then((success) => {
      if (success) {
        setClearDoneConfirm(false);
      }
    });
  }

  function renderStoreStatusControl() {
    return (
      <StoreStatusControl
        pauseMinutes={pauseMinutes}
        saving={savingStoreStatus}
        status={storeStatus}
        onCancelPendingPaused={revertPendingPausedStatus}
        onConfirmPaused={confirmStoreStatusChange}
        onPauseMinutesChange={(updater) => setPauseMinutes(updater)}
        onStatusChange={changeStoreStatus}
      />
    );
  }

  const isManager = session.user.accountType !== "EMPLOYEE";
  const settingsDisabled = storeSettingsLoading || savingSettings;

  const sidebar = (
    <KdsSidebar
      account={{
        loginId: session.user.loginId,
        storeName: session.store.storeName,
        userName: session.user.name,
      }}
      activeOrderCount={counts.NEW + counts.COOKING}
      activeTab={activeTab}
      isManager={isManager}
      loggingOut={loggingOut}
      open={sidebarOpen}
      onLogout={handleLogout}
      onOpenChange={setSidebarOpen}
      onTabChange={setActiveTab}
    />
  );

  const topbar = (
    <KdsTopbar
      activeTab={activeTab}
      archivingCompleted={archivingCompleted}
      doneCount={doneOrders.length}
      loading={loading}
      orderSortDirection={orderSortDirection}
      receivedCount={receivedOrders.length}
      refreshing={refreshing}
      renderStoreStatusControl={renderStoreStatusControl}
      rightContent={activeTab === "STATS" ? <StatsDatePicker /> : null}
      onArchiveClick={() => setClearDoneConfirm(true)}
      onRefresh={handleRefreshAll}
      onSortToggle={() =>
        setOrderSortDirection(
          orderSortDirection === "newest-first" ? "oldest-first" : "newest-first",
        )
      }
      onTabChange={handleTopbarTabChange}
    />
  );

  const overlays = (
    <>
      <OrderContextMenu
        canPin={contextOrder?.status === "NEW" || contextOrder?.status === "COOKING"}
        contextMenu={contextMenu}
        isPinned={contextMenu ? pinnedOrderIds.includes(contextMenu.orderId) : false}
        onClose={closeContextMenu}
        onOpenDetail={openOrderDetail}
        onOpenRemove={openRemoveOrder}
        onTogglePinned={togglePinnedOrder}
      />

      <OrderDetailModal order={selectedOrder} onClose={closeOrderDetail} />

      <RemoveOrderDialog
        open={removeOrderId !== null}
        submitting={removeOrderId !== null && hidingOrderId === removeOrderId}
        onCancel={cancelRemoveOrder}
        onConfirm={confirmRemoveOrder}
      />

      <ClearCompletedDialog
        open={clearDoneConfirm}
        submitting={archivingCompleted}
        onCancel={() => setClearDoneConfirm(false)}
        onConfirm={handleConfirmClearCompleted}
      />

      <ChangePasswordDialog
        accessToken={session.accessToken}
        open={pwModal}
        showToast={showToast}
        onClose={() => setPwModal(false)}
        onLogout={onLogout}
        onUnauthorized={onUnauthorized}
      />

    </>
  );

  return (
    <KdsShell overlays={overlays} sidebar={sidebar} topbar={topbar}>
      {counts.CANCELLED > 0 ? (
        <div className="border-b border-warning/30 bg-warning/10 px-4 py-2 text-xs font-medium text-warning">
          취소 주문 {counts.CANCELLED}건은 보드에서 제외되어 집계로만 관리됩니다.
        </div>
      ) : null}

      {activeTab === "MY_TASKS" ? (
          <TasksPage
            assignedMenus={assignedMenus}
            loading={assignedMenusLoading}
            now={now}
            orders={boardOrders}
            saving={assignedMenusSaving}
            onCreateAssignedMenu={createAssignedMenu}
            onDeleteAssignedMenu={deleteAssignedMenu}
            onUpdateAssignedMenu={updateAssignedMenu}
          />
      ) : activeTab === "STAFF" && isManager ? (
          <StaffPage onUnauthorized={onUnauthorized} session={session} />
      ) : activeTab === "STATS" ? (
        <StatsPanel loading={statsLoading} orders={orders} stats={stats} />
      ) : activeTab === "SETTINGS" ? (
          <SettingsPage
            disabled={settingsDisabled}
            settings={settings}
            onChangePasswordClick={openChangePasswordModal}
            onUpdate={updateSettings}
          />
      ) : activeTab === "SUPPORT" ? (
        <div className="kds-panel-shell">
          <SupportPanel />
          <ChatbotFab />
        </div>
      ) : (
        <OrderBoard
          emptyMessage={
            activeTab === "RECEIVED"
              ? "접수된 주문이 없습니다"
              : "완료된 주문이 없습니다"
          }
          loading={loading}
          newOrderSignal={newOrderSignal}
          now={now}
          orders={activeOrders}
          pinnedOrderIds={pinnedOrderIds}
          refreshing={refreshing}
          updatingItemId={updatingOrderItemId}
          updatingOrderId={updatingOrderId}
          onCycleItem={cycleOrderItem}
          onCycleItemOption={cycleOrderItemOption}
          onOpenContextMenu={openContextMenu}
          onRefresh={handleRefreshAll}
          onUpdateStatus={updateOrderStatus}
        />
      )}
    </KdsShell>
  );
}
