/* eslint-disable react-refresh/only-export-components */
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground border-border",
        // Custom variants for CollegeApp
        success: "border-transparent bg-success-light text-success",
        warning: "border-transparent bg-warning-light text-warning-foreground",
        info: "border-transparent bg-primary-light text-primary",
        // Fit score badges
        safety: "border-transparent bg-success-light text-success font-bold",
        match: "border-transparent bg-primary-light text-primary font-bold",
        reach: "border-transparent bg-warning-light text-warning-foreground font-bold",
        // Status badges
        pending: "border-warning/30 bg-warning-light text-warning-foreground",
        verified: "border-success/30 bg-success-light text-success",
        unverified: "border-border bg-muted text-muted-foreground",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-[10px]",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}

export { Badge, badgeVariants };
