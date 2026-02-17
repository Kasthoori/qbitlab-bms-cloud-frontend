import { BmsApi, type CreateHvacRequest } from "@/api/bms";
import { AnimatePresence, motion, useDragControls } from "framer-motion";
import { useMemo, useState, type FC, type SubmitEventHandler } from "react";

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

}



const AddHvacModal:FC<AddHvacModalProps> = ({
    open,
    tenantId,
    siteId,
    tenantTitle,
    siteTitle,
    onClose,
    onCreated
}) => {

      const dragControls = useDragControls();

      const [saving, setSaving] = useState<boolean>(false);
      const [err, setErr] = useState<string | null>(null);


      const initialForm = useMemo<CreateHvacRequest>(() => ({
        hvacName: "",
        deviceId: "",
        protocol: "BACNET",
        unitType: "AHU",
      }), []);

      const [form, setForm] = useState<CreateHvacRequest>(initialForm);

      const resetLocalState = () => {
        setErr(null);
        setSaving(false);
        setForm(initialForm);
      }

      const handleClose = () => {

        if (saving) return;
        resetLocalState();
        onClose();
      }

      const setField = <K extends keyof CreateHvacRequest>(
        key: K,
        value: CreateHvacRequest[K]
      ) => setForm((p) => ({ ...p, [key]: value }));


      const validate = (): string | null => {
        if (!tenantId) return "Missing tenantId, please open the form again";
        if (!siteId) return "Missing siteId, please open the form again";
        if (!form.hvacName.trim()) return "HVAC name is required";
        if (!form.deviceId.trim()) return "Device Id is required";
        if (!String(form.protocol).trim()) return "Protocol is required";
        if (!String(form.unitType).trim()) return "Unit type is required";
        return null;
      }

      const canSubmit = useMemo(() => {
        return(
            !!tenantId &&
            !!siteId &&
            form.hvacName.trim() &&
            form.deviceId.trim()
        );
      }, [tenantId, siteId, form.hvacName, form.deviceId]);

      const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (e) => {

        e.preventDefault();

        const v = validate();
        if (v) {
          setErr(v);
          return;
        }

        try {
          setSaving(true);
          setErr(null);

          await BmsApi.addHvacToExistingSite(tenantId, siteId, form);
          onCreated?.();
          resetLocalState();
          onClose();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {

             const msg = error?.response?.data?.message || 
             error?.message ||
             "An error occurred. Please try again.";
             setErr(String(msg));

        } finally {
          setSaving(false);
        }
        
      }

      return (
        <AnimatePresence>
          {open && (
            <motion.div
              className="fixed inset-0 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
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
                  initial={{ opacity: 0, scale: 0.96, y: 18}}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 12 }}
                  transition={{ duration: 0.18, ease: "easeOut"}}
                  onClick={(e) => e.stopPropagation()}
                  drag
                  dragControls={dragControls}
                  dragListener={false}
                  dragMomentum={false}
                  
                >
                  {/* Header Drag Handle */}
                  <div
                    className="border-b px-5 py-4 cursor-move select-none"
                    onPointerDown={(e) => dragControls.start(e)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-semibold text-slate-900">Add HVAC</h2>

                        <p className="text-sm text-slate-500">
                          Tenant:{" "}
                          <span className="font-medium text-slate-700">
                            {tenantTitle ?? tenantId}
                          </span>
                        </p>

                        <p className="text-sm text-slate-500">
                          Site:{" "}
                          <span className="font-medium text-slate-700">
                            {siteTitle ?? siteId}
                          </span>
                        </p>

                         <p className="text-sm text-slate-500">
                          SiteId:{" "}
                          <span className="font-medium text-slate-700">
                            {siteId}
                          </span>
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
                        className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 details-content:opacity-69"
                        disabled={!canSubmit || saving}
                      >
                        {saving ? "Saving..." : "Add HVAC"}
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      );
}

export default AddHvacModal;