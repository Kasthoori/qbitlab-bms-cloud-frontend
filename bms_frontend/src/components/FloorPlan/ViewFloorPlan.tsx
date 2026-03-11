import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BmsApi, type FloorPlanDto, type HvacDto } from "@/api/bms";
import type { FloorPlanPlacement } from "./types/floorplan.types";
import {
  loadPlacements,
  savePlacements,
} from "./utils/FloorPlanPlacementStorage";
import FloorPlanCanvas from "./Pages/FloorPlanCanvas";
import FloorPlanItemsPanel from "./Pages/FloorPlanItemsPanel";
import FloorPlanToolbar from "./Pages/FloorPlanToolbar";

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
      floorPlans.find(
        (p) => (p.floorPlanId ?? p.id ?? "") === selectedFloorPlanId
      ) ?? null
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
      setFloorPlanImageUrl(
        BmsApi.getFloorPlanFileUrl(tenantId, siteId, targetPlanId)
      );
      setPlacements(loadPlacements(tenantId, siteId, targetPlanId));
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

  function persist(next: FloorPlanPlacement[], floorPlanId?: string | null) {
    if (!tenantId || !siteId) return;

    const targetFloorPlanId = floorPlanId ?? selectedFloorPlanId;
    if (!targetFloorPlanId) return;

    setPlacements(next);
    savePlacements(tenantId, siteId, targetFloorPlanId, next);
  }

  function handleFloorPlanChange(floorPlanId: string) {
    if (!tenantId || !siteId) return;

    setSelectedFloorPlanId(floorPlanId);
    setFloorPlanImageUrl(
      BmsApi.getFloorPlanFileUrl(tenantId, siteId, floorPlanId)
    );
    setPlacements(loadPlacements(tenantId, siteId, floorPlanId));
    setSelectedItemId(null);
  }

  function handlePlaceItem(hvac: HvacDto, x: number, y: number) {
    if (!selectedFloorPlanId) return;

    const hvacId = hvac.hvacId ?? hvac.id ?? "";
    const hvacName = hvac.hvacName ?? hvac.name ?? "Unnamed HVAC";

    if (!hvacId) return;

    const alreadyExists = placements.some((p) => p.itemId === hvacId);
    if (alreadyExists) return;

    const next: FloorPlanPlacement[] = [
      ...placements,
      {
        itemId: hvacId,
        itemType: "HVAC",
        itemName: hvacName,
        x,
        y,
        locked: true,
      },
    ];

    persist(next, selectedFloorPlanId);
    setSelectedItemId(null);
  }

  function handleMoveItem(itemId: string, x: number, y: number) {
    const next = placements.map((placement) =>
      placement.itemId === itemId ? { ...placement, x, y } : placement
    );
    persist(next);
  }

  function handleToggleLock(itemId: string) {
    const next = placements.map((placement) =>
      placement.itemId === itemId
        ? { ...placement, locked: !placement.locked }
        : placement
    );
    persist(next);
  }

  function handleRemoveItem(itemId: string) {
    const next = placements.filter((placement) => placement.itemId !== itemId);
    persist(next);

    if (selectedItemId === itemId) {
      setSelectedItemId(null);
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

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        Loading floor plans...
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm">
        {errorMessage}
      </div>
    );
  }

  if (!tenantId || !siteId) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm">
        Tenant ID or Site ID is missing in the route.
      </div>
    );
  }

  if (!selectedFloorPlanId || !selectedFloorPlan || !floorPlanImageUrl) {
    return (
      <div className="space-y-4">
        <div className="mb-4 flex items-center gap-3">
          <button
            className="rounded-xl border px-4 py-2 text-slate-700 hover:bg-slate-50"
            onClick={() => navigate(`/admin/tenants/query/${tenantId}/sites`)}
          >
            ← Back
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">View Floor Plan</h1>
          <p className="mt-2 text-slate-500">
            No floor plan found for this site. Upload a floor plan first.
          </p>
        </div>
      </div>
    );
  }

  const selectedItemName =
    hvacs.find((hvac) => (hvac.hvacId ?? hvac.id ?? "") === selectedItemId)
      ?.hvacName ??
    hvacs.find((hvac) => (hvac.hvacId ?? hvac.id ?? "") === selectedItemId)
      ?.name ??
    null;

  return (
    <>
      <div className="mb-4 flex items-center gap-3">
        <button
          className="rounded-xl border px-4 py-2 text-slate-700 hover:bg-slate-50"
          onClick={() => navigate(`/admin/tenants/query/${tenantId}/sites`)}
        >
          ← Back
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium text-slate-700">Floor Plan</label>

          <select
            value={selectedFloorPlanId}
            onChange={(e) => handleFloorPlanChange(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 outline-none focus:border-blue-500"
          >
            {floorPlans.map((plan) => {
              const planId = plan.floorPlanId ?? plan.id ?? "";
              return (
                <option key={planId} value={planId}>
                  {plan.name}
                </option>
              );
            })}
          </select>

          <button
            className="rounded-xl border border-blue-300 px-4 py-2 text-blue-700 hover:bg-blue-50"
            onClick={handleOpenUpdateModal}
          >
            Update Floor Plan
          </button>

          <button
            className="rounded-xl border border-red-300 px-4 py-2 text-red-700 hover:bg-red-50"
            onClick={handleOpenDeleteModal}
          >
            Delete Floor Plan
          </button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-slate-900">Update Floor Plan</h2>
            <p className="mt-1 text-sm text-slate-500">
              Change the floor plan name.
            </p>

            <div className="mt-4">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Floor Plan Name
              </label>
              <input
                type="text"
                value={updateName}
                onChange={(e) => setUpdateName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none focus:border-blue-500"
                placeholder="Enter floor plan name"
              />
            </div>

            {updateFloorPlanError && (
              <p className="mt-3 text-sm text-red-600">{updateFloorPlanError}</p>
            )}

            <div className="mt-5 flex justify-end gap-3">
              <button
                className="rounded-xl border px-4 py-2 text-slate-700 hover:bg-slate-50"
                onClick={() => {
                  if (updatingFloorPlan) return;
                  setOpenUpdateModal(false);
                  setUpdateFloorPlanError(null);
                }}
              >
                Cancel
              </button>

              <button
                className="rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={handleConfirmUpdateFloorPlan}
                disabled={updatingFloorPlan}
              >
                {updatingFloorPlan ? "Updating..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {openDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-slate-900">Delete Floor Plan</h2>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-slate-900">
                {selectedFloorPlan.name}
              </span>
              ?
            </p>
            <p className="mt-1 text-sm text-red-600">
              This action cannot be undone.
            </p>

            {deleteFloorPlanError && (
              <p className="mt-3 text-sm text-red-600">{deleteFloorPlanError}</p>
            )}

            <div className="mt-5 flex justify-end gap-3">
              <button
                className="rounded-xl border px-4 py-2 text-slate-700 hover:bg-slate-50"
                onClick={() => {
                  if (deletingFloorPlan) return;
                  setOpenDeleteModal(false);
                  setDeleteFloorPlanError(null);
                }}
              >
                Cancel
              </button>

              <button
                className="rounded-xl bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={handleConfirmDeleteFloorPlan}
                disabled={deletingFloorPlan}
              >
                {deletingFloorPlan ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}