import type { ReactNode } from "react";
import { ChefHat } from "lucide-react";

import { cn } from "@/lib/utils";

type AuthShellProps = {
  children: ReactNode;
  contentClassName?: string;
};

export function AuthShell({ children, contentClassName }: AuthShellProps) {
  return (
    <main className="grid min-h-screen grid-cols-1 overflow-hidden bg-background lg:grid-cols-2">
      <section
        className="hidden min-h-screen flex-col justify-between border-r border-border bg-foreground px-12 py-10 text-background lg:flex"
        aria-hidden="true"
      >
        <div className="flex flex-col gap-12">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <ChefHat className="size-4" aria-hidden="true" />
            </div>
            <span className="text-sm font-semibold tracking-tight">DeepOrder KDS</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-5xl font-bold leading-[1.1] tracking-tight">
              주방을 더
              <br />
              스마트하게
            </h1>
            <p className="max-w-md text-sm leading-7 text-background/65">
              실시간 주문 접수부터 AI 분석까지. 매장 운영에 꼭 필요한 것만 담았습니다.
            </p>
          </div>
        </div>

        <p className="text-xs text-background/55">© 2025 DeepOrder. All rights reserved.</p>
      </section>

      <section className="flex min-h-screen items-center overflow-y-auto bg-card px-6 py-10 md:px-8 lg:px-16">
        <div className={cn("mx-auto w-full max-w-md", contentClassName)}>{children}</div>
      </section>
    </main>
  );
}
