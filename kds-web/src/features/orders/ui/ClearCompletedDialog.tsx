import { ConfirmDialog } from "@/components/blocks";

type ClearCompletedDialogProps = {
  open: boolean;
  submitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ClearCompletedDialog({ open, submitting, onCancel, onConfirm }: ClearCompletedDialogProps) {
  return (
    <ConfirmDialog
      cancelLabel="아니오"
      confirmLabel={submitting ? "처리중…" : "예"}
      confirmVariant="destructive"
      description="주문완료 내역을 삭제할까요?"
      isPending={submitting}
      open={open}
      title="완료 내역 정리"
      onConfirm={onConfirm}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onCancel();
      }}
    />
  );
}
