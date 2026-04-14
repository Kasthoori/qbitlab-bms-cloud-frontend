/* eslint-disable @typescript-eslint/no-explicit-any */
import { BmsApi, type CreateSiteRequest } from "@/api/bms";
import { AnimatePresence, motion, useDragControls } from "framer-motion";
import {
  Building2,
  MapPin,
  Sparkles,
  X,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useMemo, useState, type FC, type SubmitEventHandler } from "react";

type AddSiteModalProps = {
  open: boolean;
  tenantId: string;
  tenantTitle?: string;
  onClose: () => void;
  onCreated?: () => void;
};

const inputClass =
  "w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-400 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30 disabled:opacity-60";

const labelClass = "mb-2 text-sm font-medium text-slate-200";

const AddSiteModal: FC<AddSiteModalProps> = ({
  open,
  tenantId,
  tenantTitle,
  onClose,
  onCreated,
}) => {
  const dragControls = useDragControls();

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const initialForm = useMemo<CreateSiteRequest>(
    () => ({
      siteName: "",
      addressLine1: "",
      city: "",
      postcode: "",
      timezone: "Pacific/Auckland",
    }),
    []
  );

  const [form, setForm] = useState<CreateSiteRequest>(initialForm);

  const resetLocalState = () => {
    setErr(null);
    setSuccess(false);
    setSaving(false);
    setForm(initialForm);
  };

  const handleClose = () => {
    if (saving) return;
    resetLocalState();
    onClose();
  };

  const setField = <K extends keyof CreateSiteRequest>(
    key: K,
    value: CreateSiteRequest[K]
  ) => setForm((p) => ({ ...p, [key]: value }));

  const validate = (): string | null => {
    if (!tenantId) return "Missing tenantId. Please open the form again.";
    if (!form.siteName.trim()) return "Site name is required";
    if (!form.addressLine1.trim()) return "Address line 1 is required";
    if (!form.city.trim()) return "City is required";
    if (!form.postcode.trim()) return "Postcode is required";
    if (!form.timezone.trim()) return "Timezone is required";
    return null;
  };

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();

    const validationError = validate();
    if (validationError) {
      setErr(validationError);
      return;
    }

    try {
      setSaving(true);
      setErr(null);
      setSuccess(false);

      await BmsApi.addSiteToExistingTenant(tenantId, form);

      setSuccess(true);

      setTimeout(() => {
        onCreated?.();
        resetLocalState();
        onClose();
      }, 1000);
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to create site. Please try again.";
      setErr(String(msg));
    } finally {
      setSaving(false);
    }
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
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={handleClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <div className="absolute inset-0 flex items-center justify-center p-4">
            <motion.div
              className="relative w-[94vw] max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-slate-950/90 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl"
              initial={{ opacity: 0, scale: 0.96, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              drag
              dragControls={dragControls}
              dragListener={false}
              dragMomentum={false}
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.14),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.12),transparent_24%)]" />

              <div
                className="relative cursor-move select-none border-b border-white/10 px-6 py-5"
                onPointerDown={(e) => dragControls.start(e)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-blue-300">
                      <Building2 className="h-5 w-5" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">
                        <Sparkles className="h-4 w-4" />
                        Add Site
                      </div>

                      <h2 className="mt-2 text-2xl font-bold text-white">
                        New Site Setup
                      </h2>

                      <p className="mt-1 text-sm text-slate-400">
                        Tenant:
                        <span className="ml-1 font-medium text-slate-200">
                          {tenantTitle ?? tenantId}
                        </span>
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-2xl border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white disabled:opacity-60"
                    disabled={saving}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="relative px-6 py-5">
                {err && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{err}</span>
                  </motion.div>
                )}

                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>Site created successfully.</span>
                  </motion.div>
                )}

                <div className="grid grid-cols-1 gap-4">
                  <label className="block">
                    <div className={labelClass}>Site Name</div>
                    <input
                      className={inputClass}
                      value={form.siteName}
                      onChange={(e) => setField("siteName", e.target.value)}
                      disabled={saving}
                      placeholder="e.g., Auckland Office"
                    />
                  </label>

                  <label className="block">
                    <div className={labelClass}>Address Line 1</div>
                    <input
                      className={inputClass}
                      value={form.addressLine1}
                      onChange={(e) => setField("addressLine1", e.target.value)}
                      disabled={saving}
                      placeholder="e.g., 42 Queen St"
                    />
                  </label>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <label className="block">
                      <div className={labelClass}>City</div>
                      <input
                        className={inputClass}
                        value={form.city}
                        onChange={(e) => setField("city", e.target.value)}
                        disabled={saving}
                        placeholder="e.g., Auckland"
                      />
                    </label>

                    <label className="block">
                      <div className={labelClass}>Postcode</div>
                      <input
                        className={inputClass}
                        value={form.postcode}
                        onChange={(e) => setField("postcode", e.target.value)}
                        disabled={saving}
                        placeholder="e.g., 1010"
                      />
                    </label>
                  </div>

                  <label className="block">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-200">
                      <MapPin className="h-4 w-4 text-cyan-300" />
                      Timezone
                    </div>
                    <input
                      className={inputClass}
                      value={form.timezone}
                      onChange={(e) => setField("timezone", e.target.value)}
                      disabled={saving}
                      placeholder="e.g., Pacific/Auckland"
                    />
                  </label>
                </div>

                <div className="mt-6 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10 hover:text-white disabled:opacity-60"
                    disabled={saving}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="rounded-2xl bg-linear-to-r from-blue-500 to-purple-500 px-5 py-3 text-sm font-semibold text-white transition hover:scale-[1.02] disabled:opacity-60"
                    disabled={saving || !tenantId}
                  >
                    {saving ? "Saving..." : "Create Site"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddSiteModal;