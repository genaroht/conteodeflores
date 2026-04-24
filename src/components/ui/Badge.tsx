import { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type BadgeProps = HTMLAttributes<HTMLSpanElement>;

export function Badge({ className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-[#E8F5EE] px-3 py-1 text-xs font-bold text-[#0B7A3B]",
        className
      )}
      {...props}
    />
  );
}