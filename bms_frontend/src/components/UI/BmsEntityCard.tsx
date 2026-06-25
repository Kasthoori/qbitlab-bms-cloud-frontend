import type { ReactNode } from "react";
import { cn } from "../../lib/cn";
import { BmsCard } from "./BmsCard";
import { BmsButton } from "./BmsButton";
import type { BmsButtonVariant } from "./BmsButton";

type BmsEntityStatus = "active" | "inactive" | "warning" | "danger" | "neutral";

type BmsEntityAction = {
  label: ReactNode;
  onClick: () => void;
  variant?: BmsButtonVariant;
  disabled?: boolean;
};

type BmsEntityCardProps = {
  eyebrow: string;
  title: ReactNode;
  icon?: ReactNode;
  statusLabel?: string;
  status?: BmsEntityStatus;
  children?: ReactNode;
  meta?: ReactNode;
  helperText?: ReactNode;
  actions?: BmsEntityAction[];
  className?: string;
};

const statusClasses: Record<BmsEntityStatus, string> = {
  active: "border-emerald-300/25 bg-emerald-400/10 text-emerald-100",
  inactive: "border-slate-300/20 bg-slate-400/10 text-slate-200",
  warning: "border-amber-300/25 bg-amber-400/10 text-amber-100",
  danger: "border-rose-300/25 bg-rose-400/10 text-rose-100",
  neutral: "border-cyan-300/20 bg-cyan-400/10 text-cyan-100",
};

export function BmsEntityCard({
  eyebrow,
  title,
  icon,
  statusLabel,
  status = "neutral",
  children,
  meta,
  helperText,
  actions = [],
  className,
}: BmsEntityCardProps) {
  return (
    <BmsCard
        hover
        className={cn(
            "relative overflow-hidden p-5 sm:p-6",
            "border border-cyan-300/20",
            "bg-[linear-gradient(145deg,rgba(20,31,54,0.92),rgba(15,23,42,0.82)_48%,rgba(49,46,129,0.34))]",
            "shadow-[0_24px_70px_rgba(0,0,0,0.38),inset_0_1px_0_rgba(255,255,255,0.05)]",
            "ring-1 ring-white/5",
            className
        )}
        >
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-cyan-500/10 via-indigo-500/8 to-transparent" />
      <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-cyan-400/12 blur-3xl" />
      <div className="pointer-events-none absolute -left-10 bottom-0 h-28 w-28 rounded-full bg-indigo-400/10 blur-3xl" />

      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            {icon && (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/15 bg-slate-900/55 text-cyan-200 shadow-lg shadow-cyan-950/20">
                {icon}
              </div>
            )}

            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300/75">
                {eyebrow}
              </p>

              <h3 className="mt-1 truncate text-xl font-bold tracking-tight text-slate-100 sm:text-2xl">
                {title}
              </h3>
            </div>
          </div>

          {statusLabel && (
            <span
              className={cn(
                "shrink-0 rounded-full border px-3 py-1 text-xs font-bold",
                statusClasses[status]
              )}
            >
              {statusLabel}
            </span>
          )}
        </div>

        {meta && (
          <div className="mt-5 rounded-2xl border border-slate-300/10 bg-slate-950/32 px-4 py-3 text-sm leading-6 text-slate-300">
            {meta}
          </div>
        )}

        {helperText && (
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
            <span className="text-violet-300">✣</span>
            <span>{helperText}</span>
          </div>
        )}

        {children && <div className="mt-4">{children}</div>}

        {actions.length > 0 && (
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {actions.map((action, index) => (
              <BmsButton
                key={index}
                variant={action.variant ?? "secondary"}
                size="lg"
                onClick={action.onClick}
                disabled={action.disabled}
                className="w-full"
              >
                {action.label}
              </BmsButton>
            ))}
          </div>
        )}
      </div>
    </BmsCard>
  );
}