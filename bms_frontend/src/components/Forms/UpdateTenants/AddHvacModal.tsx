/* eslint-disable @typescript-eslint/no-explicit-any */
import { BmsApi, type CreateHvacRequest } from "@/api/bms";
import { AnimatePresence, motion, useDragControls } from "framer-motion";
import {
  Cpu,
  RadioTower,
  Sparkles,
  X,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useMemo, useState, type FC, type SubmitEventHandler } from "react";

import { BmsButton, BmsInput, BmsSelect } from "@/components/UI";

type AddHvacModalProps = {
  open: boolean;
  tenantId: string;
  tenantTitle?: string;
  hvacId?: string;
  siteId: string;
  siteTitle?: string;
  hvacTitle?: string;
  onClose: () => void;
  onCreated?: () => void;
};

const AddHvacModal: FC<AddHvacModalProps> = ({
  open,
  tenantId,
  siteId,
  tenantTitle,
  siteTitle,
  onClose,
  onCreated,
}) => {
  const dragControls = useDragControls();

  const [saving, setSaving] = useState<boolean>(false);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const initialForm = useMemo<CreateHvacRequest>(
    () => ({
      hvacName: "",
      deviceId: "",
      protocol: "BACNET",
      unitType: "AHU",
    }),
    []
  );

  const [form, setForm] = useState<CreateHvacRequest>(initialForm);

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

  const setField = <K extends keyof CreateHvacRequest>(
    key: K,
    value: CreateHvacRequest[K]
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const validate = (): string | null => {
    if (!tenantId) return "Missing tenantId, please open the form again.";
    if (!siteId) return "Missing siteId, please open the form again.";
    if (!form.hvacName.trim()) return "HVAC name is required.";
    if (!form.deviceId.trim()) return "Device ID is required.";
    if (!String(form.protocol).trim()) return "Protocol is required.";
    if (!String(form.unitType).trim()) return "Unit type is required.";
    return null;
  };

  const canSubmit = useMemo(() => {
    return (
      !!tenantId &&
      !!siteId &&
      !!form.hvacName.trim() &&
      !!form.deviceId.trim()
    );
  }, [tenantId, siteId, form.hvacName, form.deviceId]);

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

      console.log("ADD HVAC MODAL SUBMIT", {
        tenantId,
        siteId,
        tenantTitle,
        siteTitle,
        form,
      });

      await BmsApi.addHvacToExistingSite(tenantId, siteId, form);

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
        "An error occurred. Please try again.";

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
                      <Cpu className="h-5 w-5" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
                        <Sparkles className="h-4 w-4" />
                        Add HVAC
                      </div>

                      <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-100">
                        New HVAC Registration
                      </h2>

                      <div className="mt-3 space-y-1 text-sm text-slate-400">
                        <p>
                          Tenant:
                          <span className="ml-1 font-medium text-slate-200">
                            {tenantTitle ?? tenantId}
                          </span>
                        </p>

                        <p>
                          Site:
                          <span className="ml-1 font-medium text-slate-200">
                            {siteTitle ?? siteId}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-300/15 bg-slate-950/45 text-slate-300 transition hover:border-rose-300/35 hover:bg-rose-500/15 hover:text-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={saving}
                    onPointerDown={(event) => event.stopPropagation()}
                    aria-label="Close add HVAC modal"
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
                    <span>HVAC created successfully.</span>
                  </motion.div>
                )}

                <div className="grid grid-cols-1 gap-4">
                  <BmsInput
                    label="HVAC Name"
                    value={form.hvacName}
                    onChange={(event) => setField("hvacName", event.target.value)}
                    disabled={saving}
                    placeholder="e.g., AHU - Level 2"
                  />

                  <BmsInput
                    label="Device ID"
                    value={form.deviceId}
                    onChange={(event) => setField("deviceId", event.target.value)}
                    disabled={saving}
                    placeholder="e.g., hvac-1"
                  />

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <BmsSelect
                      label={
                        <span className="inline-flex items-center gap-2">
                          <RadioTower className="h-4 w-4 text-cyan-300" />
                          Protocol
                        </span>
                      }
                      value={form.protocol}
                      onChange={(event) =>
                        setField(
                          "protocol",
                          event.target.value as CreateHvacRequest["protocol"]
                        )
                      }
                      disabled={saving}
                    >
                      <option value="BACNET">BACNET</option>
                      <option value="MODBUS">MODBUS</option>
                      <option value="SIMULATOR">SIMULATOR</option>
                    </BmsSelect>

                    <BmsSelect
                      label="Unit Type"
                      value={form.unitType}
                      onChange={(event) =>
                        setField(
                          "unitType",
                          event.target.value as CreateHvacRequest["unitType"]
                        )
                      }
                      disabled={saving}
                    >
                      <option value="AHU">AHU</option>
                      <option value="VRF">VRF</option>
                      <option value="FCU">FCU</option>
                      <option value="CHILLER">CHILLER</option>
                      <option value="OTHER">OTHER</option>
                    </BmsSelect>
                  </div>
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
                    disabled={!canSubmit || saving}
                  >
                    {saving ? "Saving..." : "Add HVAC"}
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

export default AddHvacModal;