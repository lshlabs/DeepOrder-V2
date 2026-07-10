import { useMemo, useState } from "react";
import { MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";

import { EmptyState, PageHeader, StatusBadge } from "@/components/blocks";
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
import { cn } from "@/lib/utils";
import type { Order } from "@/types";

import { getElapsedMinutes, normalizeAssignedMenuName, parseApiTimestamp } from "../lib/task-formatters";
import type { AssignedMenu } from "../types";

type MenuEditor = { type: "add" } | { type: "edit"; menu: AssignedMenu };

type HistoryRow = {
  orderNumber: string;
  menuName: string;
  quantity: number;
  timestamp: string;
  status: "진행중" | "완료";
  itemId: number;
  delayed: boolean;
};

type TasksPageProps = {
  assignedMenus: AssignedMenu[];
  loading: boolean;
  now: number;
  onCreateAssignedMenu: (menuName: string) => Promise<void>;
  onDeleteAssignedMenu: (menuId: number) => Promise<void>;
  onUpdateAssignedMenu: (menuId: number, menuName: string) => Promise<void>;
  orders: Order[];
  saving: boolean;
};

const DELAY_THRESHOLD_MINUTES = 10;

export function TasksPage({
  assignedMenus,
  loading,
  now,
  onCreateAssignedMenu,
  onDeleteAssignedMenu,
  onUpdateAssignedMenu,
  orders,
  saving,
}: TasksPageProps) {
  const [editor, setEditor] = useState<MenuEditor | null>(null);
  const [menuInput, setMenuInput] = useState("");
  const [menuError, setMenuError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AssignedMenu | null>(null);
  const [selectedMenuId, setSelectedMenuId] = useState<number | null>(null);

  const assignedNames = useMemo(
    () => new Set(assignedMenus.map((menu) => menu.menuName.trim())),
    [assignedMenus],
  );

  const remainingCounts = useMemo(() => {
    const counts = new Map<string, number>();
    assignedMenus.forEach((menu) => counts.set(menu.menuName, 0));
    orders
      .filter((order) => order.status === "NEW" || order.status === "COOKING")
      .forEach((order) => {
        order.items.forEach((item) => {
          const name = item.name.trim();
          if (assignedNames.has(name) && !item.done) {
            counts.set(name, (counts.get(name) ?? 0) + item.quantity);
          }
        });
      });
    return counts;
  }, [assignedMenus, assignedNames, orders]);

  const delayedMenuNames = useMemo(() => {
    const delayed = new Set<string>();
    orders
      .filter((order) => order.status === "NEW" || order.status === "COOKING")
      .forEach((order) => {
        if (getElapsedMinutes(now, order.ordered_at ?? order.created_at) < DELAY_THRESHOLD_MINUTES) return;
        order.items.forEach((item) => {
          if (assignedNames.has(item.name.trim()) && !item.done) delayed.add(item.name.trim());
        });
      });
    return delayed;
  }, [assignedNames, now, orders]);

  const historyRows = useMemo<HistoryRow[]>(() => {
    const selectedName = selectedMenuId
      ? assignedMenus.find((menu) => menu.id === selectedMenuId)?.menuName.trim()
      : null;
    const rows: HistoryRow[] = [];

    orders
      .filter((order) => order.status === "NEW" || order.status === "COOKING" || order.status === "DONE")
      .forEach((order) => {
        const elapsed = getElapsedMinutes(now, order.ordered_at ?? order.created_at);
        const inProgress = order.status === "NEW" || order.status === "COOKING";
        order.items.forEach((item) => {
          const name = item.name.trim();
          if (!assignedNames.has(name) || (selectedName && name !== selectedName)) return;
          const done = order.status === "DONE" || item.done;
          rows.push({
            orderNumber: order.order_number ?? String(order.id),
            menuName: item.name,
            quantity: item.quantity,
            timestamp: order.ordered_at ?? order.created_at,
            status: done ? "완료" : "진행중",
            itemId: item.id,
            delayed: inProgress && !done && elapsed >= DELAY_THRESHOLD_MINUTES,
          });
        });
      });

    return rows.sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime());
  }, [assignedMenus, assignedNames, now, orders, selectedMenuId]);

  const sortedMenus = useMemo(
    () => [...assignedMenus].sort((left, right) =>
      (remainingCounts.get(right.menuName) ?? 0) - (remainingCounts.get(left.menuName) ?? 0),
    ),
    [assignedMenus, remainingCounts],
  );

  const totalActive = Array.from(remainingCounts.values()).reduce((sum, value) => sum + value, 0);
  const selectedMenuName = selectedMenuId
    ? assignedMenus.find((menu) => menu.id === selectedMenuId)?.menuName ?? null
    : null;

  function openAdd() {
    setMenuInput("");
    setMenuError(null);
    setEditor({ type: "add" });
  }

  function openEdit(menu: AssignedMenu) {
    setMenuInput(menu.menuName);
    setMenuError(null);
    setEditor({ type: "edit", menu });
  }

  function closeEditor() {
    if (saving) return;
    setEditor(null);
    setMenuError(null);
  }

  async function saveMenu() {
    const name = menuInput.trim();
    if (!name) return;
    const normalized = normalizeAssignedMenuName(name);
    const duplicate = assignedMenus.some((menu) => {
      if (editor?.type === "edit" && menu.id === editor.menu.id) return false;
      return normalizeAssignedMenuName(menu.menuName) === normalized;
    });
    if (duplicate) return setMenuError("이미 등록된 담당 메뉴입니다.");

    try {
      if (editor?.type === "add") await onCreateAssignedMenu(name);
      if (editor?.type === "edit") await onUpdateAssignedMenu(editor.menu.id, name);
      closeEditor();
    } catch (error) {
      const message = error instanceof Error ? error.message : "담당 메뉴를 저장하지 못했습니다.";
      setMenuError(message.includes("이미 등록된 담당 메뉴") ? "이미 등록된 담당 메뉴입니다." : message);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    await onDeleteAssignedMenu(deleteTarget.id);
    if (selectedMenuId === deleteTarget.id) setSelectedMenuId(null);
    setDeleteTarget(null);
  }

  function formatHistoryTime(timestamp: string) {
    const date = parseApiTimestamp(timestamp);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString("ko-KR", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <main className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <PageHeader
          actions={
            <Button onClick={openAdd} type="button">
              <Plus aria-hidden="true" className="size-4" />
              메뉴 추가
            </Button>
          }
          description={
            assignedMenus.length > 0
              ? `담당 ${assignedMenus.length}개 메뉴 · 진행 중 ${totalActive}건`
              : "담당 메뉴가 없습니다"
          }
          title="내 업무"
        />

        {loading ? (
          <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
            담당 메뉴를 불러오는 중…
          </div>
        ) : assignedMenus.length === 0 ? (
          <EmptyState
            action={<Button onClick={openAdd}>메뉴 추가</Button>}
            description="자주 담당하는 메뉴를 등록하면 진행 중인 주문을 빠르게 확인할 수 있습니다."
            icon={<Plus aria-hidden="true" className="size-6" />}
            title="담당 메뉴가 없습니다"
          />
        ) : (
          <section aria-label="담당 메뉴" className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
            {sortedMenus.map((menu) => {
              const count = remainingCounts.get(menu.menuName) ?? 0;
              const delayed = delayedMenuNames.has(menu.menuName.trim());
              const selected = selectedMenuId === menu.id;
              return (
                <div
                  className={cn(
                    "relative rounded-lg border bg-card p-4 transition-colors",
                    selected && "border-primary bg-primary/5",
                    delayed && "border-destructive/40 bg-destructive/5",
                    count === 0 && "opacity-60",
                  )}
                  key={menu.id}
                >
                  <Button
                    aria-pressed={selected}
                    className="h-auto w-full justify-start p-0 text-left hover:bg-transparent"
                    onClick={() => setSelectedMenuId(selected ? null : menu.id)}
                    type="button"
                    variant="ghost"
                  >
                    <span>
                      <span className={cn("block text-4xl font-extrabold", delayed ? "text-destructive" : "text-primary")}>{count}</span>
                      <span className="mt-1 block truncate text-sm font-medium">{menu.menuName}</span>
                      <span className="mt-1 block text-xs text-muted-foreground">진행 중 수량</span>
                    </span>
                  </Button>
                  {delayed ? <span className="absolute right-10 top-3 size-2 rounded-full bg-destructive" title="지연 주문 있음" /> : null}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        aria-label={`${menu.menuName} 메뉴 옵션`}
                        className="absolute right-2 top-2"
                        size="icon"
                        type="button"
                        variant="ghost"
                      >
                        <MoreVertical aria-hidden="true" className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => openEdit(menu)}>
                        <Pencil aria-hidden="true" /> 수정
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                        onSelect={() => setDeleteTarget(menu)}
                      >
                        <Trash2 aria-hidden="true" /> 삭제
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
          </section>
        )}

        <section className="space-y-3" aria-labelledby="task-history-heading">
          <h2 className="text-sm font-semibold" id="task-history-heading">
            {selectedMenuName ? `주문 내역 — ${selectedMenuName}` : "주문 내역"}
          </h2>
          {historyRows.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              {selectedMenuName ? `'${selectedMenuName}' 관련 주문 내역이 없습니다.` : "관련 주문 내역이 없습니다."}
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>주문번호</TableHead>
                    <TableHead>메뉴</TableHead>
                    <TableHead className="text-center">수량</TableHead>
                    <TableHead className="hidden md:table-cell">주문시각</TableHead>
                    <TableHead className="text-center">상태</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyRows.map((row, index) => (
                    <TableRow className={row.status === "완료" ? "opacity-60" : undefined} key={`${row.itemId}-${index}`}>
                      <TableCell className="text-muted-foreground">{row.orderNumber}</TableCell>
                      <TableCell>
                        <p className="font-medium">{row.menuName}</p>
                        <p className="text-xs text-muted-foreground md:hidden">{formatHistoryTime(row.timestamp)}</p>
                      </TableCell>
                      <TableCell className="text-center font-semibold">{row.quantity}</TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">{formatHistoryTime(row.timestamp)}</TableCell>
                      <TableCell className="text-center">
                        <StatusBadge tone={row.delayed ? "danger" : row.status === "완료" ? "neutral" : "info"}>
                          {row.delayed ? "지연" : row.status}
                        </StatusBadge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>
      </div>

      <Dialog open={editor !== null} onOpenChange={(open) => !open && closeEditor()}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editor?.type === "add" ? "담당 메뉴 추가" : "담당 메뉴 수정"}</DialogTitle>
            <DialogDescription>주문 메뉴명과 동일하게 입력하세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="assigned-menu-name">메뉴명</Label>
            <Input
              autoFocus
              id="assigned-menu-name"
              onChange={(event) => {
                setMenuInput(event.target.value);
                setMenuError(null);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") void saveMenu();
              }}
              placeholder="예: 짜장면"
              value={menuInput}
            />
            {menuError ? <p className="text-sm text-destructive" role="alert">{menuError}</p> : null}
          </div>
          <DialogFooter>
            <Button disabled={saving} onClick={closeEditor} type="button" variant="outline">취소</Button>
            <Button disabled={saving || !menuInput.trim()} onClick={() => void saveMenu()} type="button">
              {saving ? "저장 중…" : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>담당 메뉴를 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.menuName} 항목을 삭제해도 주문 데이터는 삭제되지 않습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>취소</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={saving}
              onClick={(event) => {
                event.preventDefault();
                void confirmDelete();
              }}
            >
              {saving ? "삭제 중…" : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
