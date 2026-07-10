import type { KdsStatsResponse, Order } from "@/types";

export type StatsDashboardProps = {
  loading?: boolean;
  orders: Order[];
  stats: KdsStatsResponse | null;
};
