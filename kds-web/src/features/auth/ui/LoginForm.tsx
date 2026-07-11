import { useEffect, useRef, useState } from "react";

import {
  Alert,
  AlertDescription,
  Button,
  Checkbox,
  Input,
  Label,
} from "@/components/ui";
import { ApiError } from "@/lib/api";

import { apiLogin } from "../api/auth-api";
import {
  loadLoginPreferences,
  saveLoginPreferences,
} from "../lib/auth-storage";
import type { AuthResponse, LoginRequest } from "../model/types";
import { PasswordField } from "./PasswordField";

type LoginFormProps = {
  onSuccess: (response: AuthResponse) => void;
};

const defaultForm: LoginRequest = {
  loginId: "",
  password: "",
  autoLogin: false,
};

function getLoginErrorMessage(error: unknown) {
  if (!(error instanceof ApiError)) return "로그인에 실패했습니다.";
  return error.message === "Invalid loginId or password."
    ? "로그인에 실패했습니다."
    : error.message;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [form, setForm] = useState(defaultForm);
  const [rememberLoginId, setRememberLoginId] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const loginIdRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const preferences = loadLoginPreferences();
    setForm((current) => ({
      ...current,
      loginId: preferences.rememberedLoginId,
      autoLogin: preferences.autoLogin,
    }));
    setRememberLoginId(preferences.rememberLoginId);
    window.setTimeout(() => loginIdRef.current?.focus(), 0);
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    const loginId = form.loginId.trim().toLowerCase();

    try {
      const response = await apiLogin({
        loginId,
        password: form.password,
        autoLogin: form.autoLogin,
      });
      saveLoginPreferences(loginId, rememberLoginId, form.autoLogin);
      onSuccess(response);
    } catch (error) {
      setErrorMessage(getLoginErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  const errorId = errorMessage ? "login-form-error" : undefined;

  return (
    <form className="space-y-3.5" onSubmit={handleSubmit} noValidate>
      {errorMessage ? (
        <Alert className="rounded-panel" id={errorId} variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground" htmlFor="login-id">아이디</Label>
        <Input
          id="login-id"
          ref={loginIdRef}
          autoComplete="username"
          density="compact"
          name="loginId"
          value={form.loginId}
          placeholder="아이디"
          required
          aria-invalid={Boolean(errorMessage)}
          aria-describedby={errorId}
          onChange={(event) => setForm((current) => ({ ...current, loginId: event.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground" htmlFor="login-password">비밀번호 / PIN</Label>
        <PasswordField
          id="login-password"
          autoComplete="current-password"
          density="compact"
          minLength={4}
          name="password"
          value={form.password}
          placeholder="비밀번호 / PIN"
          required
          aria-invalid={Boolean(errorMessage)}
          aria-describedby={errorId}
          onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
        />
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-2.5 pt-0.5">
        <div className="flex items-center gap-2">
          <Checkbox
            id="remember-login-id"
            className="rounded-[5px] border-border"
            checked={rememberLoginId}
            onCheckedChange={(checked) => setRememberLoginId(checked === true)}
          />
          <Label htmlFor="remember-login-id" className="cursor-pointer text-sm font-normal text-muted-foreground">
            아이디 저장
          </Label>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="auto-login"
            className="rounded-[5px] border-border"
            checked={form.autoLogin}
            onCheckedChange={(checked) =>
              setForm((current) => ({ ...current, autoLogin: checked === true }))
            }
          />
          <Label htmlFor="auto-login" className="cursor-pointer text-sm font-normal text-muted-foreground">
            자동 로그인
          </Label>
        </div>
      </div>

      <Button className="w-full" disabled={submitting} size="control" type="submit">
        {submitting ? "로그인 중…" : "로그인"}
      </Button>
    </form>
  );
}
