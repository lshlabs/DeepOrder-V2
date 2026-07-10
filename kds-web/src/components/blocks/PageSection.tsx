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
      spacious: "p-8 pt-0",
    },
  },
  defaultVariants: {
    density: "default",
  },
});

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
          <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-1">
              {title ? <CardTitle>{title}</CardTitle> : null}
              {description ? (
                <CardDescription>{description}</CardDescription>
              ) : null}
            </div>
            {actions ? (
              <div className="flex shrink-0 flex-wrap items-center gap-2">
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
