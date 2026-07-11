import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";

const inputVariants = cva(
  "flex w-full border border-input bg-background text-sm text-foreground transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      density: {
        default: "h-10 rounded-md px-3 py-2",
        compact: "h-[38px] rounded-control px-[11px] py-2",
      },
      surface: {
        default: "",
        flat: "bg-card",
      },
    },
    defaultVariants: {
      density: "default",
      surface: "default",
    },
  },
);

interface InputProps
  extends React.ComponentProps<"input">,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, density, surface, type, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        inputVariants({ density, surface }),
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export { Input, inputVariants };
export type { InputProps };
