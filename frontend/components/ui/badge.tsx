import { cn } from "@/lib/utils";

const variants = {
  default: "border-gold-mid bg-gold-soft text-gold",
  success: "border-success-soft bg-success-soft text-success",
  danger: "border-danger-soft bg-danger-soft text-danger",
  info: "border-info-soft bg-info-soft text-info",
  violet: "border-violet-soft bg-violet-soft text-violet",
  muted: "border-border bg-elevated text-muted"
};

export function Badge({ className, variant = "default", ...props }: React.HTMLAttributes<HTMLSpanElement> & { variant?: keyof typeof variants }) {
  return <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium", variants[variant], className)} {...props} />;
}
