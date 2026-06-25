import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";

export type BmsButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success" | "warning";

export type BmsButtonSize = "sm" | "md" | "lg";

type BmsButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: BmsButtonVariant;
  size?: BmsButtonSize;
  children: ReactNode;
};

const baseButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold " +
  "transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50";

const sizeClasses: Record<BmsButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
  lg: "px-5 py-3 text-sm",
};

const variantClasses: Record<BmsButtonVariant, string> = {
  primary:
  "border border-cyan-300/30 bg-cyan-500/18 text-cyan-50 " +
  "shadow-[0_10px_24px_rgba(8,145,178,0.12)] backdrop-blur-xl " +
  "hover:-translate-y-0.5 hover:border-cyan-200/45 hover:bg-cyan-400/24 " +
  "hover:shadow-[0_14px_30px_rgba(8,145,178,0.18)]",

  secondary:
    "border border-sky-400/30 bg-slate-950/60 text-sky-100 hover:bg-sky-400/10 hover:border-sky-300/45",

  ghost:
    "border border-slate-400/15 bg-slate-950/35 text-slate-300 hover:bg-slate-800/60 hover:border-slate-300/25",

  danger:
    "border border-rose-400/25 bg-rose-500/12 text-rose-200 hover:bg-rose-500/18",

  success:
    "border border-emerald-400/25 bg-emerald-500/12 text-emerald-200 hover:bg-emerald-500/18",

   warning:
    "border border-amber-300/30 bg-amber-400/10 text-amber-100 hover:bg-amber-400/20",
};

export function BmsButton({
  variant = "primary",
  size = "md",
  className,
  children,
  type = "button",
  ...props
}: BmsButtonProps) {
  return (
    <button
      type={type}
      className={cn(baseButtonClass, variantClasses[variant], sizeClasses[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}