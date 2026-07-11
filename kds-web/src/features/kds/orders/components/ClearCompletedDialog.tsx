import { Button } from "../../../../components/ui";

type ClearCompletedDialogProps = {
  open: boolean;
  submitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ClearCompletedDialog({
  open,
  submitting,
  onCancel,
  onConfirm,
}: ClearCompletedDialogProps) {
  if (!open) return null;

  return (
    <div className="kds-modal-backdrop fixed inset-0 z-[400] flex items-center justify-center bg-black/35 p-5" onClick={onCancel}>
      <div className="kds-modal kds-modal--sm flex w-full max-w-[340px] flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_8px_40px_rgba(0,0,0,0.14)]" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="kds-modal-head flex items-center justify-between border-b border-[var(--color-border)] px-[18px] py-[14px]">
          <h2 className="kds-modal-title text-[15px] font-bold tracking-[-0.2px] text-[var(--color-text)]">완료 내역 정리</h2>
        </div>
        <div className="kds-modal-body flex flex-1 flex-col gap-3 overflow-y-auto px-[18px] py-4 [scrollbar-width:none]">
          <p className="kds-modal-desc text-sm leading-[1.65] text-[var(--color-text)]">주문완료 내역을 삭제할까요?</p>
        </div>
        <div className="kds-modal-foot flex justify-end gap-1.5 border-t border-[var(--color-border)] px-[14px] py-[11px]">
          <Button className="kds-modal-btn secondary h-[34px] rounded-[var(--radius-md)] px-[14px] text-[13px] font-semibold" onClick={onCancel} type="button" variant="outline">아니오</Button>
          <Button
            className="kds-modal-btn danger h-[34px] rounded-[var(--radius-md)] px-[14px] text-[13px] font-semibold"
            disabled={submitting}
            onClick={onConfirm}
            type="button"
            variant="destructive"
          >{submitting ? "처리중…" : "예"}</Button>
        </div>
      </div>
    </div>
  );
}
