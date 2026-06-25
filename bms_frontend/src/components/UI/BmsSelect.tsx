import type { ReactNode, SelectHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

type BmsSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: ReactNode;
  helperText?: ReactNode;
  error?: ReactNode;
  wrapperClassName?: string;
  children: ReactNode;
};

export function BmsSelect({
  label,
  helperText,
  error,
  className,
  wrapperClassName,
  id,
  children,
  ...props
}: BmsSelectProps) {
  const selectId =
    id || (typeof label === "string" ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className={cn("w-full", wrapperClassName)}>
      {label && (
        <label htmlFor={selectId} className="bms-label">
          {label}
        </label>
      )}

      <div className="relative">
        <select
          id={selectId}
          className={cn("bms-select pr-10", error ? "border-rose-400/45" : "", className)}
          {...props}
        >
          {children}
        </select>

        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
          ▾
        </span>
      </div>

      {error ? (
        <p className="mt-1.5 text-xs font-medium text-rose-300">{error}</p>
      ) : helperText ? (
        <p className="mt-1.5 text-xs text-slate-400">{helperText}</p>
      ) : null}
    </div>
  );
}