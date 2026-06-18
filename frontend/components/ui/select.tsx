import * as React from "react";
import { cn } from "@/lib/utils";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn("h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-text outline-none transition focus:border-gold", className)}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";
