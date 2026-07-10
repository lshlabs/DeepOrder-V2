import type { AccountType, ApprovalStatus, UserRole } from "@/types";

export type AuthUser = {
  id: number;
  loginId: string;
  name: string;
  role: UserRole;
  accountType?: AccountType | null;
  approvalStatus: ApprovalStatus;
  rejectionReason?: string | null;
};

export type AuthStore = {
  id: number;
  storeId: string;
  storeName: string;
  phone: string | null;
  zipNo: string | null;
  roadAddress: string | null;
  jibunAddress: string | null;
  addressDetail: string | null;
  approvalStatus: ApprovalStatus;
  rejectionReason?: string | null;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  autoLogin: boolean;
  user: AuthUser;
  store: AuthStore;
};

export type CurrentUserResponse = {
  user: AuthUser;
  store: AuthStore;
};

export type RegisterResponse = {
  user: AuthUser;
  store: AuthStore;
};

export type RefreshResponse = {
  accessToken: string;
};

export type IdentifierAvailabilityResponse = {
  available: boolean;
  message: string;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  autoLogin: boolean;
  user: AuthUser;
  store: AuthStore;
};

export type LoginRequest = {
  loginId: string;
  password: string;
  autoLogin: boolean;
};

export type RegisterRequest = {
  name: string;
  loginId: string;
  password: string;
  storeName: string;
  storePhone: string;
  zipNo: string;
  roadAddress: string;
  jibunAddress: string;
  addressDetail: string;
};

export type AuthPendingInfo = {
  user: AuthUser;
  store: AuthStore;
};
