import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  AlertCircle,
  CheckSquare,
  ImageIcon,
  Pencil,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { BmsApi, type FloorPlanDto, type HvacDto } from "@/api/bms";
import type { FloorPlanPlacement } from "./types/floorplan.types";
import FloorPlanCanvas from "./Pages/FloorPlanCanvas";
import FloorPlanItemsPanel from "./Pages/FloorPlanItemsPanel";
import FloorPlanToolbar from "./Pages/FloorPlanToolbar";

const glassCard =
  "rounded-3xl border border-white/10 bg-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl";

const inputClass =
  "w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-400 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30";

export default function ViewFloorPlan() {
  const navigate = useNavigate();
  const { tenantId, siteId } = useParams<{ tenantId: string; siteId: string }>();

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [floorPlans, setFloorPlans] = useState<FloorPlanDto[]>([]);
  const [selectedFloorPlanId, setSelectedFloorPlanId] = useState<string | null>(null);
  const [floorPlanImageUrl, setFloorPlanImageUrl] = useState("");

  const [hvacs, setHvacs] = useState<HvacDto[]>([]);
  const [placements, setPlacements] = useState<FloorPlanPlacement[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const [openUpdateModal, setOpenUpdateModal] = useState(false);
  const [updateName, setUpdateName] = useState("");
  const [updatingFloorPlan, setUpdatingFloorPlan] = useState(false);
  const [updateFloorPlanError, setUpdateFloorPlanError] = useState<string | null>(null);

  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [deletingFloorPlan, setDeletingFloorPlan] = useState(false);
  const [deleteFloorPlanError, setDeleteFloorPlanError] = useState<string | null>(null);

  const selectedFloorPlan = useMemo(() => {
    return (
      floorPlans.find((p) => (p.floorPlanId ?? p.id ?? "") === selectedFloorPlanId) ?? null
    );
  }, [floorPlans, selectedFloorPlanId]);

  async function loadData(preferredFloorPlanId?: string | null) {
    if (!tenantId || !siteId) {
      setErrorMessage("Tenant ID or Site ID is missing in the route.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const [plans, siteHvacs] = await Promise.all([
        BmsApi.getFloorPlansByTenantSite(tenantId, siteId),
        BmsApi.getHvacsByTenantSite(tenantId, siteId),
      ]);

      const safePlans = Array.isArray(plans) ? plans : [];
      const safeHvacs = Array.isArray(siteHvacs) ? siteHvacs : [];

      setFloorPlans(safePlans);
      setHvacs(safeHvacs);

      if (safePlans.length === 0) {
        setSelectedFloorPlanId(null);
        setFloorPlanImageUrl("");
        setPlacements([]);
        setSelectedItemId(null);
        return;
      }

      const preferred = preferredFloorPlanId
        ? safePlans.find((p) => (p.floorPlanId ?? p.id ?? "") === preferredFloorPlanId)
        : undefined;

      const targetPlan = preferred ?? safePlans[0];
      const targetPlanId = targetPlan?.floorPlanId ?? targetPlan?.id ?? "";

      if (!targetPlanId) {
        setErrorMessage("Selected floor plan does not contain an id.");
        setSelectedFloorPlanId(null);
        setFloorPlanImageUrl("");
        setPlacements([]);
        setSelectedItemId(null);
        return;
      }

      setSelectedFloorPlanId(targetPlanId);
      setFloorPlanImageUrl(BmsApi.getFloorPlanFileUrl(tenantId, siteId, targetPlanId));

      const placementData = await BmsApi.getFloorPlanPlacements(
        tenantId,
        siteId,
        targetPlanId
      );

      setPlacements(Array.isArray(placementData) ? placementData : []);
      setSelectedItemId(null);
    } catch (error) {
      console.error(error);
      setErrorMessage("Failed to load floor plans or HVACs.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, siteId]);

  function handlePlaceItem(hvac: HvacDto, x: number, y: number) {
    const hvacId = hvac.hvacId ?? "";
    const hvacName = hvac.hvacName ?? hvac.name ?? "Unnamed HVAC";

    if (!hvacId) return;

    setPlacements((prev) => {
      const existing = prev.find((p) => p.itemId === hvacId);

      if (existing) {
        return prev.map((p) =>
          p.itemId === hvacId
            ? { ...p, x, y, locked: false, itemName: hvacName, itemType: "HVAC" }
            : p
        );
      }

      return [
        ...prev,
        {
          itemId: hvacId,
          itemType: "HVAC",
          itemName: hvacName,
          x,
          y,
          locked: false,
        },
      ];
    });

    setSelectedItemId(null);
  }

  function handleMoveItem(itemId: string, x: number, y: number) {
    setPlacements((prev) =>
      prev.map((placement) =>
        placement.itemId === itemId && !placement.locked
          ? { ...placement, x, y }
          : placement
      )
    );
  }

  const handleToggleLock = async (itemId: string) => {
    if (!tenantId || !siteId || !selectedFloorPlanId) return;

    try {
      const updatedPlacement = placements.find((placement) => placement.itemId === itemId);
      if (!updatedPlacement) return;

      const toggledPlacement = { ...updatedPlacement, locked: !updatedPlacement.locked };

      const updatedPlacements = placements.map((placement) =>
        placement.itemId === itemId ? toggledPlacement : placement
      );

      setPlacements(updatedPlacements);

      await BmsApi.saveFloorPlanPlacements(
        tenantId,
        siteId,
        selectedFloorPlanId,
        [toggledPlacement]
      );

      setErrorMessage(null);
    } catch (error) {
      console.error("Failed to toggle lock", error);
      setErrorMessage("Failed to save floor plan placement.");
    }
  };

  async function handleRemoveItem(itemId: string) {
    if (!tenantId || !siteId || !selectedFloorPlanId) return;

    const placement = placements.find((p) => p.itemId === itemId);
    if (!placement) return;

    try {
      setErrorMessage(null);

      await BmsApi.deleteFloorPlanPlacement(
        tenantId,
        siteId,
        selectedFloorPlanId,
        placement.itemId,
        placement.itemType
      );

      setPlacements((prev) => prev.filter((p) => p.itemId !== itemId));

      if (selectedItemId === itemId) {
        setSelectedItemId(null);
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("Failed to remove floor plan placement.");
    }
  }

  async function handleFloorPlanChange(floorPlanId: string) {
    if (!tenantId || !siteId) return;

    setSelectedFloorPlanId(floorPlanId);
    setFloorPlanImageUrl(BmsApi.getFloorPlanFileUrl(tenantId, siteId, floorPlanId));
    setSelectedItemId(null);

    try {
      const placementData = await BmsApi.getFloorPlanPlacements(
        tenantId,
        siteId,
        floorPlanId
      );

      setPlacements(Array.isArray(placementData) ? placementData : []);
    } catch (error) {
      console.error(error);
      setPlacements([]);
      setErrorMessage("Failed to load floor plan placements.");
    }
  }

  function handleOpenUpdateModal() {
    if (!selectedFloorPlan) return;
    setUpdateName(selectedFloorPlan.name ?? "");
    setUpdateFloorPlanError(null);
    setOpenUpdateModal(true);
  }

  async function handleConfirmUpdateFloorPlan() {
    if (!tenantId || !siteId || !selectedFloorPlanId) return;

    const trimmedName = updateName.trim();

    if (!trimmedName) {
      setUpdateFloorPlanError("Floor plan name is required.");
      return;
    }

    try {
      setUpdatingFloorPlan(true);
      setUpdateFloorPlanError(null);

      await BmsApi.updateFloorPlanMetaData(tenantId, siteId, selectedFloorPlanId, {
        name: trimmedName,
      });

      setOpenUpdateModal(false);
      await loadData(selectedFloorPlanId);
    } catch (error) {
      console.error(error);
      setUpdateFloorPlanError("Failed to update floor plan.");
    } finally {
      setUpdatingFloorPlan(false);
    }
  }

  function handleOpenDeleteModal() {
    setDeleteFloorPlanError(null);
    setOpenDeleteModal(true);
  }

  async function handleConfirmDeleteFloorPlan() {
    if (!tenantId || !siteId || !selectedFloorPlanId) return;

    try {
      setDeletingFloorPlan(true);
      setDeleteFloorPlanError(null);

      const deletingId = selectedFloorPlanId;
      const remainingPlans = floorPlans.filter(
        (p) => (p.floorPlanId ?? p.id ?? "") !== deletingId
      );

      const nextSelectedId =
        remainingPlans.length > 0
          ? remainingPlans[0].floorPlanId ?? remainingPlans[0].id ?? null
          : null;

      await BmsApi.deleteFloorPlan(tenantId, siteId, deletingId);

      setOpenDeleteModal(false);
      setSelectedItemId(null);

      await loadData(nextSelectedId);
    } catch (error) {
      console.error(error);
      setDeleteFloorPlanError("Failed to delete floor plan.");
    } finally {
      setDeletingFloorPlan(false);
    }
  }

  const selectedItemName =
    hvacs.find((hvac) => (hvac.hvacId ?? "") === selectedItemId)?.hvacName ??
    hvacs.find((hvac) => (hvac.hvacId ?? "") === selectedItemId)?.name ??
    null;

  if (loading) {
    return (
      <div className={`${glassCard} p-6 text-slate-300`}>
        Loading floor plans...
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-6 text-rose-300 shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        {errorMessage}
      </div>
    );
  }

  if (!tenantId || !siteId) {
    return (
      <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-6 text-rose-300 shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        Tenant ID or Site ID is missing in the route.
      </div>
    );
  }

  if (!selectedFloorPlanId || !selectedFloorPlan || !floorPlanImageUrl) {
    return (
      <div className="space-y-6">
        <div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 shadow-[0_8px_30px_rgba(0,0,0,0.18)] backdrop-blur-xl transition hover:bg-white/10 hover:text-white"
            onClick={() => navigate(`/admin/tenants/query/${tenantId}/sites`)}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>

        <div className={`${glassCard} p-6`}>
          <h1 className="text-3xl font-bold text-white">View Floor Plan</h1>
          <p className="mt-2 text-slate-400">
            No floor plan found for this site. Upload a floor plan first.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 shadow-[0_8px_30px_rgba(0,0,0,0.18)] backdrop-blur-xl transition hover:bg-white/10 hover:text-white"
            onClick={() => navigate(`/admin/tenants/query/${tenantId}/sites`)}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>

        <div className={`${glassCard} p-6`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">
                <Sparkles className="h-4 w-4" />
                Floor Plan Workspace
              </div>

              <h1 className="mt-3 text-3xl font-bold text-white">
                View Floor Plan
              </h1>

              <p className="mt-2 text-slate-400">
                Manage floor plans, place HVAC devices, and maintain a smart visual layout for this site.
              </p>

              <p className="mt-3 text-sm text-slate-500">
                <span className="font-medium text-slate-300">Tenant:</span> {tenantId}
                <span className="mx-2 text-slate-600">•</span>
                <span className="font-medium text-slate-300">Site:</span> {siteId}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="min-w-[240px]">
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Floor Plan
                </label>
                <select
                  value={selectedFloorPlanId}
                  onChange={(e) => handleFloorPlanChange(e.target.value)}
                  className={inputClass}
                >
                  {floorPlans.map((plan) => {
                    const planId = plan.floorPlanId ?? plan.id ?? "";
                    return (
                      <option key={planId} value={planId} className="bg-slate-900 text-white">
                        {plan.name}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="flex flex-wrap items-end gap-3">
                <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-300">
                  <CheckSquare className="h-4 w-4" />
                  Active Plan Selected
                </div>

                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10 hover:text-white"
                  onClick={handleOpenUpdateModal}
                >
                  <Pencil className="h-4 w-4" />
                  Update
                </button>

                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-2xl bg-rose-500/90 px-4 py-3 text-sm font-medium text-white transition hover:bg-rose-500"
                  onClick={handleOpenDeleteModal}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>

        <FloorPlanToolbar
          floorPlanName={selectedFloorPlan.name}
          selectedItemName={selectedItemName}
          totalHvacs={hvacs.length}
          placedHvacs={placements.length}
          onClearSelection={() => setSelectedItemId(null)}
        />

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[340px_1fr]">
          <FloorPlanItemsPanel
            hvacs={hvacs}
            placements={placements}
            selectedItemId={selectedItemId}
            onSelectItem={setSelectedItemId}
            onToggleLock={handleToggleLock}
            onRemoveItem={handleRemoveItem}
          />

          <FloorPlanCanvas
            imageUrl={floorPlanImageUrl}
            hvacs={hvacs}
            placements={placements}
            selectedItemId={selectedItemId}
            onPlaceItem={handlePlaceItem}
            onMoveItem={handleMoveItem}
            onToggleLock={handleToggleLock}
            onRemoveItem={handleRemoveItem}
          />
        </div>
      </div>

      {openUpdateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-slate-950/90 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.14),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.12),transparent_24%)]" />

            <div className="relative border-b border-white/10 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-blue-300">
                    <ImageIcon className="h-5 w-5" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">
                      <Sparkles className="h-4 w-4" />
                      Update Floor Plan
                    </div>
                    <h2 className="mt-2 text-2xl font-bold text-white">
                      Rename Plan
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                      Change the floor plan name.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="rounded-2xl border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
                  onClick={() => {
                    if (updatingFloorPlan) return;
                    setOpenUpdateModal(false);
                    setUpdateFloorPlanError(null);
                  }}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="relative px-6 py-5">
              <label className="mb-2 block text-sm font-medium text-slate-200">
                Floor Plan Name
              </label>
              <input
                type="text"
                value={updateName}
                onChange={(e) => setUpdateName(e.target.value)}
                className={inputClass}
                placeholder="Enter floor plan name"
              />

              {updateFloorPlanError && (
                <div className="mt-4 flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{updateFloorPlanError}</span>
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-200 transition hover:bg-white/10"
                  onClick={() => {
                    if (updatingFloorPlan) return;
                    setOpenUpdateModal(false);
                    setUpdateFloorPlanError(null);
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-3 font-semibold text-white transition hover:scale-[1.02] disabled:opacity-60"
                  onClick={handleConfirmUpdateFloorPlan}
                  disabled={updatingFloorPlan}
                >
                  {updatingFloorPlan ? "Updating..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {openDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-slate-950/90 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(244,63,94,0.12),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.10),transparent_24%)]" />

            <div className="relative border-b border-white/10 px-6 py-5">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-300">
                  <Trash2 className="h-5 w-5" />
                </div>

                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-rose-300">
                    <AlertCircle className="h-4 w-4" />
                    Delete Floor Plan
                  </div>
                  <h2 className="mt-2 text-2xl font-bold text-white">
                    Confirm Delete
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative px-6 py-5">
              <p className="text-sm text-slate-300">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-white">
                  {selectedFloorPlan.name}
                </span>
                ?
              </p>

              {deleteFloorPlanError && (
                <div className="mt-4 flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{deleteFloorPlanError}</span>
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-200 transition hover:bg-white/10"
                  onClick={() => {
                    if (deletingFloorPlan) return;
                    setOpenDeleteModal(false);
                    setDeleteFloorPlanError(null);
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="rounded-2xl bg-rose-500 px-4 py-3 font-semibold text-white transition hover:bg-rose-600 disabled:opacity-60"
                  onClick={handleConfirmDeleteFloorPlan}
                  disabled={deletingFloorPlan}
                >
                  {deletingFloorPlan ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}