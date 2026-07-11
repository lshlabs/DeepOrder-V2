import type { HTMLAttributes, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const dataTableShellVariants = cva("w-full overflow-hidden border", {
  variants: {
    density: {
      default: "rounded-md",
      compact: "rounded-panel",
    },
  },
  defaultVariants: {
    density: "default",
  },
});

interface DataTableShellProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof dataTableShellVariants> {
  caption?: ReactNode;
  header?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

function DataTableShell({
  caption,
  header,
  children,
  footer,
  density,
  className,
  ...props
}: DataTableShellProps) {
  return (
    <div
      className={cn(dataTableShellVariants({ density }), className)}
      {...props}
    >
      <div className="w-full overflow-x-auto">
        <table className="w-full caption-bottom text-sm">
          {caption ? (
            <caption className="mt-4 text-sm text-muted-foreground">
              {caption}
            </caption>
          ) : null}
          {header ? <thead className="[&_tr]:border-b">{header}</thead> : null}
          <tbody className="[&_tr:last-child]:border-0">{children}</tbody>
          {footer ? (
            <tfoot className="border-t bg-muted/50 font-medium">{footer}</tfoot>
          ) : null}
        </table>
      </div>
    </div>
  );
}

export { DataTableShell, dataTableShellVariants };
export type { DataTableShellProps };
