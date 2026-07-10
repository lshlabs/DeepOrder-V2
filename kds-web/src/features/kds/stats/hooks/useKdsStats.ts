import { useCallback, useEffect, useState } from "react";

import { apiGetKdsStats } from "../../../../lib/api";
import { requestWithReauth } from "../../../../shared/lib/requestWithReauth";
import type { ShowToast } from "@/lib/notifications";
import type { KdsStatsResponse } from "../../../../types";

type UseKdsStatsParams = {
  accessToken: string;
  onUnauthorized: () => Promise<string | null>;
  showToast: ShowToast;
};

const USE_STATS_MOCK_DATA = true;

export function useKdsStats({
  accessToken,
  onUnauthorized,
  showToast,
}: UseKdsStatsParams) {
  const [stats, setStats] = useState<KdsStatsResponse | null>(null);
  const [loading, setLoading] = useState(!USE_STATS_MOCK_DATA);

  const refreshStats = useCallback(async () => {
    // 임시 mock 모드에서는 실제 /api/kds/stats 연결을 막는다.
    if (USE_STATS_MOCK_DATA) {
      setStats(null);
      setLoading(false);
      return;
    }
    const data = await requestWithReauth(accessToken, onUnauthorized, apiGetKdsStats);
    setStats(data);
  }, [accessToken, onUnauthorized]);

  useEffect(() => {
    if (USE_STATS_MOCK_DATA) {
      setLoading(false);
      return;
    }
    void refreshStats()
      .catch((error) => {
        showToast(error instanceof Error ? error.message : "통계를 불러오지 못했습니다.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [refreshStats, showToast]);

  return {
    loading,
    refreshStats,
    stats,
  };
}
