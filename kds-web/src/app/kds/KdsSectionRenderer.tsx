import { OrderBoard } from "@/features/orders";
import { SettingsPage } from "@/features/settings";
import { StaffPage } from "@/features/staff";
import { StatsPage } from "@/features/stats";
import { ChatbotFab, SupportPage } from "@/features/support";
import { TasksPage } from "@/features/tasks";

import type { KdsWorkspace } from "./model/use-kds-workspace";

type KdsSectionRendererProps = { workspace: KdsWorkspace };

export function KdsSectionRenderer({ workspace }: KdsSectionRendererProps) {
  const {
    activeSection,
    isManager,
    now,
    onUnauthorized,
    orderOverlays,
    orders,
    session,
    settings,
    settingsDisabled,
    stats,
    tasks,
  } = workspace;

  if (activeSection === "MY_TASKS") {
    return (
      <TasksPage
        assignedMenus={tasks.assignedMenus}
        loading={tasks.loading}
        now={now}
        orders={orders.boardOrders}
        saving={tasks.saving}
        onCreateAssignedMenu={tasks.createAssignedMenu}
        onDeleteAssignedMenu={tasks.deleteAssignedMenu}
        onUpdateAssignedMenu={tasks.updateAssignedMenu}
      />
    );
  }

  if (activeSection === "STAFF" && isManager) {
    return <StaffPage onUnauthorized={onUnauthorized} session={session} />;
  }

  if (activeSection === "STATS") {
    return <StatsPage loading={stats.loading} orders={orders.orders} stats={stats.stats} />;
  }

  if (activeSection === "SETTINGS") {
    return (
      <SettingsPage
        disabled={settingsDisabled}
        settings={settings.settings}
        onChangePasswordClick={workspace.openChangePassword}
        onUpdate={settings.updateSettings}
      />
    );
  }

  if (activeSection === "SUPPORT") {
    return (
      <div className="min-w-0 w-full p-3 md:p-6">
        <SupportPage />
        <ChatbotFab />
      </div>
    );
  }

  return (
    <OrderBoard
      emptyMessage={activeSection === "RECEIVED" ? "접수된 주문이 없습니다" : "완료된 주문이 없습니다"}
      loading={orders.loading}
      newOrderSignal={orders.newOrderSignal}
      now={now}
      orders={orderOverlays.activeOrders}
      pinnedOrderIds={orderOverlays.pinnedOrderIds}
      refreshing={orders.refreshing}
      updatingItemId={orders.updatingOrderItemId}
      updatingOrderId={orders.updatingOrderId}
      onCycleItem={orders.cycleOrderItem}
      onCycleItemOption={orders.cycleOrderItemOption}
      onOpenContextMenu={orderOverlays.openContextMenu}
      onRefresh={workspace.refreshAll}
      onUpdateStatus={orders.updateOrderStatus}
    />
  );
}
