/* MOCK_MODE: 백엔드 미연결시 사용하는 mock 데이터. 제거하려면 이 파일과 auth-api.ts의 networkError 핸들링 부분을 함께 삭제 */
import type {
  AuthResponse,
  CurrentUserResponse,
  IdentifierAvailabilityResponse,
  RefreshResponse,
  RegisterResponse,
} from "../model/types";

export const MOCK_OWNER_CREDENTIALS = { loginId: "admin123", password: "admin123!" };

export const mockAuthResponse: AuthResponse = {
  accessToken: "mock-access-token",
  refreshToken: "mock-refresh-token",
  autoLogin: false,
  user: {
    id: 1,
    loginId: "admin123",
    name: "테스트 점주",
    role: "STORE_OWNER",
    accountType: "OWNER",
    approvalStatus: "APPROVED",
  },
  store: {
    id: 1,
    storeId: "MOCK-STORE-001",
    storeName: "테스트 매장",
    phone: "01012345678",
    zipNo: "04524",
    roadAddress: "서울시 중구 을지로 1",
    jibunAddress: "서울시 중구 을지로동 1",
    addressDetail: "101호",
    approvalStatus: "APPROVED",
  },
};

export const mockRegisterResponse: RegisterResponse = {
  user: {
    id: 2,
    loginId: "new-user",
    name: "신규 가입자",
    role: "STORE_OWNER",
    accountType: "OWNER",
    approvalStatus: "PENDING_APPROVAL",
  },
  store: {
    id: 2,
    storeId: "MOCK-STORE-002",
    storeName: "신규 매장",
    phone: "01087654321",
    zipNo: "03154",
    roadAddress: "서울시 종로구 종로 1",
    jibunAddress: "서울시 종로구 종로1가 1",
    addressDetail: "202호",
    approvalStatus: "PENDING_APPROVAL",
  },
};

export const mockRefreshResponse: RefreshResponse = {
  accessToken: "mock-refreshed-access-token",
};

export const mockCurrentUserResponse: CurrentUserResponse = {
  user: {
    id: 1,
    loginId: "admin123",
    name: "테스트 점주",
    role: "STORE_OWNER",
    accountType: "OWNER",
    approvalStatus: "APPROVED",
  },
  store: {
    id: 1,
    storeId: "MOCK-STORE-001",
    storeName: "테스트 매장",
    phone: "01012345678",
    zipNo: "04524",
    roadAddress: "서울시 중구 을지로 1",
    jibunAddress: "서울시 중구 을지로동 1",
    addressDetail: "101호",
    approvalStatus: "APPROVED",
  },
};

export const mockIdentifierAvailability: IdentifierAvailabilityResponse = {
  available: true,
  message: "사용 가능한 아이디입니다.",
};
