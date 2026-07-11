import * as PopoverPrimitive from "@radix-ui/react-popover";
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = PopoverPrimitive.Trigger;

const popoverContentVariants = cva(
  "z-50 border bg-popover text-popover-foreground outline-none",
  {
    variants: {
      density: {
        default: "w-72 rounded-md p-4 shadow-md",
        compact: "w-72 rounded-panel p-3 shadow-floating",
      },
    },
    defaultVariants: {
      density: "default",
    },
  },
);

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> &
    VariantProps<typeof popoverContentVariants>
>(({ className, align = "center", density, sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        popoverContentVariants({ density }),
        className,
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverContent, PopoverTrigger, popoverContentVariants };
