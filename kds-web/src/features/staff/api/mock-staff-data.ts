/* MOCK_MODE: 백엔드 미연결시 사용하는 mock 데이터. 제거하려면 이 파일과 staff-api.ts의 networkError 핸들링 부분을 함께 삭제 */
import type { CreateStaffRequest, RegenerateStaffPinResponse, Staff, StaffListResponse, StaffWithTemporaryPin, UpdateStaffActiveRequest, UpdateStaffRequest } from "../types";

let nextStaffId = 100;

export const mockStaffListResponse: StaffListResponse = {
  staff: [
    { id: 1, loginId: "staff01", name: "김주방", accountType: "EMPLOYEE", positionLabel: "주방장", active: true },
    { id: 2, loginId: "staff02", name: "이조리", accountType: "EMPLOYEE", positionLabel: "조리사", active: true },
    { id: 3, loginId: "staff03", name: "박보조", accountType: "EMPLOYEE", positionLabel: "보조", active: false },
  ],
};

export function mockCreateStaff(payload: CreateStaffRequest): StaffWithTemporaryPin {
  const id = nextStaffId++;
  return {
    id,
    loginId: payload.loginId,
    name: payload.name,
    accountType: "EMPLOYEE",
    positionLabel: payload.positionLabel ?? null,
    active: true,
    temporaryPin: String(1000 + Math.floor(Math.random() * 9000)),
  };
}

export function mockUpdateStaff(staffId: number, payload: UpdateStaffRequest): Staff {
  return {
    id: staffId,
    loginId: payload.loginId,
    name: payload.name,
    accountType: "EMPLOYEE",
    positionLabel: payload.positionLabel ?? null,
    active: true,
  };
}

export function mockUpdateStaffActive(staffId: number, payload: UpdateStaffActiveRequest): Staff {
  return {
    id: staffId,
    loginId: "staff01",
    name: "김주방",
    accountType: "EMPLOYEE",
    positionLabel: "주방장",
    active: payload.active,
  };
}

export function mockRegenerateStaffPin(staffId: number): RegenerateStaffPinResponse {
  return { id: staffId, temporaryPin: String(1000 + Math.floor(Math.random() * 9000)) };
}
