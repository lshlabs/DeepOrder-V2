import type { ReactNode } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

import {
  formatDeliveryAddress,
  formatDetailTime,
  getOrderTypeLabel,
} from "../lib/orderFormatters";
import type { Order } from "../types";

type OrderDetailDialogProps = {
  order: Order | null;
  onClose: () => void;
};

export function OrderDetailDialog({ order, onClose }: OrderDetailDialogProps) {
  if (!order) return null;

  const totalAmount = order.items.reduce((sum, item) => sum + (item.total_price ?? 0), 0);
  const orderedTime = formatDetailTime(order.ordered_at ?? order.created_at);
  const platformLabel = getOrderTypeLabel(order.platform);
  const deliveryAddress = formatDeliveryAddress(order);

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-[480px] overflow-hidden p-0 sm:rounded-lg">
        <DialogHeader className="border-b px-[18px] py-3.5 pr-12 text-left">
          <DialogTitle className="text-[15px] tracking-[-0.2px]">
            주문 #{order.order_number ?? order.id}
          </DialogTitle>
          <DialogDescription className="sr-only">주문 상세정보</DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-[18px] py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex flex-wrap items-center gap-1.5 border-b pb-3.5 pt-0.5 text-sm text-muted-foreground" aria-label="주문 요약">
            <span>{orderedTime}</span>
            <span aria-hidden="true">·</span>
            <span>{platformLabel}</span>
            {totalAmount > 0 ? (
              <>
                <span aria-hidden="true">·</span>
                <strong className="font-bold text-foreground">{totalAmount.toLocaleString()}원</strong>
              </>
            ) : null}
          </div>

          <DetailSection label="주문 메뉴" meta={`${order.items.length}개`}>
            <div className="flex flex-col overflow-hidden rounded-md border bg-muted">
              {order.items.map((item, itemIndex) => (
                <div className="flex flex-col" key={item.id}>
                  <div
                    className={cn(
                      "flex items-start gap-3 bg-card p-4",
                      (itemIndex < order.items.length - 1 || item.options.length > 0) && "border-b",
                    )}
                  >
                    <span className="min-w-[18px] shrink-0 pt-0.5 text-base font-bold leading-tight">
                      {item.quantity}
                    </span>
                    <div className="min-w-0 flex-1 text-[15px] font-bold leading-snug">{item.name}</div>
                    {item.total_price ? (
                      <span className="ml-auto whitespace-nowrap text-sm font-semibold text-foreground/75">
                        {item.total_price.toLocaleString()}원
                      </span>
                    ) : null}
                  </div>
                  {item.options.map((option, optionIndex) => (
                    <div
                      className={cn(
                        "flex items-start gap-2 bg-card px-4 py-3 pl-[34px]",
                        (itemIndex < order.items.length - 1 || optionIndex < item.options.length - 1) && "border-b",
                      )}
                      key={option.id}
                    >
                      <span className="text-[13px] font-semibold text-foreground/75 before:mr-1.5 before:text-[10px] before:text-muted-foreground before:opacity-55 before:content-['└']">
                        {option.label}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </DetailSection>

          <DetailSection label="요청사항">
            <p className={cn("rounded-md bg-muted px-4 py-3.5 text-[13px] leading-relaxed", !order.customer_request && "text-muted-foreground")}>
              {order.customer_request?.trim() || "없음"}
            </p>
          </DetailSection>

          {order.delivery_request ? (
            <DetailSection label="배달 요청">
              <p className="rounded-md bg-muted px-4 py-3.5 text-[13px] leading-relaxed">
                {order.delivery_request}
              </p>
            </DetailSection>
          ) : null}

          <DetailSection label="배송 정보">
            <div className="flex flex-col">
              <div className="flex items-baseline justify-between gap-2.5 border-b py-3">
                <span className="basis-[72px] text-xs font-semibold text-muted-foreground">주소</span>
                <strong className="text-right text-[13px] font-semibold [word-break:break-word]">{deliveryAddress}</strong>
              </div>
              <div className="flex items-baseline justify-between gap-2.5 py-3">
                <span className="basis-[72px] text-xs font-semibold text-muted-foreground">연락처</span>
                <strong className="text-right text-[13px] font-semibold [word-break:break-word]">
                  {order.deliveryPhone ?? "-"}
                </strong>
              </div>
            </div>
          </DetailSection>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type DetailSectionProps = {
  children: ReactNode;
  label: string;
  meta?: string;
};

function DetailSection({ children, label, meta }: DetailSectionProps) {
  return (
    <section className="border-t pt-[18px] first:border-t-0 first:pt-1">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h3 className="text-[13px] font-bold tracking-[-0.02em]">{label}</h3>
        {meta ? <span className="text-xs font-semibold text-muted-foreground">{meta}</span> : null}
      </div>
      {children}
    </section>
  );
}
