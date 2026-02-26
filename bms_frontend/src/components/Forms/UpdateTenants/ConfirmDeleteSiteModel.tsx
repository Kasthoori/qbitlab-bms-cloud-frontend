/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnimatePresence, motion, useDragControls } from "framer-motion";
import { useEffect, useState, type FC } from "react";

type ConfirmDeleteSiteModalProps = {
  open: boolean;

  tenantId: string;
  siteId: string;
  siteName?: string;

  deleting?: boolean;
  error?: string | null;
  success?: boolean;

  onClose: () => void;
  onConfirmDelete: () => Promise<void> | void;
};

const ConfirmDeleteSiteModal: FC<ConfirmDeleteSiteModalProps> = ({
  open,
  tenantId,
  siteId,
  siteName,
  deleting = false,
  error,
  success,
  onClose,
  onConfirmDelete,
}) => {
  const dragControls = useDragControls();
  const [localSuccess, setLocalSuccess] = useState(false);

  useEffect(() => {
    setLocalSuccess(!!success);
  }, [success]);

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
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50"
            onClick={handleClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <div className="absolute inset-0 flex items-center justify-center p-4">
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
              {/* Header (drag handle) */}
              <div
                className="border-b px-5 py-4 cursor-move select-none"
                onPointerDown={(e) => dragControls.start(e)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Delete Site
                    </h2>

                    <p className="text-sm text-slate-500">
                      Tenant:{" "}
                      <span className="font-medium text-slate-700">
                        {tenantId}
                      </span>
                    </p>

                    <p className="text-sm text-slate-500">
                      Site:{" "}
                      <span className="font-medium text-slate-700">
                        {siteName ?? siteId}
                      </span>
                    </p>

                    <p className="text-xs text-slate-400 break-all">
                      Site ID: {siteId}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
                    disabled={deleting}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    Close
                  </button>
                </div>
              </div>

              <div className="px-5 py-4">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 whitespace-pre-wrap"
                  >
                    {error}
                  </motion.div>
                )}

                {localSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700"
                  >
                    Successfully deleted
                  </motion.div>
                )}

                {!localSuccess && (
                  <div className="text-slate-700">
                    <div className="font-medium">Are you sure?</div>
                    <div className="mt-1 text-sm text-slate-600">
                      This will permanently delete this site and may affect
                      HVACs under it.
                    </div>
                  </div>
                )}

                <div className="mt-5 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="h-10 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-60"
                    disabled={deleting}
                  >
                    Cancel
                  </button>

                  {!localSuccess && (
                    <button
                      type="button"
                      onClick={() => onConfirmDelete()}
                      className="h-10 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                      disabled={deleting}
                    >
                      {deleting ? "Deleting..." : "Delete"}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmDeleteSiteModal;