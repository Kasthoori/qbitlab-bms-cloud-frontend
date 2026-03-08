import type { FC } from "react";

type ActionVariant = "primary" | "secondary" | "danger";

type CardAction = {
  label: string;
  onClick: () => void;
  variant?: ActionVariant;
  fullWidth?: boolean;
};

type BmsCardProps = {
  title: string;
  subtitle: string;
  meta?: string;
  actions?: CardAction[];
};

function cn(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

const variantClasses: Record<ActionVariant, string> = {
  primary: "border border-slate-900 bg-slate-900 text-white hover:bg-slate-800",
  secondary: "border border-blue-600 bg-blue-600 text-white hover:bg-blue-700",
  danger: "border border-red-600 bg-red-600 text-white hover:bg-red-700",
};

const BmsCard: FC<BmsCardProps> = ({
  title,
  subtitle,
  meta,
  actions = [],
}) => {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="min-w-0">
        <h3 className="text-xl font-bold text-slate-900">{title}</h3>

        <p className="mt-3 break-words text-2xl font-semibold leading-tight text-slate-900">
          {subtitle}
        </p>

        {meta && (
          <div className="mt-4 whitespace-pre-line break-words text-sm leading-7 text-slate-600">
            {meta}
          </div>
        )}
      </div>

      {actions.length > 0 && (
        <div className="mt-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {actions.map((action) => (
              <button
                key={action.label}
                onClick={action.onClick}
                className={cn(
                  "inline-flex min-h-[44px] w-full items-center justify-center rounded-xl px-4 py-2 text-center text-sm font-semibold leading-tight transition",
                  "break-words",
                  variantClasses[action.variant ?? "secondary"],
                  action.fullWidth && "sm:col-span-2"
                )}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BmsCard;