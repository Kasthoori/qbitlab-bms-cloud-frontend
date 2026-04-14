import type { FC } from "react";
import { ArrowRight, Building2, Sparkles } from "lucide-react";

type ActionButton = {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
};

type BmsCardProps = {
  title: string;
  subtitle?: string;
  meta?: string;
  badge?: string;
  actions?: ActionButton[];
};

const BmsCard: FC<BmsCardProps> = ({
  title,
  subtitle,
  meta,
  badge,
  actions = [],
}) => {
  const btnBase =
    "w-full rounded-2xl px-4 py-3 text-sm font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed";

  const btnClass = (v?: ActionButton["variant"]) => {
    if (v === "primary") {
      return `${btnBase} bg-white/5 border border-white/10 text-white hover:bg-white/10`;
    }

    if (v === "secondary") {
      return `${btnBase} bg-gradient-to-r from-blue-500 to-cyan-500 text-white border border-transparent hover:scale-[1.01]`;
    }

    if (v === "danger") {
      return `${btnBase} bg-rose-500/90 text-white border border-rose-400/20 hover:bg-rose-500`;
    }

    return `${btnBase} bg-white/5 border border-white/10 text-slate-200 hover:bg-white/10`;
  };

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.16),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.12),transparent_28%)] opacity-90" />

      <div className="relative min-w-0">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-blue-300">
              <Building2 className="h-5 w-5" />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                {title}
              </p>
              {subtitle && (
                <h3 className="mt-1 text-2xl font-bold leading-tight text-white">
                  {subtitle}
                </h3>
              )}
            </div>
          </div>

          {badge && (
            <span className="shrink-0 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
              {badge}
            </span>
          )}
        </div>

        {meta && (
          <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4 text-sm leading-relaxed text-slate-300">
            {meta}
          </div>
        )}

        <div className="mt-5 flex items-center gap-2 text-xs text-slate-400">
          <Sparkles className="h-4 w-4 text-purple-300" />
          AI-ready tenant workspace
        </div>
      </div>

      {actions.length > 0 && (
        <div className="relative mt-6 grid grid-cols-2 gap-3">
          {actions.map((a, i) => (
            <button
              key={`${a.label}-${i}`}
              type="button"
              className={btnClass(a.variant)}
              onClick={a.onClick}
              disabled={a.disabled}
            >
              <span className="inline-flex items-center justify-center gap-2">
                {a.label}
                {a.variant === "secondary" ? (
                  <ArrowRight className="h-4 w-4" />
                ) : null}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default BmsCard;