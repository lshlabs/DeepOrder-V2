import {
  ClearCompletedDialog,
  OrderContextMenu,
  OrderDetailDialog,
  RemoveOrderDialog,
} from "@/features/orders";
import { ChangePasswordDialog } from "@/features/settings";
import { showToast } from "@/lib/notifications";

import type { KdsWorkspace } from "./model/use-kds-workspace";

type KdsWorkspaceOverlaysProps = { workspace: KdsWorkspace };

export function KdsWorkspaceOverlays({ workspace }: KdsWorkspaceOverlaysProps) {
  const { orderOverlays, orders } = workspace;

  return (
    <>
      <OrderContextMenu
        canPin={orderOverlays.contextOrder?.status === "NEW" || orderOverlays.contextOrder?.status === "COOKING"}
        contextMenu={orderOverlays.contextMenu}
        isPinned={orderOverlays.contextMenu ? orderOverlays.pinnedOrderIds.includes(orderOverlays.contextMenu.orderId) : false}
        onClose={orderOverlays.closeContextMenu}
        onOpenDetail={orderOverlays.openOrderDetail}
        onOpenRemove={orderOverlays.openRemoveOrder}
        onTogglePinned={orderOverlays.togglePinnedOrder}
      />
      <OrderDetailDialog order={orderOverlays.selectedOrder} onClose={orderOverlays.closeOrderDetail} />
      <RemoveOrderDialog
        open={orderOverlays.removeOrderId !== null}
        submitting={orderOverlays.removeOrderId !== null && orders.hidingOrderId === orderOverlays.removeOrderId}
        onCancel={orderOverlays.cancelRemoveOrder}
        onConfirm={orderOverlays.confirmRemoveOrder}
      />
      <ClearCompletedDialog
        open={workspace.clearDoneConfirmOpen}
        submitting={orders.archivingCompleted}
        onCancel={workspace.closeClearDoneConfirm}
        onConfirm={workspace.confirmClearCompleted}
      />
      <ChangePasswordDialog
        accessToken={workspace.session.accessToken}
        open={workspace.changePasswordOpen}
        showToast={showToast}
        onClose={workspace.closeChangePassword}
        onLogout={workspace.onLogout}
        onUnauthorized={workspace.onUnauthorized}
      />
    </>
  );
}
