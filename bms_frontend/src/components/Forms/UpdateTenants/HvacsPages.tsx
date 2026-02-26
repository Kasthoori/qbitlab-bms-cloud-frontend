/* eslint-disable @typescript-eslint/no-explicit-any */
import { BmsApi, type CreateHvacRequest, type HvacDto } from "@/api/bms";
import { useCallback, useEffect, useState, type FC } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BmsCard from "./BmsCard";
import UpdateHvacModal from "./UpdateHvacModal";
import ConfirmDeleteHvacModal from "./ConfirmDeleteHvacModal";

// --- type guards (safe enum handling) ---
type Protocol = CreateHvacRequest["protocol"];
type UnitType = CreateHvacRequest["unitType"];

const isProtocol = (v: any): v is Protocol =>
  v === "BACNET" || v === "MODBUS" || v === "SIMULATED";

const isUnitType = (v: any): v is UnitType =>
  v === "AHU" || v === "VRF" || v === "FCU" || v === "CHILLER" || v === "OTHER";

const EMPTY_HVAC_FORM: CreateHvacRequest = {
  hvacName: "",
  deviceId: "",
  protocol: "BACNET",
  unitType: "AHU",
};

const HvacsPages: FC = () => {
  const nav = useNavigate();
  const { tenantId, siteId } = useParams<{ tenantId: string; siteId: string }>();

  const [hvacs, setHvacs] = useState<HvacDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const [deletingId, setDeletingId] = useState<string | null>(null);

  // --- edit modal state (Fix3) ---
  const [openUpdateHvac, setOpenUpdateHvac] = useState(false);
  const [selectedHvac, setSelectedHvac] = useState<HvacDto | null>(null);
  const [hvacForm, setHvacForm] = useState<CreateHvacRequest>(EMPTY_HVAC_FORM);

  // --- delete modal state (NEW) ---
  const [openDeleteHvac, setOpenDeleteHvac] = useState(false);
  const [hvacToDelete, setHvacToDelete] = useState<HvacDto | null>(null);
  const [deletingHvac, setDeletingHvac] = useState(false);
  const [deleteHvacError, setDeleteHvacError] = useState<string | null>(null);
  const [deleteHvacSuccess, setDeleteHvacSuccess] = useState(false);


  const loadHvacs = useCallback(async () => {
    if (!tenantId || !siteId) return;

    try {
      setLoading(true);
      setError(null);

      const data = await BmsApi.getHvacsByTenantSite(tenantId, siteId);
      setHvacs(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "An error occurred loading hvacs");
    } finally {
      setLoading(false);
    }
  }, [tenantId, siteId]);

  useEffect(() => {
    void loadHvacs();
  }, [loadHvacs]);


  // ✅ Fix3: hydrate form here (parent) BEFORE opening modal
  const onEditHvac = (h: HvacDto) => {
    const hvacId = (h as any).hvacId ?? (h as any).id;

    setSelectedHvac({ ...(h as any), hvacId }); // normalize for modal
    setHvacForm({
      hvacName: (h as any).hvacName ?? "",
      deviceId: (h as any).deviceId ?? "",
      protocol: isProtocol((h as any).protocol) ? (h as any).protocol : "BACNET",
      unitType: isUnitType((h as any).unitType) ? (h as any).unitType : "AHU",
    });

    setOpenUpdateHvac(true);
  };

  const closeEditModal = () => {
    setOpenUpdateHvac(false);
    setSelectedHvac(null);
    setHvacForm(EMPTY_HVAC_FORM);
  };

  // ✅ Delete flow: open confirm modal (NEW)
  const onAskDeleteHvac = (h: HvacDto) => {
    setHvacToDelete(h);
    setDeleteHvacError(null);
    setDeleteHvacSuccess(false);
    setOpenDeleteHvac(true);
  };

  // ✅ Delete flow: confirm delete (NEW)
  const onConfirmDeleteHvac = async () => {
    if (!tenantId || !siteId || !hvacToDelete) return;

    const hvacId = (hvacToDelete as any).hvacId ?? (hvacToDelete as any).id;

    setDeletingHvac(true);
    setDeleteHvacError(null);
    setDeleteHvacSuccess(false);

    try {
      await BmsApi.deleteHvac(tenantId, siteId, hvacId);

      setDeleteHvacSuccess(true);
      await loadHvacs();

      // show success briefly then close
      setTimeout(() => {
        setOpenDeleteHvac(false);
        setHvacToDelete(null);
        setDeleteHvacSuccess(false);
      }, 700);
    } catch (e: unknown) {
      setDeleteHvacError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeletingHvac(false);
    }
  };


  return (
    <div className="p-6">
      <div className="mb-4 flex items-center gap-3">
        <button
          className="rounded-xl border px-4 py-2 text-slate-700 hover:bg-slate-50"
          onClick={() => nav(`/admin/tenants/query/${tenantId}/sites`)}
        >
          ← Back
        </button>
      </div>

      <div className="mb-5">
        <h1 className="text-2xl font-bold text-slate-900">HVAC Units</h1>
        <p className="mt-1 text-slate-600">
          <b>Tenant:</b> {tenantId} • <b>Site:</b> {siteId}
        </p>
      </div>

      {loading && <div className="text-slate-600">Loading HVAC units....</div>}
      {error && <div className="text-red-600 whitespace-pre-wrap">{error}</div>}

      {!loading && !error && hvacs.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <div className="font-semibold text-slate-900">No HVAC units found</div>
          <div className="mt-1 text-sm text-slate-600">Onboard an HVAC under this site.</div>
        </div>
      )}

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {hvacs.map((h) => {
          const hvacId = (h as any).hvacId ?? (h as any).id;

          const meta = [
            hvacId ? `HVAC ID: ${hvacId}` : "HVAC ID: —",
            (h as any).status ? `Status: ${(h as any).status}` : null,
            (h as any).lastSeenAt ? `Last seen: ${new Date((h as any).lastSeenAt).toLocaleDateString()}` : null,
            typeof (h as any).temperature === "number" ? `Temp: ${(h as any).temperature}°C` : null,
          ]
            .filter(Boolean)
            .join(" • ");

          return (
            <BmsCard
              key={hvacId}
              title="HVAC"
              subtitle={(h as any).hvacName ?? "Unnamed HVAC"}
              meta={meta}
              actions={[
                {
                  label: "Edit",
                  variant: "secondary",
                  onClick: () => onEditHvac(h),
                },
                {
                label:
                  deletingHvac && ((hvacToDelete as any)?.hvacId ?? (hvacToDelete as any)?.id) === hvacId
                    ? "Deleting..."
                    : "Delete",
                    variant: "danger",
                    disabled:
                      deletingHvac && ((hvacToDelete as any)?.hvacId ?? (hvacToDelete as any)?.id) === hvacId,
                    onClick: () => onAskDeleteHvac(h),
                  },
               ]}
            />
          );
        })}
      </div>

      {/* ✅ Update modal */}
      {openUpdateHvac && selectedHvac && tenantId && siteId && (
        <UpdateHvacModal
          open={openUpdateHvac}
          tenantId={tenantId}
          siteId={siteId}
          hvacId={(selectedHvac as any).hvacId}
          hvac={selectedHvac}
          form={hvacForm}
          setForm={setHvacForm}
          onClose={closeEditModal}
          onUpdated={loadHvacs}
        />
      )}

      {/* ✅ Delete confirm modal (NEW) */}
      {tenantId && siteId && hvacToDelete && (
        <ConfirmDeleteHvacModal
          open={openDeleteHvac}
          tenantId={tenantId}
          siteId={siteId}
          hvacId={(hvacToDelete as any).hvacId ?? (hvacToDelete as any).id}
          hvacName={(hvacToDelete as any).hvacName ?? (hvacToDelete as any).name}
          deleting={deletingHvac}
          error={deleteHvacError}
          success={deleteHvacSuccess}
          onClose={() => {
            if (deletingHvac) return;
            setOpenDeleteHvac(false);
            setHvacToDelete(null);
            setDeleteHvacError(null);
            setDeleteHvacSuccess(false);
          }}
          onConfirmDelete={onConfirmDeleteHvac}
        />
      )}
    </div>
  );
};

export default HvacsPages;