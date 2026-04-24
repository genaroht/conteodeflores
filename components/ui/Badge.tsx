import { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type BadgeProps = HTMLAttributes<HTMLSpanElement>;

export function Badge({ className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-agrokasa-50 px-3 py-1 text-xs font-bold text-agrokasa-700",
        className
      )}
      {...props}
    />
  );
}