import { useEffect, useMemo, useRef, useState } from 'react';
import { Card } from "../../../../../components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "../../../../../components/ui";
import {
  hourlyOrders,
  hourlyOrders3DayAvg,
  hourlyOrders7DayAvg,
} from '../data/mock-data';
import { Check, SlidersHorizontal } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';

type CompareMode = 'yesterday' | '3day' | '7day';

const compareModeLabels: Record<CompareMode, string> = {
  yesterday: '어제',
  '3day': '3일 평균',
  '7day': '7일 평균',
};

const TODAY_SERIES_COLOR = 'var(--color-accent)';
const PEAK_REFERENCE_COLOR = 'hsl(var(--kds-ui-primary))';
const GRID_COLOR = 'hsl(var(--kds-ui-border))';
const MUTED_TEXT_COLOR = 'hsl(var(--kds-ui-muted-foreground))';
const COMPARE_SERIES_COLOR = 'hsl(var(--kds-ui-muted-foreground) / 0.55)';

export function OrderFlowChart() {
  const [compareMode, setCompareMode] = useState<CompareMode>('yesterday');
  const [showSettings, setShowSettings] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        setShowSettings(false);
      }
    };

    if (showSettings) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSettings]);

  const chartData = useMemo(() => {
    return hourlyOrders.map((item, idx) => {
      let compareValue: number;

      switch (compareMode) {
        case '3day':
          compareValue = hourlyOrders3DayAvg[idx];
          break;
        case '7day':
          compareValue = hourlyOrders7DayAvg[idx];
          break;
        default:
          compareValue = item.yesterday;
      }

      return {
        hour: item.hour,
        today: item.today,
        compare: compareValue,
      };
    });
  }, [compareMode]);

  const peakHour = useMemo(() => {
    return chartData.reduce((max, item) =>
      item.today > max.today ? item : max
    );
  }, [chartData]);

  const chartConfig = useMemo(
    () =>
      ({
        today: {
          label: '오늘',
          color: TODAY_SERIES_COLOR,
        },
        compare: {
          label: compareModeLabels[compareMode],
          color: COMPARE_SERIES_COLOR,
        },
      }) satisfies ChartConfig,
    [compareMode]
  );

  return (
    <Card className="p-5 bg-card border-border/50 h-full flex flex-col relative">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold">시간대별 주문 흐름</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            오늘 / {compareModeLabels[compareMode]} · 피크:{' '}
            <span>{peakHour.hour}</span>{' '}
            (
            {peakHour.today}건)
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* 범례 */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div
                className="w-3 h-0.5 rounded-full"
                style={{ backgroundColor: TODAY_SERIES_COLOR }}
              />
              <span className="text-xs text-muted-foreground">오늘</span>
            </div>

            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 rounded-full bg-muted-foreground/40" />
              <span className="text-xs text-muted-foreground">
                {compareModeLabels[compareMode]}
              </span>
            </div>
          </div>

          {/* 설정 아이콘 */}
          <button
            onClick={() => setShowSettings((prev) => !prev)}
            className="order-flow-settings-trigger p-2 rounded-lg border border-border/60 hover:bg-muted/60 transition-colors"
            aria-label="차트 설정"
            type="button"
          >
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* 차트 설정 패널 */}
      {showSettings && (
        <div
          ref={panelRef}
          className="order-flow-settings-panel absolute top-14 right-5 z-50 w-64 bg-card border border-border rounded-xl shadow-xl p-5 animate-in fade-in-0 zoom-in-95"
        >
          <div>
            <div className="space-y-0.5">
              {(Object.keys(compareModeLabels) as CompareMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => {
                    setCompareMode(mode);
                    setShowSettings(false);
                  }}
                  className="order-flow-settings-option w-full flex items-center justify-between px-2 py-2 rounded-lg hover:bg-muted/50 transition-colors"
                  type="button"
                >
                  <span
                    className={`text-sm ${
                      compareMode === mode
                        ? 'font-semibold text-foreground'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {compareModeLabels[mode]}
                  </span>

                  {compareMode === mode && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 모바일 범례 */}
      <div className="flex sm:hidden items-center gap-4 mb-3">
        <div className="flex items-center gap-1.5">
          <div
            className="w-3 h-0.5 rounded-full"
            style={{ backgroundColor: TODAY_SERIES_COLOR }}
          />
          <span className="text-xs text-muted-foreground">오늘</span>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 rounded-full bg-muted-foreground/40" />
          <span className="text-xs text-muted-foreground">
            {compareModeLabels[compareMode]}
          </span>
        </div>
      </div>

      <div className="flex-1 min-h-[220px]">
        <ChartContainer
          className="min-h-[220px] w-full flex-1 [&_.recharts-cartesian-grid_line]:stroke-border/80"
          config={chartConfig}
        >
          <AreaChart
            data={chartData}
            accessibilityLayer={false}
            margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient
                id="todayGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor={TODAY_SERIES_COLOR}
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor={TODAY_SERIES_COLOR}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke={GRID_COLOR}
              vertical={false}
            />

            <XAxis
              dataKey="hour"
              tick={{ fill: MUTED_TEXT_COLOR, fontSize: 11 }}
              axisLine={{ stroke: GRID_COLOR }}
              tickLine={false}
            />

            <YAxis
              tick={{ fill: MUTED_TEXT_COLOR, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />

            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideIndicator
                  labelFormatter={(value) => (
                    <span className="text-sm font-medium text-foreground">
                      {value}
                    </span>
                  )}
                  formatter={(value, name, item) => (
                    <div className="flex w-full items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-xs text-muted-foreground">
                          {name}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-foreground">
                        {value}건
                      </span>
                    </div>
                  )}
                />
              }
            />

            <ReferenceLine
              x={peakHour.hour}
              stroke={PEAK_REFERENCE_COLOR}
              strokeDasharray="4 4"
              strokeOpacity={0.6}
            />

            <Area
              type="monotone"
              dataKey="compare"
              stroke={COMPARE_SERIES_COLOR}
              strokeWidth={1.5}
              fill="transparent"
              strokeDasharray="4 4"
              dot={false}
            />

            <Area
              type="monotone"
              dataKey="today"
              stroke={TODAY_SERIES_COLOR}
              strokeWidth={2.5}
              fill="url(#todayGradient)"
              dot={false}
              activeDot={{
                r: 4,
                fill: TODAY_SERIES_COLOR,
                strokeWidth: 0,
              }}
            />
          </AreaChart>
        </ChartContainer>
      </div>
    </Card>
  );
}
