import { useCallback, useEffect, useMemo, useState } from "react";

import { ApiError } from "@/lib/api";

import {
  apiGetCurrentUser,
  apiLogout,
  apiRefresh,
} from "../api/auth-api";
import {
  clearStoredTokens,
  loadStoredTokens,
  saveAccessToken,
  saveStoredTokens,
} from "../lib/auth-storage";
import type {
  AuthPendingInfo,
  AuthResponse,
  AuthSession,
  CurrentUserResponse,
  RegisterResponse,
} from "./types";

type UseAuthSessionOptions = {
  beforeLogout?: (accessToken: string) => Promise<void> | void;
  onSessionCleared?: () => void;
};

export function useAuthSession({ beforeLogout, onSessionCleared }: UseAuthSessionOptions = {}) {
  const [booting, setBooting] = useState(true);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [registeredPending, setRegisteredPending] = useState<RegisterResponse | null>(null);
  const [bootError, setBootError] = useState<string | null>(null);

  const clearSession = useCallback(
    (options: { clearPending?: boolean } = {}) => {
      clearStoredTokens();
      onSessionCleared?.();
      setSession(null);
      if (options.clearPending !== false) {
        setRegisteredPending(null);
      }
    },
    [onSessionCleared],
  );

  const reauthorize = useCallback(
    async (overrideRefreshToken?: string) => {
      const storedTokens = loadStoredTokens();
      const refreshToken = overrideRefreshToken ?? storedTokens.refreshToken;
      if (!refreshToken) {
        clearSession();
        return null;
      }

      try {
        const refreshed = await apiRefresh(refreshToken);
        const persistent = storedTokens.storage === "local";
        saveAccessToken(refreshed.accessToken, persistent ? "local" : "session");
        const current = await apiGetCurrentUser(refreshed.accessToken);
        setSession(createSession(current, refreshed.accessToken, refreshToken, persistent));
        setBootError(null);
        return refreshed.accessToken;
      } catch {
        clearSession();
        return null;
      }
    },
    [clearSession],
  );

  const bootstrapSession = useCallback(async () => {
    const tokens = loadStoredTokens();
    if (!tokens.accessToken) {
      setBooting(false);
      return;
    }

    try {
      const current = await apiGetCurrentUser(tokens.accessToken);
      setSession(
        createSession(
          current,
          tokens.accessToken,
          tokens.refreshToken ?? "",
          tokens.storage === "local",
        ),
      );
      setRegisteredPending(null);
      setBootError(null);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401 && tokens.refreshToken) {
        const nextAccessToken = await reauthorize(tokens.refreshToken);
        if (nextAccessToken) {
          setBooting(false);
          return;
        }
      }

      clearSession();
      setBootError(error instanceof Error ? error.message : "세션을 복원하지 못했습니다.");
    } finally {
      setBooting(false);
    }
  }, [clearSession, reauthorize]);

  useEffect(() => {
    void bootstrapSession();
  }, [bootstrapSession]);

  const handleLoginSuccess = useCallback(
    (response: AuthResponse) => {
      onSessionCleared?.();
      saveStoredTokens(response.accessToken, response.refreshToken, response.autoLogin);
      setSession({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        autoLogin: response.autoLogin,
        user: response.user,
        store: response.store,
      });
      setRegisteredPending(null);
      setBootError(null);
    },
    [onSessionCleared],
  );

  const handleRegisterSuccess = useCallback(
    (response: RegisterResponse) => {
      clearSession({ clearPending: false });
      setRegisteredPending(response);
      setBootError(null);
    },
    [clearSession],
  );

  const handleBackFromPending = useCallback(() => {
    clearSession();
    setBootError(null);
  }, [clearSession]);

  const logout = useCallback(async () => {
    const storedTokens = loadStoredTokens();
    const accessToken = session?.accessToken ?? storedTokens.accessToken;
    const refreshToken = session?.refreshToken ?? storedTokens.refreshToken;

    try {
      if (accessToken) {
        await beforeLogout?.(accessToken);
      }
      if (refreshToken) {
        await apiLogout(refreshToken);
      }
    } catch {
      // Local logout must complete even when server-side cleanup fails.
    } finally {
      clearSession();
    }
  }, [beforeLogout, clearSession, session?.accessToken, session?.refreshToken]);

  const pendingInfo = useMemo<AuthPendingInfo | null>(() => {
    if (registeredPending) {
      return { user: registeredPending.user, store: registeredPending.store };
    }
    if (session && session.user.approvalStatus !== "APPROVED") {
      return { user: session.user, store: session.store };
    }
    return null;
  }, [registeredPending, session]);

  const approvedSession = session?.user.approvalStatus === "APPROVED" ? session : null;

  return {
    booting,
    bootError,
    session: approvedSession,
    pendingInfo,
    handleLoginSuccess,
    handleRegisterSuccess,
    handleBackFromPending,
    logout,
    reauthorize,
  };
}

function createSession(
  current: CurrentUserResponse,
  accessToken: string,
  refreshToken: string,
  autoLogin: boolean,
): AuthSession {
  return {
    accessToken,
    refreshToken,
    autoLogin,
    user: current.user,
    store: current.store,
  };
}
