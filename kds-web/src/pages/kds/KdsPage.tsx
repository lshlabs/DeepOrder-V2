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
import { ChangePasswordModal } from "@/features/kds/settings/components/ChangePasswordModal";
import { SettingsPanel } from "@/features/kds/settings/components/SettingsPanel";
import { useKdsSettings } from "@/features/kds/settings/hooks/useKdsSettings";
import { StaffPanel } from "@/features/kds/staff/components/StaffPanel";
import { StatsDatePicker } from "@/features/kds/stats/components/StatsDatePicker";
import { StatsPanel } from "@/features/kds/stats/components/StatsPanel";
import { useKdsStats } from "@/features/kds/stats/hooks/useKdsStats";
import { StoreStatusControl } from "@/features/kds/store-status/components/StoreStatusControl";
import { useStoreContext } from "@/features/kds/store-status/hooks/useStoreContext";
import { ChatbotFab } from "@/features/kds/support/components/ChatbotFab";
import { SupportPanel } from "@/features/kds/support/components/SupportPanel";
import { MyTasksPanel } from "@/features/kds/tasks/components/MyTasksPanel";
import { useAssignedMenus } from "@/features/kds/tasks/hooks/useAssignedMenus";
import { KdsToast } from "@/shared/components/KdsToast";
import { useKdsClock } from "@/shared/hooks/useKdsClock";
import { useToast } from "@/shared/hooks/useToast";
import type { AuthSession } from "@/types";

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
  const { hideToast, showToast, toast } = useToast();
  const now = useKdsClock();
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
      activeOrderCount={counts.NEW + counts.COOKING}
      activeTab={activeTab}
      isManager={isManager}
      loggingOut={loggingOut}
      open={sidebarOpen}
      session={session}
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

      <ChangePasswordModal
        accessToken={session.accessToken}
        open={pwModal}
        showToast={showToast}
        onClose={() => setPwModal(false)}
        onLogout={onLogout}
        onUnauthorized={onUnauthorized}
      />

      <KdsToast toast={toast} onClose={hideToast} />
    </>
  );

  return (
    <KdsShell overlays={overlays} sidebar={sidebar} topbar={topbar}>
      {counts.CANCELLED > 0 ? (
        <div className="kds-notice-bar border-b border-[var(--color-amber-border)] bg-[var(--color-amber-subtle)] px-4 py-[7px] text-xs font-medium text-[var(--color-amber)]">
          취소 주문 {counts.CANCELLED}건은 보드에서 제외되어 집계로만 관리됩니다.
        </div>
      ) : null}

      {activeTab === "MY_TASKS" ? (
        <div className="kds-panel-shell">
          <MyTasksPanel
            assignedMenus={assignedMenus}
            loading={assignedMenusLoading}
            now={now}
            orders={boardOrders}
            saving={assignedMenusSaving}
            onCreateAssignedMenu={createAssignedMenu}
            onDeleteAssignedMenu={deleteAssignedMenu}
            onUpdateAssignedMenu={updateAssignedMenu}
          />
        </div>
      ) : activeTab === "STAFF" && isManager ? (
        <div className="kds-panel-shell">
          <StaffPanel onUnauthorized={onUnauthorized} session={session} />
        </div>
      ) : activeTab === "STATS" ? (
        <StatsPanel loading={statsLoading} orders={orders} stats={stats} />
      ) : activeTab === "SETTINGS" ? (
        <div className="kds-panel-shell">
          <SettingsPanel
            disabled={settingsDisabled}
            settings={settings}
            onChangePasswordClick={openChangePasswordModal}
            onUpdate={updateSettings}
          />
        </div>
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
