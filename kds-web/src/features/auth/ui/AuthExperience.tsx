import { LoadingState } from "@/components/blocks";

import type {
  AuthPendingInfo,
  AuthResponse,
  RegisterResponse,
} from "../model/types";
import { ApprovalPendingView } from "./ApprovalPendingView";
import { AuthForms } from "./AuthForms";
import { AuthShell } from "./AuthShell";

type AuthExperienceProps = {
  state: "booting" | "form" | "pending";
  bootError?: string | null;
  pendingInfo?: AuthPendingInfo | null;
  onLoginSuccess: (response: AuthResponse) => void;
  onRegisterSuccess: (response: RegisterResponse) => void;
  onBackFromPending: () => void;
};

export function AuthExperience({
  state,
  bootError,
  pendingInfo,
  onLoginSuccess,
  onRegisterSuccess,
  onBackFromPending,
}: AuthExperienceProps) {
  if (state === "booting") {
    return (
      <AuthShell contentClassName="max-w-[400px]">
        <div className="space-y-5 rounded-panel border border-border bg-card p-5 shadow-floating">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">Auth session</p>
            <h2 className="text-xl font-semibold tracking-tight">세션 확인 중</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              저장된 토큰을 확인하고 매장 계정 상태를 복원하고 있습니다.
            </p>
          </div>
          <LoadingState label="세션 확인 중" rows={3} />
        </div>
      </AuthShell>
    );
  }

  if (state === "pending" && pendingInfo) {
    return (
      <AuthShell contentClassName="max-w-[400px]">
        <ApprovalPendingView pendingInfo={pendingInfo} onBack={onBackFromPending} />
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <AuthForms
        initialError={bootError}
        onLoginSuccess={onLoginSuccess}
        onRegisterSuccess={onRegisterSuccess}
      />
    </AuthShell>
  );
}
