import type { KdsStatsResponse, Order } from "@/types";

import { StatsDashboard } from "./dashboard/StatsDashboard";

type StatsPageProps = {
  loading?: boolean;
  orders: Order[];
  stats: KdsStatsResponse | null;
};

export function StatsPage({ loading = false, orders, stats }: StatsPageProps) {
  return <StatsDashboard loading={loading} orders={orders} stats={stats} />;
}
