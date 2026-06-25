import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";

type BmsInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: ReactNode;
  helperText?: ReactNode;
  error?: ReactNode;
  wrapperClassName?: string;
};

export function BmsInput({
  label,
  helperText,
  error,
  className,
  wrapperClassName,
  id,
  ...props
}: BmsInputProps) {
  const inputId =
    id || (typeof label === "string" ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className={cn("w-full", wrapperClassName)}>
      {label && (
        <label htmlFor={inputId} className="bms-label">
          {label}
        </label>
      )}

      <input
        id={inputId}
        className={cn("bms-input", error ? "border-rose-400/45" : "", className)}
        {...props}
      />

      {error ? (
        <p className="mt-1.5 text-xs font-medium text-rose-300">{error}</p>
      ) : helperText ? (
        <p className="mt-1.5 text-xs text-slate-400">{helperText}</p>
      ) : null}
    </div>
  );
}