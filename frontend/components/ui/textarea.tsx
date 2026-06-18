import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn("min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text outline-none transition placeholder:text-faded focus:border-gold", className)}
    {...props}
  />
));
Textarea.displayName = "Textarea";
