import type { ReactNode, TextareaHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

type BmsTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: ReactNode;
  helperText?: ReactNode;
  error?: ReactNode;
  wrapperClassName?: string;
};

export function BmsTextarea({
  label,
  helperText,
  error,
  className,
  wrapperClassName,
  id,
  ...props
}: BmsTextareaProps) {
  const textareaId =
    id || (typeof label === "string" ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className={cn("w-full", wrapperClassName)}>
      {label && (
        <label htmlFor={textareaId} className="bms-label">
          {label}
        </label>
      )}

      <textarea
        id={textareaId}
        className={cn("bms-textarea", error ? "border-rose-400/45" : undefined, className)}
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