import type { LucideProps } from "lucide-react";
import { Bolt } from "lucide-react";

import { cn } from "@/utils/tailwind";

export function PlaceholderLogo({
  className,
  onlyIcon = false,
  ...props
}: LucideProps & { onlyIcon?: boolean }) {
  if (onlyIcon) {
    return (
      <Bolt
        className={cn("text-primary size-6 shrink-0", className)}
        {...props}
      />
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-1">
      <Bolt
        className={cn("text-primary size-6 shrink-0", className)}
        {...props}
      />
      <span className="text-primary text-sm font-semibold text-nowrap">
        Unknown
      </span>
    </div>
  );
}
