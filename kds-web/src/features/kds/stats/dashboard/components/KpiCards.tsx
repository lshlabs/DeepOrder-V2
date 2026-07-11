import { TrendingUp, TrendingDown, Minus, ShoppingCart, DollarSign, CheckCircle, Clock, AlertTriangle, Flame } from 'lucide-react';
import { Card } from "../../../../../components/ui/card";
import { kpiData } from '../data/mock-data';

const iconMap: Record<string, React.ReactNode> = {
  '주문 수': <ShoppingCart className="h-5 w-5" />,
  '매출': <DollarSign className="h-5 w-5" />,
  '완료율': <CheckCircle className="h-5 w-5" />,
  '평균 완료 시간': <Clock className="h-5 w-5" />,
  '지연 주문': <AlertTriangle className="h-5 w-5" />,
  '피크 시간': <Flame className="h-5 w-5" />,
};

const getChangeIcon = (change: number) => {
  if (change > 0) return <TrendingUp className="h-3.5 w-3.5" />;
  if (change < 0) return <TrendingDown className="h-3.5 w-3.5" />;
  return <Minus className="h-3.5 w-3.5" />;
};

const getChangeColor = (change: number, label: string) => {
  // 지연 주문은 감소가 좋은 것
  const isInverse = label === '지연 주문' || label === '평균 완료 시간';
  if (change === 0) return 'text-muted-foreground';
  if (isInverse) {
    return change < 0 ? 'text-emerald-400' : 'text-red-400';
  }
  return change > 0 ? 'text-emerald-400' : 'text-red-400';
};

const getValueClassName = (label: string) => {
  if (label === '매출' || label === '피크 시간') {
    return 'text-[clamp(1.125rem,3.8vw,1.5rem)]';
  }

  return 'text-2xl';
};

export function KpiCards() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {kpiData.map((kpi) => (
        <Card
          key={kpi.label}
          className="p-4 bg-card border-border/50 hover:border-primary/30 transition-colors duration-200"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-md bg-[var(--color-accent-subtle)] text-[var(--color-accent)]">
              {iconMap[kpi.label]}
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              {kpi.label}
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline gap-1 min-h-[2rem]">
              <span className={`${getValueClassName(kpi.label)} font-bold tracking-tight`}>
                {kpi.value}
              </span>
              {kpi.unit && (
                <span className="text-sm text-muted-foreground">{kpi.unit}</span>
              )}
            </div>
            <div className={`flex items-center gap-1 text-xs ${getChangeColor(kpi.change, kpi.label)}`}>
              {getChangeIcon(kpi.change)}
              <span>
                {kpi.change === 0
                  ? kpi.changeLabel
                  : `${Math.abs(kpi.change)}% ${kpi.changeLabel}`}
              </span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
