import { X } from "lucide-react";

import { Button } from "../../../../components/ui";
import {
  formatDeliveryAddress,
  formatDetailTime,
  getOrderTypeLabel,
} from "../lib/orderFormatters";
import type { Order } from "../../../../types";

type OrderDetailModalProps = {
  order: Order | null;
  onClose: () => void;
};

export function OrderDetailModal({
  order,
  onClose,
}: OrderDetailModalProps) {
  if (!order) return null;

  const totalAmount = order.items.reduce((sum, item) => sum + (item.total_price ?? 0), 0);
  const orderedTime = order.ordered_at
    ? formatDetailTime(order.ordered_at)
    : formatDetailTime(order.created_at);
  const platformLabel = getOrderTypeLabel(order.platform);
  const deliveryAddress = formatDeliveryAddress(order);

  return (
    <div className="kds-modal-backdrop fixed inset-0 z-[400] flex items-center justify-center bg-black/35 p-5" onClick={onClose}>
      <div className="kds-modal flex max-h-[90vh] w-full max-w-[480px] flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_8px_40px_rgba(0,0,0,0.14)]" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="주문 상세정보">
        <div className="kds-modal-head flex items-center justify-between border-b border-[var(--color-border)] px-[18px] py-[14px]">
          <h2 className="kds-modal-title text-[15px] font-bold tracking-[-0.2px] text-[var(--color-text)]">주문 #{order.order_number ?? order.id}</h2>
          <Button className="kds-modal-close h-[26px] w-[26px] rounded-[var(--radius-sm)] p-0 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]" onClick={onClose} type="button" aria-label="닫기" variant="ghost">
            <X size={13} aria-hidden="true" />
          </Button>
        </div>
        <div className="kds-modal-body flex flex-1 flex-col gap-3 overflow-y-auto px-[18px] py-4 [scrollbar-width:none]">
          <div className="kds-detail-summary flex flex-wrap items-center gap-1.5 border-b border-[var(--color-border)] pb-[14px] pt-0.5 text-[var(--color-text-muted)]" aria-label="주문 요약">
            <span>{orderedTime}</span>
            <span aria-hidden="true">·</span>
            <span>{platformLabel}</span>
            {totalAmount > 0 ? (
              <>
                <span aria-hidden="true">·</span>
                <strong className="text-sm font-bold text-[var(--color-text)]">{totalAmount.toLocaleString()}원</strong>
              </>
            ) : null}
          </div>
          <section className="kds-detail-section pt-[18px]" aria-labelledby="kds-detail-menu-title">
            <div className="kds-detail-section-head mb-3 flex items-baseline justify-between gap-3">
              <div className="kds-detail-section-label text-[13px] font-bold tracking-[-0.02em] text-[var(--color-text)]" id="kds-detail-menu-title">주문 메뉴</div>
              <div className="kds-detail-section-meta text-xs font-semibold text-[var(--color-text-muted)]">{order.items.length}개</div>
            </div>
            <div className="kds-detail-items flex flex-col overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-2)]">
              {order.items.map((item) => (
                <div className="kds-detail-item-group flex flex-col" key={item.id}>
                  <div className="kds-detail-item flex items-start gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                    <span className="kds-detail-item-qty min-w-[18px] shrink-0 pt-0.5 text-base font-bold leading-[1.2] text-[var(--color-text)]">{item.quantity}</span>
                    <div className="kds-detail-item-main min-w-0 flex-1">
                      <div className="kds-detail-item-name text-[15px] font-bold leading-[1.35] text-[var(--color-text)]">{item.name}</div>
                    </div>
                    {item.total_price ? (
                      <span className="kds-detail-item-price ml-auto whitespace-nowrap text-sm font-semibold text-[var(--color-text-subtle)]">{item.total_price.toLocaleString()}원</span>
                    ) : null}
                  </div>
                  {item.options.map((option) => (
                    <div className="kds-detail-item kds-detail-item--option flex items-start gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 pl-[34px]" key={option.id}>
                      <span className="kds-detail-item-qty min-w-[18px] shrink-0 pt-0.5 text-base font-bold leading-[1.2] text-[var(--color-text)]" aria-hidden="true" />
                      <div className="kds-detail-item-main min-w-0 flex-1">
                        <div className="kds-detail-item-name text-[13px] font-semibold text-[var(--color-text-subtle)] before:mr-1.5 before:text-[10px] before:text-[var(--color-text-muted)] before:opacity-55 before:content-['└']">{option.label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>
          <section className="kds-detail-section border-t border-[var(--color-border)] pt-[18px]" aria-labelledby="kds-detail-request-title">
            <div className="kds-detail-section-head mb-3 flex items-baseline justify-between gap-3">
              <div className="kds-detail-section-label text-[13px] font-bold tracking-[-0.02em] text-[var(--color-text)]" id="kds-detail-request-title">요청사항</div>
            </div>
            <p className={`kds-detail-text rounded-[var(--radius-md)] bg-[var(--color-surface-2)] px-4 py-[14px] text-[13px] leading-[1.5]${order.customer_request ? " text-[var(--color-text)]" : " empty text-[var(--color-text-muted)]"}`}>
              {order.customer_request?.trim() || "없음"}
            </p>
          </section>
          {order.delivery_request ? (
            <section className="kds-detail-section border-t border-[var(--color-border)] pt-[18px]" aria-labelledby="kds-detail-delivery-request-title">
              <div className="kds-detail-section-head mb-3 flex items-baseline justify-between gap-3">
                <div className="kds-detail-section-label text-[13px] font-bold tracking-[-0.02em] text-[var(--color-text)]" id="kds-detail-delivery-request-title">배달 요청</div>
              </div>
              <p className="kds-detail-text rounded-[var(--radius-md)] bg-[var(--color-surface-2)] px-4 py-[14px] text-[13px] leading-[1.5] text-[var(--color-text)]">{order.delivery_request}</p>
            </section>
          ) : null}
          <section className="kds-detail-section border-t border-[var(--color-border)] pt-[18px]" aria-labelledby="kds-detail-delivery-title">
            <div className="kds-detail-section-head mb-3 flex items-baseline justify-between gap-3">
              <div className="kds-detail-section-label text-[13px] font-bold tracking-[-0.02em] text-[var(--color-text)]" id="kds-detail-delivery-title">배송 정보</div>
            </div>
            <div className="kds-detail-rows flex flex-col">
              <div className="kds-detail-row flex items-baseline justify-between gap-2.5 border-b border-[var(--color-border)] py-3">
                <span className="basis-[72px] text-xs font-semibold text-[var(--color-text-muted)]">주소</span>
                <strong className="text-right text-[13px] font-semibold text-[var(--color-text)] [word-break:break-word]">{deliveryAddress}</strong>
              </div>
              <div className="kds-detail-row flex items-baseline justify-between gap-2.5 py-3">
                <span className="basis-[72px] text-xs font-semibold text-[var(--color-text-muted)]">연락처</span>
                <strong className="text-right text-[13px] font-semibold text-[var(--color-text)] [word-break:break-word]">{order.deliveryPhone ?? "-"}</strong>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
