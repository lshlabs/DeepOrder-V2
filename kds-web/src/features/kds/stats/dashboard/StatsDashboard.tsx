import { KpiCards } from "./components/KpiCards";
import { OrderFlowChart } from "./components/OrderFlowChart";
import { KitchenStatus } from "./components/KitchenStatus";
import { MenuPerformance } from "./components/MenuPerformance";
import { OperationInsights } from "./components/OperationInsights";
import { PlatformStats } from "./components/PlatformStats";
import type { StatsDashboardProps } from "./types";

import "./statsDashboard.css";

export function StatsDashboard(props: StatsDashboardProps) {
  void props;

  return (
    <section className="kds-stats-dashboard bg-background" aria-label="통계">
      <main className="px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        <section>
          <KpiCards />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <OrderFlowChart />
          </div>
          <div>
            <KitchenStatus />
          </div>
        </section>

        <section>
          <PlatformStats />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <MenuPerformance />
          <OperationInsights />
        </section>
      </main>
    </section>
  );
}
