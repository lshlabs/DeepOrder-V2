import { AlertTriangle, Clock3 } from "lucide-react";

import { Button } from "@/components/ui";

import type { AuthPendingInfo } from "../model/types";

type ApprovalPendingViewProps = {
  pendingInfo: AuthPendingInfo;
  onBack: () => void;
};

export function ApprovalPendingView({ pendingInfo, onBack }: ApprovalPendingViewProps) {
  const rejected =
    pendingInfo.user.approvalStatus === "REJECTED" ||
    pendingInfo.store.approvalStatus === "REJECTED";
  const rejectionReason =
    pendingInfo.user.rejectionReason ?? pendingInfo.store.rejectionReason ?? null;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div
          className={
            rejected
              ? "inline-flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive"
              : "inline-flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning/10 px-3 py-1 text-xs font-semibold text-warning"
          }
        >
          {rejected ? <AlertTriangle className="size-3.5" aria-hidden="true" /> : <Clock3 className="size-3.5" aria-hidden="true" />}
          {rejected ? "승인 거절" : "승인 대기"}
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">
            {rejected ? "가입 승인이 완료되지 않았습니다" : "가입 신청이 완료되었습니다"}
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            {rejected
              ? rejectionReason ?? "관리자 검토 결과 승인되지 않았습니다. 관리자에게 문의해주세요."
              : "관리자 검토 후 승인되면 로그인할 수 있습니다."}
          </p>
        </div>
      </div>

      <dl className="overflow-hidden rounded-lg border border-border bg-muted/40">
        <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3">
          <dt className="text-sm text-muted-foreground">매장명</dt>
          <dd className="text-right text-sm font-medium text-foreground">{pendingInfo.store.storeName || "-"}</dd>
        </div>
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <dt className="text-sm text-muted-foreground">이름</dt>
          <dd className="text-right text-sm font-medium text-foreground">{pendingInfo.user.name || "-"}</dd>
        </div>
      </dl>

      <Button className="w-full" type="button" variant="outline" onClick={onBack}>
        이전으로
      </Button>
    </div>
  );
}
