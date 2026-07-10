import { useCallback, useEffect, useState } from "react";

import { requestWithReauth } from "@/lib/api";

import {
  apiCreateAssignedMenu,
  apiDeleteAssignedMenu,
  apiGetAssignedMenus,
  apiUpdateAssignedMenu,
} from "../api/tasks-api";
import type { ShowToast } from "@/lib/notifications";

import type { AssignedMenu } from "../types";

type UseAssignedMenusParams = {
  accessToken: string;
  onUnauthorized: () => Promise<string | null>;
  showToast: ShowToast;
};

export function useAssignedMenus({ accessToken, onUnauthorized, showToast }: UseAssignedMenusParams) {
  const [assignedMenus, setAssignedMenus] = useState<AssignedMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const refreshAssignedMenus = useCallback(async () => {
    const data = await requestWithReauth(accessToken, onUnauthorized, apiGetAssignedMenus);
    setAssignedMenus(data.menus);
  }, [accessToken, onUnauthorized]);

  useEffect(() => {
    void refreshAssignedMenus()
      .catch((error) => showToast(error instanceof Error ? error.message : "내 업무 메뉴를 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, [refreshAssignedMenus, showToast]);

  async function runMutation(task: (nextAccessToken: string) => Promise<unknown>, fallback: string) {
    setSaving(true);
    try {
      await requestWithReauth(accessToken, onUnauthorized, task);
      await refreshAssignedMenus();
    } catch (error) {
      showToast(error instanceof Error ? error.message : fallback);
      throw error;
    } finally {
      setSaving(false);
    }
  }

  return {
    assignedMenus,
    loading,
    refreshAssignedMenus,
    saving,
    createAssignedMenu: (menuName: string) =>
      runMutation((token) => apiCreateAssignedMenu(token, { menuName }), "담당 메뉴를 추가하지 못했습니다."),
    updateAssignedMenu: (menuId: number, menuName: string) =>
      runMutation((token) => apiUpdateAssignedMenu(token, menuId, { menuName }), "담당 메뉴를 수정하지 못했습니다."),
    deleteAssignedMenu: (menuId: number) =>
      runMutation((token) => apiDeleteAssignedMenu(token, menuId), "담당 메뉴를 삭제하지 못했습니다."),
  };
}
