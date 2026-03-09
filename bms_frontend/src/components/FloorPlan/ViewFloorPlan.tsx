import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  BmsApi,
  type FloorPlanDto,
  type HvacDto,
} from "@/api/bms";
import type { FloorPlanPlacement } from "./types/floorplan.types";
import {
  loadPlacements,
  savePlacements,
} from "./utils/FloorPlanPlacementStorage";
import FloorPlanCanvas from "./Pages/FloorPlanCanvas";
import FloorPlanItemsPanel from "./Pages/FloorPlanItemsPanel";
import FloorPlanToolbar from "./Pages/FloorPlanToolbar";

export default function ViewFloorPlan() {
  const { tenantId, siteId } = useParams<{ tenantId: string; siteId: string }>();

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [floorPlans, setFloorPlans] = useState<FloorPlanDto[]>([]);
  const [selectedFloorPlanId, setSelectedFloorPlanId] = useState<string | null>(null);
  const [floorPlanImageUrl, setFloorPlanImageUrl] = useState("");

  const [hvacs, setHvacs] = useState<HvacDto[]>([]);
  const [placements, setPlacements] = useState<FloorPlanPlacement[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const selectedFloorPlan = useMemo(() => {
    return (
      floorPlans.find(
        (p) => (p.floorPlanId ?? p.id ?? "") === selectedFloorPlanId
      ) ?? null
    );
  }, [floorPlans, selectedFloorPlanId]);

  useEffect(() => {
    async function loadData() {
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

        if (safePlans.length > 0) {
          const firstPlan = safePlans[0];
          const firstPlanId = firstPlan.floorPlanId ?? firstPlan.id ?? "";

          if (!firstPlanId) {
            setErrorMessage("First floor plan does not contain an id.");
            setSelectedFloorPlanId(null);
            setFloorPlanImageUrl("");
            setPlacements([]);
          } else {
            setSelectedFloorPlanId(firstPlanId);
            setFloorPlanImageUrl(
              BmsApi.getFloorPlanFileUrl(tenantId, siteId, firstPlanId)
            );
            setPlacements(loadPlacements(tenantId, siteId, firstPlanId));
          }
        } else {
          setSelectedFloorPlanId(null);
          setFloorPlanImageUrl("");
          setPlacements([]);
        }
      } catch (error) {
        console.error(error);
        setErrorMessage("Failed to load floor plans or HVACs.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
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
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">View Floor Plan</h1>
        <p className="mt-2 text-slate-500">
          No floor plan found for this site. Upload a floor plan first.
        </p>
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
  );
}