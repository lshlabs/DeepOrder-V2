import { createAuthHeaders, request } from "@/lib/api";
import type { CreateStaffRequest, RegenerateStaffPinResponse, Staff, StaffListResponse, StaffWithTemporaryPin, UpdateStaffActiveRequest, UpdateStaffRequest } from "../types";
/* MOCK_MODE_START: 백엔드 미연결시 mock fallback. 제거하려면 이 import와 각 함수의 catch 블록을 삭제 */
import {
  mockCreateStaff,
  mockRegenerateStaffPin,
  mockStaffListResponse,
  mockUpdateStaff,
  mockUpdateStaffActive,
} from "./mock-staff-data";

function isNetworkError(error: unknown): boolean {
  return error instanceof TypeError;
}
/* MOCK_MODE_END */
export async function apiGetStaff(accessToken: string) {
  /* MOCK_MODE_START */
  try {
  /* MOCK_MODE_END */
  return await request<StaffListResponse>("/api/kds/staff", { headers: createAuthHeaders(accessToken) });
  /* MOCK_MODE_START */
  } catch (error) {
    if (isNetworkError(error)) return mockStaffListResponse;
    throw error;
  }
  /* MOCK_MODE_END */
}
export async function apiCreateStaff(accessToken: string, payload: CreateStaffRequest) {
  /* MOCK_MODE_START */
  try {
  /* MOCK_MODE_END */
  return await request<StaffWithTemporaryPin>("/api/kds/staff", { method: "POST", headers: createAuthHeaders(accessToken), body: JSON.stringify(payload) });
  /* MOCK_MODE_START */
  } catch (error) {
    if (isNetworkError(error)) return mockCreateStaff(payload);
    throw error;
  }
  /* MOCK_MODE_END */
}
export async function apiUpdateStaff(accessToken: string, staffId: number, payload: UpdateStaffRequest) {
  /* MOCK_MODE_START */
  try {
  /* MOCK_MODE_END */
  return await request<Staff>(`/api/kds/staff/${staffId}`, { method: "PATCH", headers: createAuthHeaders(accessToken), body: JSON.stringify(payload) });
  /* MOCK_MODE_START */
  } catch (error) {
    if (isNetworkError(error)) return mockUpdateStaff(staffId, payload);
    throw error;
  }
  /* MOCK_MODE_END */
}
export async function apiUpdateStaffActive(accessToken: string, staffId: number, payload: UpdateStaffActiveRequest) {
  /* MOCK_MODE_START */
  try {
  /* MOCK_MODE_END */
  return await request<Staff>(`/api/kds/staff/${staffId}/active`, { method: "PATCH", headers: createAuthHeaders(accessToken), body: JSON.stringify(payload) });
  /* MOCK_MODE_START */
  } catch (error) {
    if (isNetworkError(error)) return mockUpdateStaffActive(staffId, payload);
    throw error;
  }
  /* MOCK_MODE_END */
}
export async function apiRegenerateStaffPin(accessToken: string, staffId: number) {
  /* MOCK_MODE_START */
  try {
  /* MOCK_MODE_END */
  return await request<RegenerateStaffPinResponse>(`/api/kds/staff/${staffId}/regenerate-pin`, { method: "POST", headers: createAuthHeaders(accessToken) });
  /* MOCK_MODE_START */
  } catch (error) {
    if (isNetworkError(error)) return mockRegenerateStaffPin(staffId);
    throw error;
  }
  /* MOCK_MODE_END */
}
