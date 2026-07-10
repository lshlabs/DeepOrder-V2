import { StatsDashboard } from "../dashboard/StatsDashboard";
import type { KdsStatsResponse, Order } from "../../../../types";

type StatsPanelProps = {
  loading?: boolean;
  orders: Order[];
  stats: KdsStatsResponse | null;
};

export function StatsPanel({ loading = false, orders, stats }: StatsPanelProps) {
  return <StatsDashboard loading={loading} orders={orders} stats={stats} />;
}
