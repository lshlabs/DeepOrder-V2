import type { HTMLAttributes, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorStateProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: ReactNode;
  description: ReactNode;
  retryLabel?: ReactNode;
  onRetry?: () => void;
}

function ErrorState({
  title,
  description,
  retryLabel = "Retry",
  onRetry,
  className,
  ...props
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-3 rounded-md border border-destructive/40 bg-destructive/5 p-4",
        className,
      )}
      role="alert"
      {...props}
    >
      <div className="space-y-1">
        {title ? (
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        ) : null}
        <p className="text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      {onRetry ? (
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}

export { ErrorState };
export type { ErrorStateProps };
