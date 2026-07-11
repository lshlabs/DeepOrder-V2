import type { HTMLAttributes, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const pageHeaderVariants = cva(
  "flex flex-col sm:flex-row sm:items-start sm:justify-between",
  {
    variants: {
      density: {
        default: "gap-4",
        compact: "gap-3",
      },
    },
    defaultVariants: {
      density: "default",
    },
  },
);

interface PageHeaderProps
  extends Omit<HTMLAttributes<HTMLElement>, "title">,
    VariantProps<typeof pageHeaderVariants> {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}

function PageHeader({
  title,
  description,
  actions,
  density,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        pageHeaderVariants({ density }),
        className,
      )}
      {...props}
    >
      <div className={cn("min-w-0", density === "compact" ? "space-y-0.5" : "space-y-1")}>
        <h1 className={cn("font-semibold leading-tight text-foreground", density === "compact" ? "text-[1.375rem]" : "text-2xl")}>
          {title}
        </h1>
        {description ? (
          <p className={cn("text-sm text-muted-foreground", density === "compact" ? "leading-5" : "leading-6")}>
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className={cn("flex shrink-0 flex-wrap items-center", density === "compact" ? "gap-1.5" : "gap-2")}>
          {actions}
        </div>
      ) : null}
    </header>
  );
}

export { PageHeader, pageHeaderVariants };
export type { PageHeaderProps };
