import type { Order } from "@/features/orders";
export type KdsStatsSummary = { total_orders: number; completed_orders: number; completion_rate: number; revenue: number; average_completion_seconds: number | null; delayed_orders: number; peak_hour: string | null };
export type KdsStatsComparisonBucket = { orders_delta: number | null; orders_delta_rate: number | null; revenue_delta: number | null; revenue_delta_rate: number | null; average_completion_seconds_delta: number | null };
export type KdsStatsComparison = { vs_yesterday: KdsStatsComparisonBucket; vs_7d_average: KdsStatsComparisonBucket };
export type KdsStatsHourly = { hour: string; orders: number; revenue: number; average_completion_seconds: number | null; delayed_orders: number };
export type KdsStatsMenu = { menu_name: string; orders: number; revenue: number; average_completion_seconds: number | null; delayed_orders: number; yesterday_delta_rate: number | null; seven_day_average_delta_rate: number | null };
export type KdsStatsKitchen = { on_time_rate: number | null; slowest_order_seconds: number | null; bottleneck_hour: string | null; bottleneck_menu: string | null };
export type KdsStatsResponse = { date: string; summary: KdsStatsSummary; comparison: KdsStatsComparison; hourly: KdsStatsHourly[]; menus: KdsStatsMenu[]; kitchen: KdsStatsKitchen; insights: string[] };
export type StatsDashboardProps = { loading?: boolean; orders: Order[]; stats: KdsStatsResponse | null };
