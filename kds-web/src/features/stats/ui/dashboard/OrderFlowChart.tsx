import { useMemo, useState } from "react";
import { Check, SlidersHorizontal } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  hourlyOrders,
  hourlyOrders3DayAvg,
  hourlyOrders7DayAvg,
} from "../../data/mock-data";

type CompareMode = "yesterday" | "3day" | "7day";

const compareModeLabels: Record<CompareMode, string> = {
  yesterday: "어제",
  "3day": "3일 평균",
  "7day": "7일 평균",
};

const TODAY_SERIES_COLOR = "hsl(var(--chart-1))";
const PEAK_REFERENCE_COLOR = "hsl(var(--primary))";
const GRID_COLOR = "hsl(var(--border))";
const MUTED_TEXT_COLOR = "hsl(var(--muted-foreground))";
const COMPARE_SERIES_COLOR = "hsl(var(--muted-foreground) / 0.55)";

export function OrderFlowChart() {
  const [compareMode, setCompareMode] = useState<CompareMode>("yesterday");
  const [settingsOpen, setSettingsOpen] = useState(false);

  const chartData = useMemo(
    () =>
      hourlyOrders.map((item, index) => ({
        hour: item.hour,
        today: item.today,
        compare:
          compareMode === "3day"
            ? hourlyOrders3DayAvg[index]
            : compareMode === "7day"
              ? hourlyOrders7DayAvg[index]
              : item.yesterday,
      })),
    [compareMode],
  );

  const peakHour = useMemo(
    () => chartData.reduce((maximum, item) => (item.today > maximum.today ? item : maximum)),
    [chartData],
  );

  const chartConfig = useMemo(
    () =>
      ({
        today: { label: "오늘", color: TODAY_SERIES_COLOR },
        compare: { label: compareModeLabels[compareMode], color: COMPARE_SERIES_COLOR },
      }) satisfies ChartConfig,
    [compareMode],
  );

  return (
    <Card className="relative flex h-full min-w-0 flex-col border-border/50 p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold">시간대별 주문 흐름</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            오늘 / {compareModeLabels[compareMode]} · 피크: {peakHour.hour} ({peakHour.today}건)
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden items-center gap-3 sm:flex" aria-label="차트 범례">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-0.5 w-3 rounded-full bg-chart-1" />오늘
            </span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-0.5 w-3 rounded-full bg-muted-foreground/40" />
              {compareModeLabels[compareMode]}
            </span>
          </div>
          <Popover open={settingsOpen} onOpenChange={setSettingsOpen}>
            <PopoverTrigger asChild>
              <Button aria-label="차트 비교 기준 설정" size="icon" type="button" variant="outline">
                <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56 p-2">
              <p className="px-2 pb-1 text-xs font-medium text-muted-foreground">비교 기준</p>
              {(Object.keys(compareModeLabels) as CompareMode[]).map((mode) => (
                <Button
                  key={mode}
                  className="w-full justify-between"
                  onClick={() => {
                    setCompareMode(mode);
                    setSettingsOpen(false);
                  }}
                  type="button"
                  variant="ghost"
                >
                  <span className={cn(compareMode === mode && "font-semibold")}>{compareModeLabels[mode]}</span>
                  {compareMode === mode ? <Check className="h-4 w-4 text-primary" aria-hidden="true" /> : null}
                </Button>
              ))}
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="mb-3 flex items-center gap-4 sm:hidden" aria-label="차트 범례">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-0.5 w-3 rounded-full bg-chart-1" />오늘
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-0.5 w-3 rounded-full bg-muted-foreground/40" />
          {compareModeLabels[compareMode]}
        </span>
      </div>

      <div className="min-h-[220px] min-w-0 flex-1 overflow-hidden">
        <ChartContainer
          className="min-h-[220px] w-full [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line]:stroke-border"
          config={chartConfig}
        >
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="todayGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor={TODAY_SERIES_COLOR} stopOpacity={0.3} />
                <stop offset="95%" stopColor={TODAY_SERIES_COLOR} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="hour" axisLine={{ stroke: GRID_COLOR }} tick={{ fill: MUTED_TEXT_COLOR, fontSize: 11 }} tickLine={false} />
            <YAxis axisLine={false} tick={{ fill: MUTED_TEXT_COLOR, fontSize: 11 }} tickLine={false} />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideIndicator
                  labelFormatter={(value) => <span className="text-sm font-medium">{value}</span>}
                  formatter={(value, name, item) => (
                    <div className="flex w-full items-center justify-between gap-3">
                      <span className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        {name}
                      </span>
                      <span className="text-xs font-semibold">{value}건</span>
                    </div>
                  )}
                />
              }
            />
            <ReferenceLine x={peakHour.hour} stroke={PEAK_REFERENCE_COLOR} strokeDasharray="4 4" strokeOpacity={0.6} />
            <Area dataKey="compare" dot={false} fill="transparent" stroke={COMPARE_SERIES_COLOR} strokeDasharray="4 4" strokeWidth={1.5} type="monotone" />
            <Area
              activeDot={{ r: 4, fill: TODAY_SERIES_COLOR, strokeWidth: 0 }}
              dataKey="today"
              dot={false}
              fill="url(#todayGradient)"
              stroke={TODAY_SERIES_COLOR}
              strokeWidth={2.5}
              type="monotone"
            />
          </AreaChart>
        </ChartContainer>
      </div>
    </Card>
  );
}
