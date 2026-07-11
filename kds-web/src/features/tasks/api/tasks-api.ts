import { createAuthHeaders, request } from "@/lib/api";
import type { AssignedMenuListResponse, CreateAssignedMenuRequest, UpdateAssignedMenuRequest } from "../types";
/* MOCK_MODE_START: 백엔드 미연결시 mock fallback. 제거하려면 이 import와 각 함수의 catch 블록을 삭제 */
import { mockAssignedMenusResponse } from "./mock-tasks-data";

function isNetworkError(error: unknown): boolean {
  return error instanceof TypeError;
}
/* MOCK_MODE_END */
export async function apiGetAssignedMenus(accessToken: string) {
  /* MOCK_MODE_START */
  try {
  /* MOCK_MODE_END */
  return await request<AssignedMenuListResponse>("/api/kds/my-tasks/menus", { headers: createAuthHeaders(accessToken) });
  /* MOCK_MODE_START */
  } catch (error) {
    if (isNetworkError(error)) return mockAssignedMenusResponse;
    throw error;
  }
  /* MOCK_MODE_END */
}
export async function apiCreateAssignedMenu(accessToken: string, payload: CreateAssignedMenuRequest) {
  /* MOCK_MODE_START */
  try {
  /* MOCK_MODE_END */
  return await request<void>("/api/kds/my-tasks/menus", { method: "POST", headers: createAuthHeaders(accessToken), body: JSON.stringify(payload) });
  /* MOCK_MODE_START */
  } catch (error) {
    if (!isNetworkError(error)) throw error;
    return undefined as void;
  }
  /* MOCK_MODE_END */
}
export async function apiUpdateAssignedMenu(accessToken: string, menuId: number, payload: UpdateAssignedMenuRequest) {
  /* MOCK_MODE_START */
  try {
  /* MOCK_MODE_END */
  return await request<void>(`/api/kds/my-tasks/menus/${menuId}`, { method: "PATCH", headers: createAuthHeaders(accessToken), body: JSON.stringify(payload) });
  /* MOCK_MODE_START */
  } catch (error) {
    if (!isNetworkError(error)) throw error;
    return undefined as void;
  }
  /* MOCK_MODE_END */
}
export async function apiDeleteAssignedMenu(accessToken: string, menuId: number) {
  /* MOCK_MODE_START */
  try {
  /* MOCK_MODE_END */
  return await request<void>(`/api/kds/my-tasks/menus/${menuId}`, { method: "DELETE", headers: createAuthHeaders(accessToken) });
  /* MOCK_MODE_START */
  } catch (error) {
    if (!isNetworkError(error)) throw error;
    return undefined as void;
  }
  /* MOCK_MODE_END */
}
