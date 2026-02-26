/* eslint-disable @typescript-eslint/no-explicit-any */
import { BmsApi, type CreateSiteRequest } from "@/api/bms";
import { AnimatePresence, motion, useDragControls } from "framer-motion";
import { useMemo, useState, type FC, type SubmitEventHandler } from "react";

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
    setSaving(false);
    setForm(initialForm);
  };

  const handleClose = () => {
    if (saving) return; // optional: don't allow closing while saving
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

    const v = validate();
    if (v) {
      setErr(v);
      return;
    }

    try {
      setSaving(true);
      setErr(null);

      await BmsApi.addSiteToExistingTenant(tenantId, form);

      // ✅ success -> refresh + close
      onCreated?.();
      resetLocalState();
      onClose();
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
              onClick={(e) => e.stopPropagation()} // ✅ prevent backdrop close when clicking inside
              drag
              dragControls={dragControls}
              dragListener={false} // ✅ only drag when header triggers dragControls.start()
              dragMomentum={false}
            >
              {/* Header (Drag Handle) */}
              <div
                className="border-b px-5 py-4 cursor-move select-none"
                onPointerDown={(e) => dragControls.start(e)} // ✅ drag from header only
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Add Site</h2>
                    <p className="text-sm text-slate-500">
                      Tenant:{" "}
                      <span className="font-medium text-slate-700">
                        {tenantTitle ?? tenantId}
                      </span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
                    disabled={saving}
                    // ✅ avoid starting drag when clicking the close button
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
                    <div className="mb-1 text-slate-700">Site name</div>
                    <input
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={form.siteName}
                      onChange={(e) => setField("siteName", e.target.value)}
                      disabled={saving}
                    />
                  </label>

                  <label className="text-sm">
                    <div className="mb-1 text-slate-700">Address line 1</div>
                    <input
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={form.addressLine1}
                      onChange={(e) => setField("addressLine1", e.target.value)}
                      disabled={saving}
                    />
                  </label>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <label className="text-sm">
                      <div className="mb-1 text-slate-700">City</div>
                      <input
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={form.city}
                        onChange={(e) => setField("city", e.target.value)}
                        disabled={saving}
                      />
                    </label>

                    <label className="text-sm">
                      <div className="mb-1 text-slate-700">Postcode</div>
                      <input
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={form.postcode}
                        onChange={(e) => setField("postcode", e.target.value)}
                        disabled={saving}
                      />
                    </label>
                  </div>

                  <label className="text-sm">
                    <div className="mb-1 text-slate-700">Timezone</div>
                    <input
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={form.timezone}
                      onChange={(e) => setField("timezone", e.target.value)}
                      disabled={saving}
                    />
                  </label>
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
