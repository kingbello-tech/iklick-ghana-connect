import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary/80 backdrop-blur-xl text-primary-foreground border border-primary/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_4px_16px_rgba(0,0,0,0.1)] hover:bg-primary/90 hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_8px_24px_rgba(0,0,0,0.15)]",
        destructive: "bg-destructive/80 backdrop-blur-xl text-destructive-foreground border border-destructive/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_4px_16px_rgba(0,0,0,0.1)] hover:bg-destructive/90",
        outline: "border border-input/60 bg-background/40 backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] hover:bg-accent/40 hover:text-accent-foreground",
        secondary: "bg-secondary/60 backdrop-blur-xl text-secondary-foreground border border-secondary/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] hover:bg-secondary/80",
        ghost: "hover:bg-accent/40 hover:backdrop-blur-xl hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        hero: "bg-gradient-to-r from-primary/90 to-accent/90 backdrop-blur-xl text-white border border-white/20 shadow-[inset_0_1px_2px_rgba(255,255,255,0.3),0_8px_32px_rgba(0,180,220,0.3)] hover:shadow-[inset_0_1px_2px_rgba(255,255,255,0.4),0_12px_40px_rgba(0,180,220,0.5)] hover:scale-[1.02] transition-all duration-300",
        "hero-outline": "border-2 border-primary/60 text-primary bg-primary/5 backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] hover:bg-primary/15 hover:border-primary hover:shadow-[inset_0_1px_2px_rgba(255,255,255,0.3),0_8px_24px_rgba(0,180,220,0.2)] transition-all duration-300",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
