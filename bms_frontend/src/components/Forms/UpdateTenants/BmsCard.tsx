import type { FC } from "react";

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
    "w-full rounded-2xl px-4 py-3 text-sm font-semibold border transition disabled:opacity-60 disabled:cursor-not-allowed";

  const btnClass = (v?: ActionButton["variant"]) => {
    if (v === "primary") {
      return `${btnBase} bg-slate-900 text-white border-slate-900 hover:bg-slate-800`;
    }
    if (v === "secondary") {
      return `${btnBase} bg-blue-500 text-white border-blue-500 hover:bg-blue-700`;
    }
    if (v === "danger") {
      return `${btnBase} bg-red-600 text-white border-red-600 hover:bg-red-700`;
    }
    return `${btnBase} bg-white text-slate-800 border-slate-300 hover:bg-slate-50`;
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-2xl font-extrabold text-slate-900">{title}</h3>

          {badge && (
            <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {badge}
            </span>
          )}
        </div>

        {subtitle && (
          <div className="mt-2 text-lg font-semibold text-slate-900">
            {subtitle}
          </div>
        )}

        {meta && (
          <div className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600">
            {meta}
          </div>
        )}
      </div>

      {actions.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-3">
          {actions.map((a, i) => (
            <button
              key={`${a.label}-${i}`}
              type="button"
              className={btnClass(a.variant)}
              onClick={a.onClick}
              disabled={a.disabled}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default BmsCard;