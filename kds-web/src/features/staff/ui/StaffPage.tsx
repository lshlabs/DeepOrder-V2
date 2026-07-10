import { useCallback, useEffect, useMemo, useState } from "react";
import { MoreVertical, Plus } from "lucide-react";

import { EmptyState, ErrorState, LoadingState, PageHeader, StatusBadge } from "@/components/blocks";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AuthSession } from "@/features/auth";
import { requestWithReauth } from "@/lib/api";

import {
  apiCreateStaff,
  apiGetStaff,
  apiRegenerateStaffPin,
  apiUpdateStaff,
  apiUpdateStaffActive,
} from "../api/staff-api";

import type { Staff } from "../types";

type StaffEditorMode =
  | { type: "add" }
  | { type: "edit"; member: Staff }
  | { type: "created"; member: Staff; temporaryPin: string };

type StaffPageProps = {
  session: AuthSession;
  onUnauthorized: () => Promise<string | null>;
};

const EMPTY_FORM = { name: "", loginId: "", role: "직원" };

export function StaffPage({ session, onUnauthorized }: StaffPageProps) {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editor, setEditor] = useState<StaffEditorMode | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<Staff | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [revealedPins, setRevealedPins] = useState<Record<number, string>>({});

  const fetchStaff = useCallback(async () => {
    const data = await requestWithReauth(session.accessToken, onUnauthorized, apiGetStaff);
    setStaffList(data.staff);
  }, [onUnauthorized, session.accessToken]);

  useEffect(() => {
    void fetchStaff()
      .catch((fetchError) => {
        setError(fetchError instanceof Error ? fetchError.message : "직원 목록을 불러오지 못했습니다.");
      })
      .finally(() => setLoading(false));
  }, [fetchStaff]);

  const activeCount = useMemo(
    () => staffList.filter((member) => member.active).length,
    [staffList],
  );

  function openAdd() {
    setForm(EMPTY_FORM);
    setError(null);
    setRevealedPins({});
    setEditor({ type: "add" });
  }

  function openEdit(member: Staff) {
    setForm({
      name: member.name,
      loginId: member.loginId,
      role: member.positionLabel ?? "직원",
    });
    setError(null);
    setRevealedPins({});
    setEditor({ type: "edit", member });
  }

  function closeEditor() {
    if (saving) return;
    setEditor(null);
    setError(null);
  }

  async function saveStaff() {
    const name = form.name.trim();
    const loginId = form.loginId.trim().toLowerCase();
    if (!name) return setError("이름을 입력하세요.");
    if (!/^[a-z0-9][a-z0-9._-]{3,31}$/.test(loginId)) {
      return setError("아이디는 영문 소문자, 숫자, ., _, - 만 사용해 4~32자로 입력해주세요.");
    }

    setSaving(true);
    setError(null);
    try {
      if (editor?.type === "add") {
        const created = await requestWithReauth(session.accessToken, onUnauthorized, (token) =>
          apiCreateStaff(token, {
            name,
            loginId,
            positionLabel: form.role,
          }),
        );
        setRevealedPins({ [created.id]: created.temporaryPin });
        setEditor({ type: "created", member: created, temporaryPin: created.temporaryPin });
      } else if (editor?.type === "edit") {
        await requestWithReauth(session.accessToken, onUnauthorized, (token) =>
          apiUpdateStaff(token, editor.member.id, {
            name,
            loginId,
            positionLabel: form.role,
          }),
        );
        setEditor(null);
      }
      await fetchStaff();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "직원 정보를 저장하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function reissuePin(member: Staff) {
    setSaving(true);
    setError(null);
    try {
      const result = await requestWithReauth(session.accessToken, onUnauthorized, (token) =>
        apiRegenerateStaffPin(token, member.id),
      );
      setRevealedPins({ [member.id]: result.temporaryPin });
      await fetchStaff();
    } catch (pinError) {
      setError(pinError instanceof Error ? pinError.message : "PIN을 재발급하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(member: Staff) {
    setSaving(true);
    setError(null);
    try {
      await requestWithReauth(session.accessToken, onUnauthorized, (token) =>
        apiUpdateStaffActive(token, member.id, { active: !member.active }),
      );
      setDeactivateTarget(null);
      await fetchStaff();
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "직원 상태를 변경하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <PageHeader
          actions={
            <Button disabled={saving} onClick={openAdd} type="button">
              <Plus aria-hidden="true" className="size-4" />
              직원 추가
            </Button>
          }
          description={`총 ${staffList.length}명 · 활성 ${activeCount}명`}
          title="직원 관리"
        />

        {error && !editor ? (
          <ErrorState
            description={error}
            onRetry={() => void fetchStaff()}
            retryLabel="다시 시도"
            title="직원 정보를 불러오지 못했습니다"
          />
        ) : null}

        {loading ? (
          <LoadingState label="직원 목록을 불러오는 중입니다." rows={6} />
        ) : staffList.length === 0 ? (
          <EmptyState
            action={<Button onClick={openAdd}>직원 추가</Button>}
            description="직원을 등록하면 KDS 접근 권한과 역할을 관리할 수 있습니다."
            icon={<Plus aria-hidden="true" className="size-6" />}
            title="등록된 직원이 없습니다"
          />
        ) : (
          <div className="overflow-hidden rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-52">직원</TableHead>
                  <TableHead className="hidden md:table-cell">아이디</TableHead>
                  <TableHead className="text-center">역할</TableHead>
                  <TableHead className="text-center">상태</TableHead>
                  <TableHead className="w-16 text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffList.map((member) => (
                  <TableRow className={!member.active ? "opacity-60" : undefined} key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                          {member.name.slice(0, 1)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{member.name}</p>
                          <p className="truncate text-xs text-muted-foreground md:hidden">
                            {member.loginId} · {member.positionLabel ?? "직원"}
                          </p>
                          {revealedPins[member.id] ? (
                            <p className="mt-1 text-xs font-semibold text-primary">
                              임시 PIN: {revealedPins[member.id]}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {member.loginId}
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusBadge tone={member.positionLabel === "매니저" ? "info" : "neutral"}>
                        {member.positionLabel ?? "직원"}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusBadge tone={member.active ? "success" : "neutral"}>
                        {member.active ? "활성" : "비활성"}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-label={`${member.name} 작업 메뉴`} size="icon" type="button" variant="ghost">
                            <MoreVertical aria-hidden="true" className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => openEdit(member)}>정보 수정</DropdownMenuItem>
                          <DropdownMenuItem disabled={saving} onSelect={() => void reissuePin(member)}>
                            PIN 재발급
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className={member.active ? "text-destructive focus:bg-destructive/10 focus:text-destructive" : undefined}
                            disabled={saving}
                            onSelect={() => {
                              if (member.active) setDeactivateTarget(member);
                              else void toggleActive(member);
                            }}
                          >
                            {member.active ? "비활성화" : "활성화"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={editor !== null} onOpenChange={(open) => !open && closeEditor()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editor?.type === "add"
                ? "직원 추가"
                : editor?.type === "edit"
                  ? "직원 정보 수정"
                  : "직원 등록 완료"}
            </DialogTitle>
            <DialogDescription>
              {editor?.type === "created"
                ? "아래 임시 PIN을 직원에게 안전하게 전달하세요."
                : "직원 계정의 이름, 아이디와 역할을 입력합니다."}
            </DialogDescription>
          </DialogHeader>

          {editor?.type === "created" ? (
            <div className="rounded-lg border bg-muted/50 p-4 text-center">
              <p className="text-sm text-muted-foreground">{editor.member.name} 임시 PIN</p>
              <p className="mt-2 text-3xl font-bold tracking-[0.35em] text-primary">
                {editor.temporaryPin}
              </p>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <Field
                id="staff-name"
                label="이름"
                onChange={(value) => setForm((previous) => ({ ...previous, name: value }))}
                value={form.name}
              />
              <Field
                id="staff-login-id"
                label="아이디"
                onChange={(value) => setForm((previous) => ({ ...previous, loginId: value }))}
                value={form.loginId}
              />
              <Field
                id="staff-role"
                label="역할"
                onChange={(value) => setForm((previous) => ({ ...previous, role: value }))}
                value={form.role}
              />
              {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
            </div>
          )}

          <DialogFooter>
            {editor?.type === "created" ? (
              <Button onClick={closeEditor} type="button">확인</Button>
            ) : (
              <>
                <Button disabled={saving} onClick={closeEditor} type="button" variant="outline">취소</Button>
                <Button disabled={saving} onClick={() => void saveStaff()} type="button">
                  {saving ? "저장 중…" : "저장"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deactivateTarget !== null} onOpenChange={(open) => !open && setDeactivateTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>직원 계정을 비활성화할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              {deactivateTarget?.name} 계정은 비활성화 후 KDS에 로그인할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>취소</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={saving}
              onClick={(event) => {
                event.preventDefault();
                if (deactivateTarget) void toggleActive(deactivateTarget);
              }}
            >
              {saving ? "처리 중…" : "비활성화"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

type FieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
};

function Field({ id, label, value, onChange }: FieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} onChange={(event) => onChange(event.target.value)} value={value} />
    </div>
  );
}
