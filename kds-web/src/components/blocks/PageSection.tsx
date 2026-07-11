import type { HTMLAttributes, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const pageSectionContentVariants = cva("", {
  variants: {
    density: {
      default: "p-6 pt-0",
      compact: "p-4 pt-0",
      dense: "p-3 pt-0",
      spacious: "p-8 pt-0",
    },
  },
  defaultVariants: {
    density: "default",
  },
});

const pageSectionHeaderVariants = cva(
  "flex flex-col space-y-0 sm:flex-row sm:items-start sm:justify-between",
  {
    variants: {
      density: {
        default: "gap-3",
        compact: "gap-2.5",
        dense: "gap-2",
        spacious: "gap-4",
      },
    },
    defaultVariants: {
      density: "default",
    },
  },
);

interface PageSectionProps
  extends Omit<HTMLAttributes<HTMLElement>, "title">,
    VariantProps<typeof pageSectionContentVariants> {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}

function PageSection({
  title,
  description,
  actions,
  children,
  density,
  className,
  ...props
}: PageSectionProps) {
  const hasHeader = title || description || actions;

  return (
    <section className={className} {...props}>
      <Card>
        {hasHeader ? (
          <CardHeader className={pageSectionHeaderVariants({ density })}>
            <div className={cn("min-w-0", density === "dense" ? "space-y-0.5" : "space-y-1")}>
              {title ? <CardTitle>{title}</CardTitle> : null}
              {description ? (
                <CardDescription>{description}</CardDescription>
              ) : null}
            </div>
            {actions ? (
              <div className={cn("flex shrink-0 flex-wrap items-center", density === "dense" ? "gap-1.5" : "gap-2")}>
                {actions}
              </div>
            ) : null}
          </CardHeader>
        ) : null}
        <CardContent
          className={cn(
            pageSectionContentVariants({ density }),
            !hasHeader && "pt-6",
          )}
        >
          {children}
        </CardContent>
      </Card>
    </section>
  );
}

export { PageSection, pageSectionContentVariants };
export type { PageSectionProps };
