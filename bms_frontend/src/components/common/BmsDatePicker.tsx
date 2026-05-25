import { useRef } from "react";
import { CalendarDays } from "lucide-react";

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  min?: string;
  max?: string;
  helperText?: string;
};

export default function BmsDatePicker({
  label,
  value,
  onChange,
  disabled = false,
  min,
  max,
  helperText,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  function openPicker() {
    if (disabled) return;

    const input = inputRef.current;
    if (!input) return;

    input.focus();

    // Chrome / Edge support showPicker(). Safari/Firefox will simply focus.
    if (typeof input.showPicker === "function") {
      input.showPicker();
    }
  }

  return (
    <label className="block text-xs text-slate-400">
      <span className="mb-1 flex items-center gap-2">
        <CalendarDays className="h-3.5 w-3.5 text-violet-300" />
        {label}
      </span>

      <div className="relative">
        <input
          ref={inputRef}
          type="date"
          value={value}
          min={min}
          max={max}
          disabled={disabled}
          onClick={openPicker}
          onChange={(event) => onChange(event.target.value)}
          className="w-full cursor-pointer rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 pr-10 text-xs text-slate-100 outline-none transition [color-scheme:dark] focus:border-violet-300/50 disabled:cursor-not-allowed disabled:opacity-50"
        />

        <button
          type="button"
          disabled={disabled}
          onClick={openPicker}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-violet-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={`Open ${label} calendar`}
        >
          <CalendarDays className="h-4 w-4" />
        </button>
      </div>

      {helperText && (
        <p className="mt-1 text-[11px] text-slate-500">{helperText}</p>
      )}
    </label>
  );
}