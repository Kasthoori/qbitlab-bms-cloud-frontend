/* eslint-disable @typescript-eslint/no-explicit-any */
import { BmsApi, type CreateHvacRequest, type HvacDto } from "@/api/bms";
import { AnimatePresence, motion, useDragControls } from "framer-motion";
import { useMemo, useState, type FC, type SubmitEventHandler } from "react";

type UpdateHvacModalProps = {
  open: boolean;
  tenantId: string;
  siteId: string;
  hvacId: string;
  hvac: HvacDto;

  // ✅ parent-controlled form (Fix3)
  form: CreateHvacRequest;
  setForm: React.Dispatch<React.SetStateAction<CreateHvacRequest>>;

  onClose: () => void;
  onUpdated: () => void;
};

const UpdateHvacModal: FC<UpdateHvacModalProps> = ({
  open,
  tenantId,
  siteId,
  hvacId,
  form,
  setForm,
  onClose,
  onUpdated,
}) => {
  const dragControls = useDragControls();

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const canSubmit = useMemo(() => {
    return !!form.hvacName.trim() && !!form.deviceId.trim() && !!form.protocol && !!form.unitType;
  }, [form]);

  const setField = <K extends keyof CreateHvacRequest>(key: K, value: CreateHvacRequest[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validate = (): string | null => {
    if (!form.hvacName.trim()) return "HVAC name is required";
    if (!form.deviceId.trim()) return "Device ID is required";
    if (!form.protocol) return "Protocol is required";
    if (!form.unitType) return "Unit type is required";
    return null;
  };

  const handleClose = () => {
    if (saving) return;
    setErr(null);
    setSuccess(false);
    onClose();
  };

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();

    const v = validate();
    if (v) {
      setErr(v);
      return;
    }

    try {
      setSaving(true);
      setErr(null);

      // ✅ call your update endpoint
      await BmsApi.updateHvac(tenantId, siteId, hvacId, form);

      setSuccess(true);
      onUpdated?.();

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update HVAC. Please try again.";
      setErr(String(msg));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50"
            onClick={handleClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Center container */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            {/* Modal */}
            <motion.div
              className="relative w-[92vw] max-w-lg rounded-2xl bg-white shadow-xl"
              initial={{ opacity: 0, scale: 0.96, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              drag
              dragControls={dragControls}
              dragListener={false}
              dragMomentum={false}
            >
              {/* Header Drag Handle */}
              <div className="border-b px-5 py-4 cursor-move select-none" onPointerDown={(e) => dragControls.start(e)}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Update HVAC</h2>
                    <p className="text-sm text-slate-500">
                      HVAC ID: <span className="font-medium text-slate-700">{hvacId}</span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
                    disabled={saving}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    Close
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="px-5 py-4">
                {err && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                  >
                    {err}
                  </motion.div>
                )}

                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700"
                  >
                    Successfully updated
                  </motion.div>
                )}

                <div className="grid grid-cols-1 gap-3">
                  <label className="text-sm">
                    <div className="mb-1 text-slate-700">HVAC name</div>
                    <input
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={form.hvacName}
                      onChange={(e) => setField("hvacName", e.target.value)}
                      disabled={saving}
                      placeholder="e.g., AHU - Level 2"
                    />
                  </label>

                  <label className="text-sm">
                    <div className="mb-1 text-slate-700">Device ID</div>
                    <input
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={form.deviceId}
                      onChange={(e) => setField("deviceId", e.target.value)}
                      disabled={saving}
                      placeholder="e.g., BACNET:12345"
                    />
                  </label>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <label className="text-sm">
                      <div className="mb-1 text-slate-700">Protocol</div>
                      <select
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={form.protocol}
                        onChange={(e) => setField("protocol", e.target.value as CreateHvacRequest["protocol"])}
                        disabled={saving}
                      >
                        <option value="BACNET">BACNET</option>
                        <option value="MODBUS">MODBUS</option>
                        <option value="SIMULATED">SIMULATED</option>
                      </select>
                    </label>

                    <label className="text-sm">
                      <div className="mb-1 text-slate-700">Unit type</div>
                      <select
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={form.unitType}
                        onChange={(e) => setField("unitType", e.target.value as CreateHvacRequest["unitType"])}
                        disabled={saving}
                      >
                        <option value="AHU">AHU</option>
                        <option value="VRF">VRF</option>
                        <option value="FCU">FCU</option>
                        <option value="CHILLER">CHILLER</option>
                        <option value="OTHER">OTHER</option>
                      </select>
                    </label>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="h-10 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-60"
                    disabled={saving}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                    disabled={!canSubmit || saving}
                  >
                    {saving ? "Saving..." : "Update HVAC"}
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

export default UpdateHvacModal;