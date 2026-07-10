import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestWithReauth } from "@/lib/api";

import { apiChangePassword } from "../api/settings-api";
import type { ShowToast } from "@/lib/notifications";

type ChangePasswordDialogProps = {
  accessToken: string;
  open: boolean;
  onClose: () => void;
  onLogout: () => Promise<void>;
  onUnauthorized: () => Promise<string | null>;
  showToast: ShowToast;
};

export function ChangePasswordDialog({
  accessToken,
  open,
  onClose,
  onLogout,
  onUnauthorized,
  showToast,
}: ChangePasswordDialogProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setError(null);
      setSubmitting(false);
    }
  }, [open]);

  async function handleSubmit() {
    const current = currentPassword.trim();
    const next = newPassword.trim();
    const confirmation = confirmPassword.trim();

    if (!current) return setError("현재 비밀번호를 입력해주세요.");
    if (next.length < 8) return setError("새 비밀번호는 8자 이상이어야 합니다.");
    if (next !== confirmation) return setError("새 비밀번호 확인이 일치하지 않습니다.");

    setSubmitting(true);
    setError(null);
    try {
      const result = await requestWithReauth(accessToken, onUnauthorized, (nextAccessToken) =>
        apiChangePassword(nextAccessToken, { currentPassword: current, newPassword: next }),
      );
      onClose();
      showToast(result.message, "info");
      await onLogout();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "비밀번호를 변경하지 못했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && !submitting && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>비밀번호 변경</DialogTitle>
          <DialogDescription>변경이 완료되면 현재 세션에서 로그아웃됩니다.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <PasswordField
            autoComplete="current-password"
            id="pw-current"
            label="현재 비밀번호"
            onChange={setCurrentPassword}
            value={currentPassword}
          />
          <PasswordField
            autoComplete="new-password"
            id="pw-new"
            label="새 비밀번호"
            onChange={setNewPassword}
            placeholder="8자 이상"
            value={newPassword}
          />
          <PasswordField
            autoComplete="new-password"
            id="pw-confirm"
            label="새 비밀번호 확인"
            onChange={setConfirmPassword}
            value={confirmPassword}
          />
          {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button disabled={submitting} onClick={onClose} type="button" variant="outline">취소</Button>
          <Button disabled={submitting} onClick={() => void handleSubmit()} type="button">
            {submitting ? "변경 중…" : "변경"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type PasswordFieldProps = {
  autoComplete: string;
  id: string;
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
};

function PasswordField({ autoComplete, id, label, placeholder, value, onChange }: PasswordFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        autoComplete={autoComplete}
        id={id}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type="password"
        value={value}
      />
    </div>
  );
}
