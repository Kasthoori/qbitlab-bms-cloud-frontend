import type { FC } from "react";

type BmsCardProps = {

    title: string;
    subtitle?: string;
    meta?: string;
    badge?: string;
    onClick?: () => void;
}

const BmsCard:FC<BmsCardProps> = ({ title, subtitle, meta, badge, onClick }) => {

    return (
        <div
          className={[
            "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm",
            "transition hover:shadow-md",
            onClick ? "cursor-pointer hover:border-slate-300" : "",
          ].join(" ")}
          role={onClick ? "button" : undefined}
          tabIndex={onClick ? 0 : undefined}
          onClick={onClick}
          onKeyDown={(e) => {
            if (!onClick) return;
            if (e.key === 'Enter' || e.key === " ")onClick();
          }}
         >
            <h1 className="text-2xl font-bold mb-4">Update Information</h1>
            <div className="flex items-start justify-between gap-3">
                <div>
                <div className="text-lg font-semibold text-slate-900">{title}</div>
                {subtitle && <div className="mt-1 text-sm text-slate-600">{subtitle}</div>}
                {meta && <div className="mt-2 text-xs text-slate-500">{meta}</div>}
                </div>

                {badge ? (
                <div className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                    {badge}
                </div>
                ) : null}
            </div>
        </div>
    );

}

export default BmsCard;