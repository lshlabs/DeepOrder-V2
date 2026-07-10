import type { HTMLAttributes } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface LoadingStateProps extends HTMLAttributes<HTMLDivElement> {
  label?: string;
  rows?: number;
}

function LoadingState({
  label = "Loading",
  rows = 3,
  className,
  ...props
}: LoadingStateProps) {
  return (
    <div
      className={cn("space-y-3", className)}
      role="status"
      aria-label={label}
      {...props}
    >
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton
          key={index}
          className={cn("h-4 w-full", index === rows - 1 && "w-2/3")}
        />
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
}

export { LoadingState };
export type { LoadingStateProps };
