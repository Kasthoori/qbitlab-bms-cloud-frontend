import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";

type BmsBadgeVariant =
  | "cyan"
  | "purple"
  | "success"
  | "warning"
  | "danger"
  | "neutral";

type BmsBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BmsBadgeVariant;
  children: ReactNode;
};

const variantClasses: Record<BmsBadgeVariant, string> = {
  cyan: "border-sky-400/25 bg-sky-400/12 text-sky-100",
  purple: "border-indigo-400/25 bg-indigo-400/12 text-indigo-100",
  success: "border-emerald-400/25 bg-emerald-400/12 text-emerald-100",
  warning: "border-amber-400/25 bg-amber-400/12 text-amber-100",
  danger: "border-rose-400/25 bg-rose-400/12 text-rose-100",
  neutral: "border-slate-400/20 bg-slate-400/10 text-slate-200",
};

export function BmsBadge({
  variant = "neutral",
  className,
  children,
  ...props
}: BmsBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}