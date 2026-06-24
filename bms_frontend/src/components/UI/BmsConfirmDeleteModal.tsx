import { AnimatePresence, motion, useDragControls } from "framer-motion";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

import { BmsButton } from "./BmsButton";

type BmsConfirmDeleteModalProps = {
  open: boolean;
  eyebrow?: string;
  title: string;
  entityLabel: string;
  entityName: ReactNode;
  entityIdLabel?: string;
  entityId?: ReactNode;
  icon?: ReactNode;
  description: ReactNode;

  deleting?: boolean;
  error?: string | null;
  success?: boolean;
  successMessage?: ReactNode;

  cancelLabel?: string;
  confirmLabel?: string;
  deletingLabel?: string;

  onClose: () => void;
  onConfirmDelete: () => Promise<void> | void;
};

export function BmsConfirmDeleteModal({
  open,
  eyebrow = "Delete Record",
  title,
  entityLabel,
  entityName,
  entityIdLabel = "ID",
  entityId,
  icon,
  description,
  deleting = false,
  error,
  success,
  successMessage = "Deleted successfully.",
  cancelLabel = "Cancel",
  confirmLabel = "Delete",
  deletingLabel = "Deleting...",
  onClose,
  onConfirmDelete,
}: BmsConfirmDeleteModalProps) {
  const dragControls = useDragControls();
  const isSuccess = Boolean(success);

  const handleClose = () => {
    if (deleting) return;
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
              className="relative w-[92vw] max-w-lg overflow-hidden rounded-3xl border border-rose-300/20 bg-[linear-gradient(145deg,rgba(20,31,54,0.96),rgba(15,23,42,0.94)_48%,rgba(76,29,49,0.42))] shadow-[0_28px_90px_rgba(0,0,0,0.52),inset_0_1px_0_rgba(255,255,255,0.05)] ring-1 ring-white/5 backdrop-blur-2xl"
              initial={{ opacity: 0, scale: 0.96, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              onClick={(event) => event.stopPropagation()}
              drag
              dragControls={dragControls}
              dragListener={false}
              dragMomentum={false}
            >
              <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-linear-to-r from-transparent via-rose-300/45 to-transparent" />
              <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-rose-400/14 blur-3xl" />
              <div className="pointer-events-none absolute -left-12 bottom-0 h-36 w-36 rounded-full bg-indigo-400/10 blur-3xl" />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,113,133,0.12),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(129,140,248,0.10),transparent_28%)]" />

              <div
                className="relative cursor-move select-none border-b border-rose-300/15 px-6 py-5"
                onPointerDown={(event) => dragControls.start(event)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-300/20 bg-rose-500/10 text-rose-100 shadow-lg shadow-rose-950/20">
                      {icon ?? <Trash2 className="h-5 w-5" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-rose-300">
                        <Sparkles className="h-4 w-4" />
                        {eyebrow}
                      </div>

                      <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-100">
                        {title}
                      </h2>

                      <div className="mt-3 space-y-1 text-sm text-slate-400">
                        <p>
                          {entityLabel}:
                          <span className="ml-1 font-medium text-slate-200">
                            {entityName}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-300/15 bg-slate-950/45 text-slate-300 transition hover:border-rose-300/35 hover:bg-rose-500/15 hover:text-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={deleting}
                    onPointerDown={(event) => event.stopPropagation()}
                    aria-label="Close delete confirmation modal"
                    title="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="relative px-6 py-5">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 flex items-start gap-3 whitespace-pre-wrap rounded-2xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm font-medium text-rose-100"
                  >
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}

                {isSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 flex items-start gap-3 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm font-medium text-emerald-100"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{successMessage}</span>
                  </motion.div>
                )}

                {!isSuccess && (
                  <div className="rounded-2xl border border-rose-300/15 bg-rose-500/8 p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-300" />

                      <div>
                        <p className="font-semibold text-slate-100">
                          Are you sure?
                        </p>

                        <p className="mt-1 text-sm leading-6 text-slate-300">
                          {description}
                        </p>

                        {entityId && (
                          <div className="mt-3 rounded-2xl border border-slate-300/10 bg-slate-950/35 px-4 py-3 text-sm text-slate-400">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-200">
                                {entityIdLabel}:
                              </span>
                            </div>

                            <p className="mt-1 break-all text-slate-300">
                              {entityId}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
                  <BmsButton
                    type="button"
                    variant="ghost"
                    size="md"
                    onClick={handleClose}
                    disabled={deleting}
                  >
                    {cancelLabel}
                  </BmsButton>

                  {!isSuccess && (
                    <BmsButton
                      type="button"
                      variant="danger"
                      size="md"
                      onClick={() => onConfirmDelete()}
                      disabled={deleting}
                    >
                      {deleting ? deletingLabel : confirmLabel}
                    </BmsButton>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}