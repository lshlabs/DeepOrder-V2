import { apiGetKdsStats } from "@/lib/api";
import { requestWithReauth } from "@/shared/lib/requestWithReauth";

export function getKdsStats(
  accessToken: string,
  onUnauthorized: () => Promise<string | null>,
) {
  return requestWithReauth(accessToken, onUnauthorized, apiGetKdsStats);
}
