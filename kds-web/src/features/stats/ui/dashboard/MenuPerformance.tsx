import { TrendingDown, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { menuPerformance } from "../../data/mock-data";

export function MenuPerformance() {
  const maxQuantity = Math.max(...menuPerformance.map((m) => m.quantity));

  return (
    <Card className="p-5 bg-card border-border/50">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold">매출 현황</h3>
          <p className="text-xs text-muted-foreground mt-0.5">상위 7개 메뉴 · 판매량 기준</p>
        </div>
      </div>

      <div className="space-y-2.5">
        {menuPerformance.map((item) => (
          <div key={item.name} className="group">
            <div className="flex items-center gap-3">
              <span className={`text-xs font-bold w-5 text-center ${item.rank <= 3 ? "text-accent" : "text-muted-foreground"}`}>{item.rank}</span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium truncate">{item.name}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">{item.quantity}개</span>
                    <span className="text-xs text-muted-foreground tabular-nums w-[72px] text-right">₩{item.revenue.toLocaleString()}</span>
                    <Badge
                      variant="secondary"
                      className={`text-[10px] px-1.5 py-0 h-4 w-14 justify-center ${
                        item.change >= 0 ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/10" : "bg-red-500/10 text-red-400 hover:bg-red-500/10"
                      }`}
                    >
                      {item.change >= 0 ? <TrendingUp className="h-2.5 w-2.5 mr-0.5" /> : <TrendingDown className="h-2.5 w-2.5 mr-0.5" />}
                      {Math.abs(item.change)}%
                    </Badge>
                  </div>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${(item.quantity / maxQuantity) * 100}%`,
                      backgroundColor: item.rank <= 3 ? "hsl(25, 95%, 53%)" : "hsl(217, 91%, 60%)",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
