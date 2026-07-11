import type { ReactNode } from "react";
import { ChefHat } from "lucide-react";

import { cn } from "@/lib/utils";

type AuthShellProps = {
  children: ReactNode;
  contentClassName?: string;
};

export function AuthShell({ children, contentClassName }: AuthShellProps) {
  return (
    <main className="grid min-h-screen grid-cols-1 overflow-x-clip bg-background lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <section
        className="hidden min-h-screen flex-col justify-between border-r border-border bg-surface-2 px-12 py-10 text-foreground lg:flex"
        aria-hidden="true"
      >
        <div className="flex flex-col gap-12">
          <div className="flex items-center gap-2.5">
            <div className="flex size-[30px] items-center justify-center rounded-chip bg-primary text-primary-foreground">
              <ChefHat className="size-4" aria-hidden="true" />
            </div>
            <span className="text-[15px] font-semibold tracking-tight">DeepOrder KDS</span>
          </div>

          <div className="max-w-[360px] space-y-3.5">
            <h1 className="text-5xl font-bold leading-[1.1] tracking-[-0.02em] text-foreground">
              주방을 더
              <br />
              스마트하게
            </h1>
            <p className="text-sm leading-[1.65] text-foreground/70">
              실시간 주문 접수부터 AI 분석까지. 매장 운영에 꼭 필요한 것만 담았습니다.
            </p>
          </div>
        </div>

        <p className="text-xs text-foreground/70">© 2025 DeepOrder. All rights reserved.</p>
      </section>

      <section className="flex min-h-screen items-center overflow-y-auto bg-card px-6 py-10 lg:px-12">
        <div className={cn("mx-auto w-full max-w-[400px]", contentClassName)}>{children}</div>
      </section>
    </main>
  );
}
