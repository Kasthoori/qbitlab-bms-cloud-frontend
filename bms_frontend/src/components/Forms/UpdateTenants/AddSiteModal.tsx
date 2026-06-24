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

import { BmsButton, BmsInput } from "@/components/UI";

type AddSiteModalProps = {
  open: boolean;
  tenantId: string;
  tenantTitle?: string;
  onClose: () => void;
  onCreated?: () => void;
};

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
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const validate = (): string | null => {
    if (!tenantId) return "Missing tenantId. Please open the form again.";
    if (!form.siteName.trim()) return "Site name is required.";
    if (!form.addressLine1.trim()) return "Address line 1 is required.";
    if (!form.city.trim()) return "City is required.";
    if (!form.postcode.trim()) return "Postcode is required.";
    if (!form.timezone.trim()) return "Timezone is required.";
    return null;
  };

  const canSubmit =
    Boolean(tenantId) &&
    Boolean(form.siteName.trim()) &&
    Boolean(form.addressLine1.trim()) &&
    Boolean(form.city.trim()) &&
    Boolean(form.postcode.trim()) &&
    Boolean(form.timezone.trim());

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();

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
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to create site. Please try again.";

      setErr(String(message));
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
            className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
            onClick={handleClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <div className="absolute inset-0 flex items-center justify-center p-4">
            <motion.div
              className="relative w-[94vw] max-w-2xl overflow-hidden rounded-3xl border border-cyan-300/15 bg-[linear-gradient(145deg,rgba(20,31,54,0.96),rgba(15,23,42,0.94)_48%,rgba(49,46,129,0.42))] shadow-[0_28px_90px_rgba(0,0,0,0.52),inset_0_1px_0_rgba(255,255,255,0.05)] ring-1 ring-white/5 backdrop-blur-2xl"
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
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/15 bg-slate-900/55 text-cyan-200 shadow-lg shadow-cyan-950/20">
                      <Building2 className="h-5 w-5" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
                        <Sparkles className="h-4 w-4" />
                        Add Site
                      </div>

                      <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-100">
                        New Site Setup
                      </h2>

                      <p className="mt-3 text-sm text-slate-400">
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
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-300/15 bg-slate-950/45 text-slate-300 transition hover:border-rose-300/35 hover:bg-rose-500/15 hover:text-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={saving}
                    onPointerDown={(event) => event.stopPropagation()}
                    aria-label="Close add site modal"
                    title="Close"
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
                    className="mb-4 flex items-start gap-3 rounded-2xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm font-medium text-rose-100"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{err}</span>
                  </motion.div>
                )}

                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 flex items-start gap-3 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm font-medium text-emerald-100"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>Site created successfully.</span>
                  </motion.div>
                )}

                <div className="grid grid-cols-1 gap-4">
                  <BmsInput
                    label="Site Name"
                    value={form.siteName}
                    onChange={(event) =>
                      setField("siteName", event.target.value)
                    }
                    disabled={saving}
                    placeholder="e.g., Auckland Office"
                  />

                  <BmsInput
                    label="Address Line 1"
                    value={form.addressLine1}
                    onChange={(event) =>
                      setField("addressLine1", event.target.value)
                    }
                    disabled={saving}
                    placeholder="e.g., 42 Queen St"
                  />

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <BmsInput
                      label="City"
                      value={form.city}
                      onChange={(event) =>
                        setField("city", event.target.value)
                      }
                      disabled={saving}
                      placeholder="e.g., Auckland"
                    />

                    <BmsInput
                      label="Postcode"
                      value={form.postcode}
                      onChange={(event) =>
                        setField("postcode", event.target.value)
                      }
                      disabled={saving}
                      placeholder="e.g., 1010"
                    />
                  </div>

                  <BmsInput
                    label={
                      <span className="inline-flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-cyan-300" />
                        Timezone
                      </span>
                    }
                    value={form.timezone}
                    onChange={(event) =>
                      setField("timezone", event.target.value)
                    }
                    disabled={saving}
                    placeholder="e.g., Pacific/Auckland"
                  />
                </div>

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
                  <BmsButton
                    type="button"
                    variant="ghost"
                    size="lg"
                    onClick={handleClose}
                    disabled={saving}
                  >
                    Cancel
                  </BmsButton>

                  <BmsButton
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={saving || !canSubmit}
                  >
                    {saving ? "Saving..." : "Create Site"}
                  </BmsButton>
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