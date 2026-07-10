import { createAuthHeaders, request, requestWithReauth } from "@/lib/api";
import type { KdsStatsResponse } from "../types";
function apiGetKdsStats(accessToken: string) { return request<KdsStatsResponse>("/api/kds/stats", { headers: createAuthHeaders(accessToken) }); }
export function getKdsStats(accessToken: string, onUnauthorized: () => Promise<string | null>) {
  return requestWithReauth(accessToken, onUnauthorized, apiGetKdsStats);
}
