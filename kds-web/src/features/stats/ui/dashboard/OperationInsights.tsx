import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { insights } from "../../data/mock-data";

const iconMap: Record<string, ReactNode> = {
  info: <Info className="h-4 w-4 text-blue-400" />,
  warning: <AlertTriangle className="h-4 w-4 text-amber-400" />,
  success: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
};

const bgMap: Record<string, string> = {
  info: "bg-blue-500/5 border-blue-500/20",
  warning: "bg-amber-500/5 border-amber-500/20",
  success: "bg-emerald-500/5 border-emerald-500/20",
};

export function OperationInsights() {
  return (
    <Card className="p-5 bg-card border-border/50">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-base font-semibold">운영 인사이트</h3>
      </div>

      <div className="space-y-2.5">
        {insights.map((insight, index) => (
          <div key={index} className={`flex items-start gap-2.5 p-3 rounded-lg border ${bgMap[insight.type]}`}>
            <div className="mt-0.5 flex-shrink-0">{iconMap[insight.type]}</div>
            <p className="text-sm text-foreground/90 leading-relaxed">{insight.message}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border/50">
        <p className="text-xs text-muted-foreground leading-relaxed">
          💡 통계는 당일 영업 데이터를 기반으로 합니다. 영업 시간이 짧을 경우 일부 지표가 부정확할 수 있으며, 3일 이상 데이터가 쌓이면 더 정확한 추세를 확인할 수 있습니다.
        </p>
      </div>
    </Card>
  );
}
