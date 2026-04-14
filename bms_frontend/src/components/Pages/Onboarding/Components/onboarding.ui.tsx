import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from "react";
import { Check } from "lucide-react";

export function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 shadow-[0_10px_40px_rgba(0,0,0,0.25)] backdrop-blur-xl">
      <div className="border-b border-white/10 p-6">
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-slate-400">{subtitle}</p> : null}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-200">{label}</label>
      {children}
      {error ? <p className="text-sm text-rose-400">{error}</p> : null}
    </div>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        "w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white",
        "placeholder:text-slate-400 outline-none transition",
        "focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30",
        props.className ?? "",
      ].join(" ")}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={[
        "w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white",
        "outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30",
        props.className ?? "",
      ].join(" ")}
    />
  );
}

export function Button({
  children,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
}) {
  const base =
    "inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60";

  const styles =
    variant === "primary"
      ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:scale-[1.02]"
      : variant === "danger"
      ? "bg-rose-500 text-white hover:bg-rose-600"
      : "border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10";

  return (
    <button {...props} className={[base, styles, props.className ?? ""].join(" ")}>
      {children}
    </button>
  );
}

export function StepPill({
  active,
  done,
  label,
}: {
  active: boolean;
  done: boolean;
  label: string;
}) {
  return (
    <div
      className={[
        "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition",
        active
          ? "border-transparent bg-gradient-to-r from-blue-500 to-purple-500 text-white"
          : done
          ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
          : "border-white/10 bg-white/5 text-slate-400",
      ].join(" ")}
    >
      {done ? <Check className="h-4 w-4" /> : <span className="h-2 w-2 rounded-full bg-current opacity-80" />}
      <span>{label}</span>
    </div>
  );
}