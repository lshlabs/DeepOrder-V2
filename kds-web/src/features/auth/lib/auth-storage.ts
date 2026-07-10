const ACCESS_TOKEN_KEY = "deeporder.accessToken";
const REFRESH_TOKEN_KEY = "deeporder.refreshToken";
const REMEMBERED_LOGIN_ID_KEY = "deeporder.kds.rememberedLoginId";
const AUTO_LOGIN_KEY = "deeporder.kds.autoLogin";

export type TokenStorageMode = "local" | "session";

export type StoredTokens = {
  accessToken: string | null;
  refreshToken: string | null;
  storage: TokenStorageMode | null;
};

export type LoginPreferences = {
  rememberedLoginId: string;
  rememberLoginId: boolean;
  autoLogin: boolean;
};

export function loadStoredTokens(): StoredTokens {
  const localAccessToken = window.localStorage.getItem(ACCESS_TOKEN_KEY);
  const localRefreshToken = window.localStorage.getItem(REFRESH_TOKEN_KEY);
  if (localAccessToken || localRefreshToken) {
    return {
      accessToken: localAccessToken,
      refreshToken: localRefreshToken,
      storage: "local",
    };
  }

  const sessionAccessToken = window.sessionStorage.getItem(ACCESS_TOKEN_KEY);
  const sessionRefreshToken = window.sessionStorage.getItem(REFRESH_TOKEN_KEY);

  return {
    accessToken: sessionAccessToken,
    refreshToken: sessionRefreshToken,
    storage: sessionAccessToken || sessionRefreshToken ? "session" : null,
  };
}

export function loadStoredAccessToken(): string | null {
  return loadStoredTokens().accessToken;
}

export function saveStoredTokens(accessToken: string, refreshToken: string, persistent: boolean) {
  clearStoredTokens();
  const storage = persistent ? window.localStorage : window.sessionStorage;
  storage.setItem(ACCESS_TOKEN_KEY, accessToken);
  storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function saveAccessToken(accessToken: string, storageMode: TokenStorageMode) {
  const storage = storageMode === "local" ? window.localStorage : window.sessionStorage;
  const otherStorage = storageMode === "local" ? window.sessionStorage : window.localStorage;
  storage.setItem(ACCESS_TOKEN_KEY, accessToken);
  otherStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function clearStoredTokens() {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  window.sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function loadLoginPreferences(): LoginPreferences {
  const rememberedLoginId = window.localStorage.getItem(REMEMBERED_LOGIN_ID_KEY) ?? "";

  return {
    rememberedLoginId,
    rememberLoginId: Boolean(rememberedLoginId),
    autoLogin: window.localStorage.getItem(AUTO_LOGIN_KEY) === "true",
  };
}

export function saveLoginPreferences(loginId: string, rememberLoginId: boolean, autoLogin: boolean) {
  if (rememberLoginId) {
    window.localStorage.setItem(REMEMBERED_LOGIN_ID_KEY, loginId);
  } else {
    window.localStorage.removeItem(REMEMBERED_LOGIN_ID_KEY);
  }

  if (autoLogin) {
    window.localStorage.setItem(AUTO_LOGIN_KEY, "true");
  } else {
    window.localStorage.removeItem(AUTO_LOGIN_KEY);
  }
}
