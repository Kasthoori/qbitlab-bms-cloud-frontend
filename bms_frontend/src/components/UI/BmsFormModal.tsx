import { AnimatePresence, motion, useDragControls } from "framer-motion";
import type { ReactNode } from "react";
import { Sparkles, X } from "lucide-react";
import { BmsButton } from "./BmsButton";

type BmsFormModalProps = {
  open: boolean;
  eyebrow: ReactNode;
  title: ReactNode;
  icon?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;

  footer?: ReactNode;

  saving?: boolean;
  maxWidthClassName?: string;

  onClose: () => void;
};

export function BmsFormModal({
  open,
  eyebrow,
  title,
  icon,
  subtitle,
  children,
  footer,
  saving = false,
  maxWidthClassName = "max-w-2xl",
  onClose,
}: BmsFormModalProps) {
  const dragControls = useDragControls();

  const handleClose = () => {
    if (saving) return;
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
            onClick={handleClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <div className="absolute inset-0 flex items-center justify-center p-4">
            <motion.div
              className={[
                "relative w-[94vw] overflow-hidden rounded-3xl",
                "border border-cyan-300/15",
                "bg-[linear-gradient(145deg,rgba(20,31,54,0.96),rgba(15,23,42,0.94)_48%,rgba(49,46,129,0.42))]",
                "shadow-[0_28px_90px_rgba(0,0,0,0.52),inset_0_1px_0_rgba(255,255,255,0.05)]",
                "ring-1 ring-white/5 backdrop-blur-2xl",
                maxWidthClassName,
              ].join(" ")}
              initial={{ opacity: 0, scale: 0.96, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={(event) => event.stopPropagation()}
              drag
              dragControls={dragControls}
              dragListener={false}
              dragMomentum={false}
            >
              <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-linear-to-r from-transparent via-cyan-300/45 to-transparent" />
              <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-cyan-400/12 blur-3xl" />
              <div className="pointer-events-none absolute -left-12 bottom-0 h-36 w-36 rounded-full bg-indigo-400/12 blur-3xl" />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.12),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(129,140,248,0.12),transparent_28%)]" />

              <div
                className="relative cursor-move select-none border-b border-cyan-300/15 px-6 py-5"
                onPointerDown={(event) => dragControls.start(event)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {icon && (
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/15 bg-slate-900/55 text-cyan-200 shadow-lg shadow-cyan-950/20">
                        {icon}
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
                        <Sparkles className="h-4 w-4" />
                        {eyebrow}
                      </div>

                      <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-100">
                        {title}
                      </h2>

                      {subtitle && (
                        <div className="mt-3 text-sm text-slate-400">
                          {subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-300/15 bg-slate-950/45 text-slate-300 transition hover:border-rose-300/35 hover:bg-rose-500/15 hover:text-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={saving}
                    onPointerDown={(event) => event.stopPropagation()}
                    aria-label="Close modal"
                    title="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="relative px-6 py-5">
                {children}

                {footer && <div className="mt-6">{footer}</div>}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

type BmsModalMessageProps = {
  type: "error" | "success";
  icon?: ReactNode;
  children: ReactNode;
};

export function BmsModalMessage({
  type,
  icon,
  children,
}: BmsModalMessageProps) {
  const classes =
    type === "error"
      ? "border-rose-300/20 bg-rose-400/10 text-rose-100"
      : "border-emerald-300/20 bg-emerald-400/10 text-emerald-100";

  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mb-4 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-medium ${classes}`}
    >
      {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
      <span>{children}</span>
    </motion.div>
  );
}

type BmsFormModalFooterProps = {
  saving?: boolean;
  canSubmit?: boolean;
  cancelLabel?: string;
  submitLabel: string;
  savingLabel?: string;
  onCancel: () => void;
};

export function BmsFormModalFooter({
  saving = false,
  canSubmit = true,
  cancelLabel = "Cancel",
  submitLabel,
  savingLabel = "Saving...",
  onCancel,
}: BmsFormModalFooterProps) {
  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
      <BmsButton
        type="button"
        variant="ghost"
        size="lg"
        onClick={onCancel}
        disabled={saving}
      >
        {cancelLabel}
      </BmsButton>

      <BmsButton
        type="submit"
        variant="primary"
        size="lg"
        disabled={!canSubmit || saving}
      >
        {saving ? savingLabel : submitLabel}
      </BmsButton>
    </div>
  );
}