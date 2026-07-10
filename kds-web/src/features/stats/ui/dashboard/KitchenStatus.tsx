import { Card } from "@/components/ui/card";
import { kitchenStatus, processingTimeData } from '../../data/mock-data';
import { CheckCircle2, XCircle, CircleChevronRight, CircleAlert } from 'lucide-react';

const statusIcons: Record<string, React.ReactNode> = {
  '완료': <CheckCircle2 className="h-4 w-4" />,
  '진행중': <CircleChevronRight className="h-4 w-4" />,
  '지연': <CircleAlert className="h-4 w-4" />,
  '취소': <XCircle className="h-4 w-4" />,
};

export function KitchenStatus() {
  const total = kitchenStatus.reduce((sum, item) => sum + item.count, 0);
  const completionRate = ((kitchenStatus[0].count / total) * 100).toFixed(1);

  return (
    <Card className="p-5 bg-card border-border/50 h-full flex flex-col">
      {/* 헤더 + 원형 완료율 */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold">업무 현황</h3>
          <p className="text-xs text-muted-foreground mt-0.5">전체 {total}건</p>
        </div>
        {/* 미니 원형 완료율 인디케이터 */}
        <div className="relative w-14 h-14 flex-shrink-0">
          <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
            <circle
              cx="28" cy="28" r="22"
              fill="none"
              stroke="hsl(220, 15%, 90%)"
              strokeWidth="5"
            />
            <circle
              cx="28" cy="28" r="22"
              fill="none"
              stroke="hsl(142, 71%, 45%)"
              strokeWidth="5"
              strokeDasharray={`${(parseFloat(completionRate) / 100) * 138.2} 138.2`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] font-bold">{completionRate}%</span>
          </div>
        </div>
      </div>

      {/* 상태 카드 그리드 */}
      <div className="grid grid-cols-2 gap-2 mb-5">
        {kitchenStatus.map((item) => (
          <div
            key={item.status}
            className="relative overflow-hidden rounded-xl p-3 border border-border/40 bg-gradient-to-br from-muted/40 to-transparent hover:shadow-md transition-all duration-300 group"
          >
            {/* 배경 장식 */}
            <div
              className="absolute top-0 right-0 w-12 h-12 rounded-full opacity-10 -translate-y-3 translate-x-3 group-hover:opacity-20 transition-opacity"
              style={{ backgroundColor: item.color }}
            />
            <div className="flex items-center gap-1.5 mb-1.5" style={{ color: item.color }}>
              {statusIcons[item.status]}
              <span className="text-[11px] font-medium">{item.status}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold tracking-tight">{item.count}</span>
              <span className="text-[10px] text-muted-foreground">건</span>
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {((item.count / total) * 100).toFixed(0)}% 비중
            </div>
          </div>
        ))}
      </div>

      {/* 처리 시간 분포 - 스택 바 */}
      <div className="mt-auto">
        <p className="text-[11px] text-muted-foreground mb-2 font-medium">처리 시간 분포</p>
        {/* 스택 바 */}
        <div className="h-3 rounded-full overflow-hidden flex bg-muted mb-2">
          {processingTimeData.map((item, idx) => {
            const colors = [
              'hsl(142, 71%, 45%)',
              'hsl(217, 91%, 60%)',
              'hsl(45, 93%, 47%)',
              'hsl(0, 84%, 60%)',
            ];
            return (
              <div
                key={item.range}
                className="h-full transition-all duration-500"
                style={{
                  width: `${item.percentage}%`,
                  backgroundColor: colors[idx],
                }}
              />
            );
          })}
        </div>
        {/* 범례 */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          {processingTimeData.map((item, idx) => {
            const colors = [
              'hsl(142, 71%, 45%)',
              'hsl(217, 91%, 60%)',
              'hsl(45, 93%, 47%)',
              'hsl(0, 84%, 60%)',
            ];
            return (
              <div key={item.range} className="flex items-center gap-1.5">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: colors[idx] }}
                />
                <span className="text-[10px] text-muted-foreground truncate">{item.range}</span>
                <span className="text-[10px] font-medium ml-auto">{item.percentage}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
