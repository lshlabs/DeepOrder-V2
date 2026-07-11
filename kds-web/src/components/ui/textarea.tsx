import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const textareaVariants = cva(
  "flex w-full border border-input text-base placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
  {
    variants: {
      density: {
        default: "min-h-[60px] rounded-md bg-transparent px-3 py-2 shadow-sm",
        compact: "min-h-[60px] rounded-control bg-card px-[11px] py-[9px]",
      },
    },
    defaultVariants: {
      density: "default",
    },
  },
)

interface TextareaProps
  extends React.ComponentProps<"textarea">,
    VariantProps<typeof textareaVariants> {}

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  TextareaProps
>(({ className, density, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        textareaVariants({ density }),
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea, textareaVariants }
export type { TextareaProps }
