import { useEffect, useState } from "react";

import {
  Alert,
  AlertDescription,
  Button,
  Input,
  Label,
} from "@/components/ui";
import { API_ORIGIN, ApiError } from "@/lib/api";

import { apiCheckIdentifier, apiRegister } from "../api/auth-api";
import type { RegisterRequest, RegisterResponse } from "../model/types";
import { PasswordField } from "./PasswordField";

const IDENTIFIER_PATTERN = /^[a-z0-9][a-z0-9._-]{3,31}$/;

const defaultForm: RegisterRequest = {
  name: "",
  loginId: "",
  password: "",
  storeName: "",
  storePhone: "",
  zipNo: "",
  roadAddress: "",
  jibunAddress: "",
  addressDetail: "",
};

type SignupFormProps = {
  onSuccess: (response: RegisterResponse) => void;
};

type Hint = {
  type: "success" | "error";
  message: string;
};

export function SignupForm({ onSuccess }: SignupFormProps) {
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [checkingIdentifier, setCheckingIdentifier] = useState(false);
  const [identifierCheckedValue, setIdentifierCheckedValue] = useState<string | null>(null);
  const [identifierHint, setIdentifierHint] = useState<Hint | null>(null);
  const [addressHint, setAddressHint] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== API_ORIGIN) return;
      const data = event.data as { type?: string; payload?: Partial<RegisterRequest> };
      if (data?.type !== "deeporder.juso.selected" || !data.payload) return;

      setForm((current) => ({
        ...current,
        zipNo: data.payload?.zipNo ?? current.zipNo,
        roadAddress: data.payload?.roadAddress ?? current.roadAddress,
        jibunAddress: data.payload?.jibunAddress ?? current.jibunAddress,
        addressDetail: data.payload?.addressDetail ?? current.addressDetail,
      }));
      setAddressHint(null);
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const identifier = form.loginId.trim().toLowerCase();

    if (!IDENTIFIER_PATTERN.test(identifier)) {
      setErrorMessage("아이디는 영문 소문자, 숫자, ., _, - 만 사용해 4~32자로 입력해주세요.");
      return;
    }
    if (identifierCheckedValue !== identifier) {
      setErrorMessage("아이디 중복확인을 완료해주세요.");
      return;
    }

    const hasLetter = /[A-Za-z]/.test(form.password);
    const hasNumber = /\d/.test(form.password);
    if (form.password.length < 8 || !hasLetter || !hasNumber) {
      setErrorMessage("비밀번호는 영문과 숫자를 포함해 8자 이상이어야 합니다.");
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await apiRegister({
        name: form.name.trim(),
        loginId: identifier,
        password: form.password,
        storeName: form.storeName.trim(),
        storePhone: form.storePhone.trim(),
        zipNo: form.zipNo.trim(),
        roadAddress: form.roadAddress.trim(),
        jibunAddress: form.jibunAddress.trim(),
        addressDetail: form.addressDetail.trim(),
      });
      onSuccess(response);
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : "회원가입에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCheckIdentifier() {
    const identifier = form.loginId.trim().toLowerCase();
    setErrorMessage(null);

    if (!IDENTIFIER_PATTERN.test(identifier)) {
      setIdentifierCheckedValue(null);
      setIdentifierHint({
        type: "error",
        message: "아이디는 영문 소문자, 숫자, ., _, - 만 사용해 4~32자로 입력해주세요.",
      });
      return;
    }

    setCheckingIdentifier(true);
    try {
      const result = await apiCheckIdentifier(identifier);
      setIdentifierCheckedValue(result.available ? identifier : null);
      setIdentifierHint({ type: result.available ? "success" : "error", message: result.message });
    } catch (error) {
      setIdentifierCheckedValue(null);
      setIdentifierHint({
        type: "error",
        message: error instanceof ApiError ? error.message : "아이디 중복확인에 실패했습니다.",
      });
    } finally {
      setCheckingIdentifier(false);
    }
  }

  function handleAddressSearch() {
    const popupUrl = `${API_ORIGIN}/api/address/juso-popup?origin=${encodeURIComponent(window.location.origin)}`;
    const popup = window.open(
      popupUrl,
      "deeporder-juso-popup",
      "width=570,height=620,noopener=no,resizable=yes,scrollbars=yes",
    );

    if (!popup) {
      setAddressHint("팝업이 차단되었습니다. 팝업 차단을 해제하고 다시 시도해주세요.");
      return;
    }

    popup.focus();
  }

  const errorId = errorMessage ? "signup-form-error" : undefined;
  const identifierHintId = identifierHint ? "identifier-hint" : undefined;
  const addressHintId = addressHint ? "address-hint" : undefined;

  return (
    <form className="space-y-3.5" onSubmit={handleSubmit} noValidate>
      {errorMessage ? (
        <Alert className="rounded-panel" id={errorId} variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground" htmlFor="registration-name">이름</Label>
        <Input
          id="registration-name"
          density="compact"
          name="name"
          value={form.name}
          placeholder="이름"
          required
          aria-describedby={errorId}
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground" htmlFor="registration-id">아이디</Label>
        <div className="flex gap-2">
          <Input
            id="registration-id"
            className="min-w-0 flex-1"
            autoComplete="username"
            density="compact"
            name="loginId"
            value={form.loginId}
            placeholder="아이디"
            required
            aria-invalid={identifierHint?.type === "error"}
            aria-describedby={[identifierHintId, errorId].filter(Boolean).join(" ") || undefined}
            onChange={(event) => {
              const value = event.target.value;
              setForm((current) => ({ ...current, loginId: value }));
              setIdentifierCheckedValue((current) =>
                current === value.trim().toLowerCase() ? current : null,
              );
              setIdentifierHint(null);
            }}
          />
          <Button
            type="button"
            variant="outline"
            className="shrink-0"
            disabled={checkingIdentifier}
            size="compact"
            onClick={() => void handleCheckIdentifier()}
          >
            {checkingIdentifier ? "확인 중…" : "중복확인"}
          </Button>
        </div>
        {identifierHint ? (
          <Alert
            className={
              identifierHint.type === "success"
                ? "rounded-panel border-success/40 text-success"
                : "rounded-panel"
            }
            id={identifierHintId}
            variant={identifierHint.type === "error" ? "destructive" : "default"}
            role="status"
          >
            <AlertDescription>{identifierHint.message}</AlertDescription>
          </Alert>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground" htmlFor="registration-password">비밀번호</Label>
        <PasswordField
          id="registration-password"
          autoComplete="new-password"
          density="compact"
          minLength={8}
          pattern="(?=.*[A-Za-z])(?=.*\d).{8,}"
          name="password"
          value={form.password}
          placeholder="영문+숫자 8자 이상"
          required
          aria-describedby={errorId}
          onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
        />
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground" htmlFor="store-name">매장명</Label>
          <Input
            id="store-name"
            density="compact"
            name="storeName"
            value={form.storeName}
            placeholder="매장명"
            required
            aria-describedby={errorId}
            onChange={(event) => setForm((current) => ({ ...current, storeName: event.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground" htmlFor="store-phone">연락처</Label>
          <Input
            id="store-phone"
            density="compact"
            name="storePhone"
            value={form.storePhone}
            placeholder="01012345678"
            required
            inputMode="tel"
            aria-describedby={errorId}
            onChange={(event) => setForm((current) => ({ ...current, storePhone: event.target.value }))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground" htmlFor="store-address">매장주소</Label>
        <div className="flex gap-2">
          <Input
            id="store-address"
            className="min-w-0 flex-1"
            density="compact"
            surface="flat"
            name="roadAddress"
            value={form.roadAddress}
            placeholder="주소 검색을 이용해주세요"
            readOnly
            aria-describedby={addressHintId}
          />
          <Button type="button" variant="outline" className="shrink-0" size="compact" onClick={handleAddressSearch}>
            주소 검색
          </Button>
        </div>
        {addressHint ? (
          <Alert className="rounded-panel" id={addressHintId} role="status">
            <AlertDescription>{addressHint}</AlertDescription>
          </Alert>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground" htmlFor="address-detail">상세주소</Label>
        <Input
          id="address-detail"
          density="compact"
          name="addressDetail"
          value={form.addressDetail}
          aria-describedby={errorId}
          onChange={(event) => setForm((current) => ({ ...current, addressDetail: event.target.value }))}
        />
      </div>

      <Button className="w-full" disabled={submitting} size="control" type="submit">
        {submitting ? "신청 중…" : "가입 신청"}
      </Button>
    </form>
  );
}
