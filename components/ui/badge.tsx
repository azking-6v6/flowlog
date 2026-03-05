import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide", {
  variants: {
    variant: {
      default: "border-transparent bg-primary/90 text-primary-foreground",
      secondary: "border-border/70 bg-muted/55 text-muted-foreground",
      danger: "border-transparent bg-red-600 text-white"
    }
  },
  defaultVariants: {
    variant: "default"
  }
});

export function Badge({ className, variant, ...props }: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
