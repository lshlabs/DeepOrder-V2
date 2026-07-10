import { createAuthHeaders, request } from "@/lib/api";
import type { ChangePasswordRequest, ChangePasswordResponse, StoreSettings, UpdateStoreSettingsRequest } from "../types";
export function apiChangePassword(accessToken: string, payload: ChangePasswordRequest) {
  return request<ChangePasswordResponse>("/api/auth/change-password", { method: "POST", headers: createAuthHeaders(accessToken), body: JSON.stringify(payload) });
}
export function apiGetKdsSettings(accessToken: string) {
  return request<StoreSettings>("/api/kds/settings", { headers: createAuthHeaders(accessToken) });
}
export function apiUpdateKdsSettings(accessToken: string, payload: UpdateStoreSettingsRequest) {
  return request<StoreSettings>("/api/kds/settings", { method: "PATCH", headers: createAuthHeaders(accessToken), body: JSON.stringify(payload) });
}
