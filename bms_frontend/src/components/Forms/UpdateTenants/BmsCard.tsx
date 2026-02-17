import type { FC } from "react";


type ActionButton = {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'danger';
    disabled?: boolean;
};

type BmsCardProps = {
    title: string;
    subtitle?: string;
    meta?: string;
    badge?: string;
    actions?: ActionButton[]; // add action
}

const BmsCard:FC<BmsCardProps> = ({ title, subtitle, meta, actions = [] }) => {

   const btnBase =
    "w-24 px-3 py-2 rounded-full text-sm font-semibold border transition disabled:opacity-60 disabled:cursor-not-allowed";

  const btnClass = (v?: ActionButton["variant"]) => {
    if (v === "primary") return `${btnBase} bg-slate-900 text-white border-slate-900 hover:bg-slate-800`;
    if (v === "secondary") return `${btnBase} bg-blue-500 text-white border-blue-500 hover:bg-blue-700`;
    if (v === "danger") return `${btnBase} bg-red-600 text-white border-red-600 hover:bg-red-700`;
    return `${btnBase} bg-white text-slate-800 border-slate-300 hover:bg-slate-50`;
  };

  return (
    <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-6">
      <div className="flex items-start justify-between gap-4">
        {/* left content */}
        <div className="min-w-0">
          <h3 className="text-2xl font-extrabold text-slate-900">{title}</h3>
          {subtitle && <div className="mt-2 text-lg font-semibold text-slate-900">{subtitle}</div>}
          {meta && <div className="mt-2 text-[11px] text-slate-600 whitespace-pre-line leading-relaxed">{meta}</div>}
        </div>

        {/* right actions (vertical stack) */}
        {actions.length > 0 && (
          <div className="shrink-0 flex flex-col gap-2 items-end">
            {actions.map((a, i) => (
              <button
                key={i}
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
    </div>
  );
}

export default BmsCard;