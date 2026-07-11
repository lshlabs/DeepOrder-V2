import { LoadingState } from "@/components/blocks";
import { Button } from "@/components/ui";

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

const TEMP_OWNER_AUTH_RESPONSE: AuthResponse = {
  accessToken: "temp-owner-access-token",
  refreshToken: "temp-owner-refresh-token",
  autoLogin: false,
  user: {
    id: 1,
    loginId: "temp-owner",
    name: "임시 점주",
    role: "STORE_OWNER",
    accountType: "OWNER",
    approvalStatus: "APPROVED",
  },
  store: {
    id: 1,
    storeId: "TEMP-OWNER-STORE",
    storeName: "임시 점주 매장",
    phone: "01012345678",
    zipNo: "00000",
    roadAddress: "서울시 중구 을지로 1",
    jibunAddress: "서울시 중구 을지로동 1",
    addressDetail: "101호",
    approvalStatus: "APPROVED",
  },
};

const TEMP_EMPLOYEE_AUTH_RESPONSE: AuthResponse = {
  accessToken: "temp-employee-access-token",
  refreshToken: "temp-employee-refresh-token",
  autoLogin: false,
  user: {
    id: 2,
    loginId: "temp-employee",
    name: "임시 직원",
    role: "ADMIN",
    accountType: "EMPLOYEE",
    approvalStatus: "APPROVED",
  },
  store: {
    id: 1,
    storeId: "TEMP-OWNER-STORE",
    storeName: "임시 점주 매장",
    phone: "01012345678",
    zipNo: "00000",
    roadAddress: "서울시 중구 을지로 1",
    jibunAddress: "서울시 중구 을지로동 1",
    addressDetail: "101호",
    approvalStatus: "APPROVED",
  },
};

const TEMP_PENDING_REGISTER_RESPONSE: RegisterResponse = {
  user: {
    id: 3,
    loginId: "temp-pending",
    name: "임시 가입자",
    role: "STORE_OWNER",
    accountType: "OWNER",
    approvalStatus: "PENDING_APPROVAL",
  },
  store: {
    id: 3,
    storeId: "TEMP-PENDING-STORE",
    storeName: "임시 승인대기 매장",
    phone: "01087654321",
    zipNo: "00000",
    roadAddress: "서울시 종로구 종로 1",
    jibunAddress: "서울시 종로구 종로1가 1",
    addressDetail: "202호",
    approvalStatus: "PENDING_APPROVAL",
  },
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
      <div className="space-y-4">
        <AuthForms
          initialError={bootError}
          onLoginSuccess={onLoginSuccess}
          onRegisterSuccess={onRegisterSuccess}
        />

        {/* TEMP_AUTH_BYPASS_START: v0/디자인 작업용 백엔드 없는 임시 진입 버튼. 필요 없으면 이 블록 전체를 삭제하면 된다. */}
        <div className="space-y-2 rounded-panel border border-dashed border-border bg-surface-2 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Temporary auth bypass
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Button size="compact" type="button" variant="outline" onClick={() => onLoginSuccess(TEMP_OWNER_AUTH_RESPONSE)}>
              점주로 바로 진입
            </Button>
            <Button size="compact" type="button" variant="outline" onClick={() => onLoginSuccess(TEMP_EMPLOYEE_AUTH_RESPONSE)}>
              직원으로 바로 진입
            </Button>
            <Button size="compact" type="button" variant="outline" onClick={() => onRegisterSuccess(TEMP_PENDING_REGISTER_RESPONSE)}>
              승인 대기 보기
            </Button>
          </div>
        </div>
        {/* TEMP_AUTH_BYPASS_END */}
      </div>
    </AuthShell>
  );
}
