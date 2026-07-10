import { Info, Pin, PinOff, Trash2 } from "lucide-react";

import { ActionMenu } from "@/components/blocks";
import { Button } from "@/components/ui";

const menuItemClassName =
  "h-10 w-full justify-start gap-2.5 rounded-sm px-3 text-left text-sm font-medium text-foreground/75 hover:bg-muted hover:text-foreground";

type OrderContextMenuProps = {
  canPin: boolean;
  contextMenu: { orderId: number; x: number; y: number } | null;
  isPinned: boolean;
  onClose: () => void;
  onOpenDetail: (orderId: number) => void;
  onOpenRemove: (orderId: number) => void;
  onTogglePinned: (orderId: number) => void;
};

export function OrderContextMenu({
  canPin,
  contextMenu,
  isPinned,
  onClose,
  onOpenDetail,
  onOpenRemove,
  onTogglePinned,
}: OrderContextMenuProps) {
  if (!contextMenu) return null;

  return (
    <ActionMenu
      ariaLabel="주문 작업"
      className="z-50 min-w-[152px] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg"
      onClose={onClose}
      open
      positioning={{ mode: "point", x: contextMenu.x, y: contextMenu.y }}
    >
      <Button className={menuItemClassName} onClick={() => onOpenDetail(contextMenu.orderId)} role="menuitem" type="button" variant="ghost">
        <Info aria-hidden="true" size={18} />
        상세정보
      </Button>
      {canPin ? (
        <Button className={menuItemClassName} onClick={() => onTogglePinned(contextMenu.orderId)} role="menuitem" type="button" variant="ghost">
          {isPinned ? <PinOff aria-hidden="true" size={18} /> : <Pin aria-hidden="true" size={18} />}
          {isPinned ? "고정 해제" : "고정하기"}
        </Button>
      ) : null}
      <Button
        className={`${menuItemClassName} text-destructive hover:bg-destructive/10 hover:text-destructive`}
        onClick={() => onOpenRemove(contextMenu.orderId)}
        role="menuitem"
        type="button"
        variant="ghost"
      >
        <Trash2 aria-hidden="true" size={18} />
        제거
      </Button>
    </ActionMenu>
  );
}
