import type { ReactNode } from "react";
import { BarChart3, Bell, ChefHat, Clock } from "lucide-react";

import { cn } from "@/lib/utils";

const AUTH_HIGHLIGHTS = [
  { icon: Bell, title: "실시간 주문 접수", desc: "여러 채널의 주문을 한 화면에서" },
  { icon: Clock, title: "조리 시간 관리", desc: "지연 주문을 놓치지 않도록" },
  { icon: BarChart3, title: "AI 매출 분석", desc: "데이터로 매장 운영 최적화" },
];

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

          <ul className="space-y-3">
            {AUTH_HIGHLIGHTS.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.title} className="flex items-start gap-3.5">
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-background/10 text-primary">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-background">{item.title}</p>
                    <p className="text-xs leading-5 text-background/55">{item.desc}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <p className="text-xs text-background/55">© 2025 DeepOrder. All rights reserved.</p>
      </section>

      <section className="flex min-h-screen items-center overflow-y-auto bg-card px-6 py-10 md:px-8 lg:px-16">
        <div className={cn("mx-auto w-full max-w-md", contentClassName)}>{children}</div>
      </section>
    </main>
  );
}
