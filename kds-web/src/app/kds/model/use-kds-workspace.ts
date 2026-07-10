import { useState } from "react";

import type { KdsSectionId } from "@/app/navigation/types";
import type { AuthSession } from "@/features/auth";
import { useKdsOrders, useOrderOverlays } from "@/features/orders";
import { useKdsSettings } from "@/features/settings";
import { useKdsStats } from "@/features/stats";
import { useStoreContext } from "@/features/store-status";
import { useAssignedMenus } from "@/features/tasks";
import { useClock } from "@/lib/date/use-clock";
import { showToast } from "@/lib/notifications";

type UseKdsWorkspaceParams = {
  session: AuthSession;
  onLogout: () => Promise<void>;
  onUnauthorized: () => Promise<string | null>;
};

export function useKdsWorkspace({ session, onLogout, onUnauthorized }: UseKdsWorkspaceParams) {
  const [loggingOut, setLoggingOut] = useState(false);
  const [activeSection, setActiveSection] = useState<KdsSectionId>("RECEIVED");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [clearDoneConfirmOpen, setClearDoneConfirmOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const now = useClock().getTime();

  const orders = useKdsOrders({ accessToken: session.accessToken, onUnauthorized, showToast });
  const tasks = useAssignedMenus({ accessToken: session.accessToken, onUnauthorized, showToast });
  const settings = useKdsSettings({ accessToken: session.accessToken, onUnauthorized, showToast });
  const stats = useKdsStats({ accessToken: session.accessToken, onUnauthorized, showToast });
  const store = useStoreContext({ accessToken: session.accessToken, onUnauthorized, showToast });
  const orderOverlays = useOrderOverlays({
    doneOrders: orders.doneOrders,
    hideOrder: orders.hideOrder,
    orders: orders.orders,
    receivedOrders: orders.receivedOrders,
    showReceivedOrders: activeSection === "RECEIVED",
  });

  const isManager = session.user.accountType !== "EMPLOYEE";
  const settingsDisabled = settings.loading || settings.saving;

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await onLogout();
    } finally {
      setLoggingOut(false);
    }
  }

  function refreshAll() {
    return orders.runManualRefresh(() =>
      Promise.all([
        orders.refreshOrders(),
        store.refreshStoreContext(),
        settings.refreshSettings(),
        tasks.refreshAssignedMenus(),
        stats.refreshStats(),
      ]).then(() => undefined),
    );
  }

  function changeSection(section: KdsSectionId) {
    setActiveSection(section);
    setSidebarOpen(false);
  }

  function confirmClearCompleted() {
    void orders.archiveCompletedOrders().then((success) => {
      if (success) setClearDoneConfirmOpen(false);
    });
  }

  return {
    activeSection,
    changePasswordOpen,
    clearDoneConfirmOpen,
    isManager,
    loggingOut,
    now,
    onLogout,
    onUnauthorized,
    orderOverlays,
    orders,
    session,
    settings,
    settingsDisabled,
    sidebarOpen,
    stats,
    store,
    tasks,
    changeSection,
    closeChangePassword: () => setChangePasswordOpen(false),
    closeClearDoneConfirm: () => setClearDoneConfirmOpen(false),
    confirmClearCompleted,
    handleLogout,
    openChangePassword: () => setChangePasswordOpen(true),
    openClearDoneConfirm: () => setClearDoneConfirmOpen(true),
    refreshAll,
    setSidebarOpen,
  };
}

export type KdsWorkspace = ReturnType<typeof useKdsWorkspace>;
