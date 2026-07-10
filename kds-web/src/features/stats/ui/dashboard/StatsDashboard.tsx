import { LoadingState } from "@/components/blocks";

import type { StatsDashboardProps } from "../../types";
import { KitchenStatus } from "./KitchenStatus";
import { KpiCards } from "./KpiCards";
import { MenuPerformance } from "./MenuPerformance";
import { OperationInsights } from "./OperationInsights";
import { OrderFlowChart } from "./OrderFlowChart";
import { PlatformStats } from "./PlatformStats";

export function StatsDashboard({ loading }: StatsDashboardProps) {
  if (loading) {
    return (
      <section className="flex min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8" aria-label="통계 로딩">
        <LoadingState className="w-full" label="통계를 불러오는 중" rows={8} />
      </section>
    );
  }

  return (
    <section className="min-h-0 flex-1 overflow-y-auto bg-background" aria-label="통계">
      <div className="space-y-5 px-4 py-6 sm:px-6 lg:px-8">
        <KpiCards />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="min-w-0 lg:col-span-2">
            <OrderFlowChart />
          </div>
          <KitchenStatus />
        </div>
        <PlatformStats />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <MenuPerformance />
          <OperationInsights />
        </div>
      </div>
    </section>
  );
}
