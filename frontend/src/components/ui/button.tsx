import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:bg-[var(--color-primary-disabled)] disabled:text-[var(--color-muted)] [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0 text-claude-button",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-[var(--color-primary-active)]",
        primary: "bg-primary text-primary-foreground hover:bg-[var(--color-primary-active)]",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-border bg-background text-foreground hover:bg-secondary",
        secondary: "bg-background text-foreground border border-border hover:bg-secondary",
        "secondary-on-dark": "bg-[var(--color-surface-dark-elevated)] text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-soft)]",
        ghost: "hover:bg-secondary hover:text-foreground text-foreground",
        link: "text-primary hover:underline",
        "text-link": "text-foreground hover:text-primary transition-colors bg-transparent",
        "icon-circular": "bg-background text-foreground border border-border rounded-full hover:bg-secondary",
      },
      size: {
        default: "h-10 px-[20px] py-[12px] rounded-md",
        sm: "h-8 rounded-sm px-3",
        lg: "h-12 rounded-lg px-8",
        icon: "h-10 w-10 rounded-md",
        circular: "h-[36px] w-[36px] rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
