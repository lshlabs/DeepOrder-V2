import { createAuthHeaders, request } from "@/lib/api";

import type {
  AuthResponse,
  CurrentUserResponse,
  IdentifierAvailabilityResponse,
  LoginRequest,
  RefreshResponse,
  RegisterRequest,
  RegisterResponse,
} from "../model/types";

/* MOCK_MODE_START: 백엔드 미연결시 mock fallback. 제거하려면 이 import와 각 함수의 catch 블록을 삭제 */
import {
  mockAuthResponse,
  mockCurrentUserResponse,
  mockIdentifierAvailability,
  mockRefreshResponse,
  mockRegisterResponse,
} from "./mock-auth-data";

function isNetworkError(error: unknown): boolean {
  return error instanceof TypeError;
}
/* MOCK_MODE_END */

export async function apiLogin(payload: LoginRequest) {
  /* MOCK_MODE_START */
  try {
  /* MOCK_MODE_END */
  return await request<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  /* MOCK_MODE_START */
  } catch (error) {
    if (isNetworkError(error)) return mockAuthResponse;
    throw error;
  }
  /* MOCK_MODE_END */
}

export async function apiRegister(payload: RegisterRequest) {
  /* MOCK_MODE_START */
  try {
  /* MOCK_MODE_END */
  return await request<RegisterResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  /* MOCK_MODE_START */
  } catch (error) {
    if (isNetworkError(error)) return mockRegisterResponse;
    throw error;
  }
  /* MOCK_MODE_END */
}

export async function apiCheckIdentifier(loginId: string) {
  /* MOCK_MODE_START */
  try {
  /* MOCK_MODE_END */
  return await request<IdentifierAvailabilityResponse>(
    `/api/auth/check-identifier?loginId=${encodeURIComponent(loginId)}`,
  );
  /* MOCK_MODE_START */
  } catch (error) {
    if (isNetworkError(error)) return mockIdentifierAvailability;
    throw error;
  }
  /* MOCK_MODE_END */
}

export async function apiRefresh(refreshToken: string) {
  /* MOCK_MODE_START */
  try {
  /* MOCK_MODE_END */
  return await request<RefreshResponse>("/api/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
  /* MOCK_MODE_START */
  } catch (error) {
    if (isNetworkError(error)) return mockRefreshResponse;
    throw error;
  }
  /* MOCK_MODE_END */
}

export async function apiLogout(refreshToken: string) {
  /* MOCK_MODE_START */
  try {
  /* MOCK_MODE_END */
  await request<void>("/api/auth/logout", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
  /* MOCK_MODE_START */
  } catch (error) {
    if (!isNetworkError(error)) throw error;
  }
  /* MOCK_MODE_END */
}

export async function apiGetCurrentUser(accessToken: string) {
  /* MOCK_MODE_START */
  try {
  /* MOCK_MODE_END */
  return await request<CurrentUserResponse>("/api/auth/me", {
    headers: createAuthHeaders(accessToken),
  });
  /* MOCK_MODE_START */
  } catch (error) {
    if (isNetworkError(error)) return mockCurrentUserResponse;
    throw error;
  }
  /* MOCK_MODE_END */
}
