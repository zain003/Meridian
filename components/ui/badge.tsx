import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-primary/30 bg-primary/10 text-primary",
        secondary:
          "border-zinc-700/50 bg-zinc-800 text-zinc-300",
        destructive:
          "border-rose-500/20 bg-rose-500/10 text-rose-400",
        warning:
          "border-amber-500/20 bg-amber-500/10 text-amber-400",
        success:
          "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
        info:
          "border-sky-500/20 bg-sky-500/10 text-sky-400",
        outline:
          "border-zinc-800 text-zinc-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
