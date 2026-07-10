import { ConfirmDialog } from "@/components/blocks";

type RemoveOrderDialogProps = {
  open: boolean;
  submitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function RemoveOrderDialog({ open, submitting, onCancel, onConfirm }: RemoveOrderDialogProps) {
  return (
    <ConfirmDialog
      cancelLabel="아니오"
      confirmLabel={submitting ? "처리중…" : "예"}
      confirmVariant="destructive"
      description="주문을 제거하시겠습니까?"
      isPending={submitting}
      open={open}
      title="주문 제거"
      onConfirm={onConfirm}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onCancel();
      }}
    />
  );
}
