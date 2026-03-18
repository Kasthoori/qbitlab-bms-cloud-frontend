import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Fan, ArrowLeft, Search } from "lucide-react";
import { keycloak } from "@/keycloak";
import { BmsApi, type FloorPlanDto, type HvacDto } from "@/api/bms";
import type { FloorPlanPlacement } from '../../../types/floorplan.types'

export default function UserViewFloorPlan() {
  const navigate = useNavigate();
  const { tenantId, siteId } = useParams<{ tenantId: string; siteId: string }>();

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [floorPlans, setFloorPlans] = useState<FloorPlanDto[]>([]);
  const [selectedFloorPlanId, setSelectedFloorPlanId] = useState<string | null>(null);
  const [floorPlanImageUrl, setFloorPlanImageUrl] = useState("");

  const [hvacs, setHvacs] = useState<HvacDto[]>([]);
  const [placements, setPlacements] = useState<FloorPlanPlacement[]>([]);

  const [resolvedImageUrl, setResolvedImageUrl] = useState<string | null>(null);
  const [imageLoadError, setImageLoadError] = useState<string | null>(null);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

  const selectedFloorPlan = useMemo(() => {
    return (
      floorPlans.find(
        (p) => (p.floorPlanId ?? p.id ?? "") === selectedFloorPlanId
      ) ?? null
    );
  }, [floorPlans, selectedFloorPlanId]);

  const hvacMap = useMemo(() => {
    return new Map(hvacs.map((h) => [h.hvacId ?? h.id ?? "", h] as const));
  }, [hvacs]);

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
        return;
      }

      setSelectedFloorPlanId(targetPlanId);
      setFloorPlanImageUrl(
        BmsApi.getFloorPlanFileUrl(tenantId, siteId, targetPlanId)
      );

      const placementData = await BmsApi.getFloorPlanPlacements(
        tenantId,
        siteId,
        targetPlanId
      );

      setPlacements(Array.isArray(placementData) ? placementData : []);
    } catch (error) {
      console.error(error);
      setErrorMessage("Failed to load floor plans or HVACs.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [tenantId, siteId]);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    async function loadProtectedImage() {
      if (!floorPlanImageUrl) {
        setResolvedImageUrl(null);
        return;
      }

      setImageLoadError(null);
      setResolvedImageUrl(null);

      try {
        if (!keycloak) {
          throw new Error("Keycloak is not available.");
        }

        await keycloak.updateToken(30);

        if (!keycloak.token) {
          throw new Error("No Keycloak access token available.");
        }

        const res = await fetch(floorPlanImageUrl, {
          headers: {
            Authorization: `Bearer ${keycloak.token}`,
          },
        });

        if (!res.ok) {
          throw new Error(`Failed to load floor plan (${res.status})`);
        }

        const blob = await res.blob();
        objectUrl = URL.createObjectURL(blob);

        if (!cancelled) {
          setResolvedImageUrl(objectUrl);
        }
      } catch (err) {
        if (!cancelled) {
          setImageLoadError(
            err instanceof Error ? err.message : "Failed to load floor plan"
          );
        }
      }
    }

    loadProtectedImage();

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [floorPlanImageUrl]);

  async function handleFloorPlanChange(floorPlanId: string) {
    if (!tenantId || !siteId) return;

    setSelectedFloorPlanId(floorPlanId);
    setFloorPlanImageUrl(
      BmsApi.getFloorPlanFileUrl(tenantId, siteId, floorPlanId)
    );
    setHoveredItemId(null);

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

  function formatLastSeen(value?: string) {
    if (!value) return "-";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString();
  }

  function getStatusDotClass(status?: string) {
    switch ((status ?? "").toUpperCase()) {
      case "ONLINE":
        return "bg-emerald-500";
      case "OFFLINE":
        return "bg-red-500";
      case "WARNING":
        return "bg-amber-500";
      default:
        return "bg-slate-400";
    }
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        Loading floor plans...
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm">
        {errorMessage}
      </div>
    );
  }

  if (!tenantId || !siteId) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm">
        Tenant ID or Site ID is missing in the route.
      </div>
    );
  }

  if (!selectedFloorPlanId || !selectedFloorPlan || !floorPlanImageUrl) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">View Floor Plan</h1>
          <p className="mt-2 text-slate-500">
            No floor plan found for this site.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">
              Floor Plans
            </p>
            <h1 className="mt-2 text-3xl font-bold">Site Floor Plan</h1>
            <p className="mt-2 text-sm text-slate-200">
              Hover over an HVAC marker to inspect equipment details.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm font-medium text-slate-200">Floor Plan</label>

            <select
              value={selectedFloorPlanId}
              onChange={(e) => handleFloorPlanChange(e.target.value)}
              className="rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white outline-none backdrop-blur"
            >
              {floorPlans.map((plan) => {
                const planId = plan.floorPlanId ?? plan.id ?? "";
                return (
                  <option key={planId} value={planId} className="text-slate-900">
                    {plan.name}
                  </option>
                );
              })}
            </select>

            <div className="rounded-2xl bg-white/10 px-4 py-2.5 text-sm text-slate-100 backdrop-blur">
              Visible HVACs: {placements.length}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div
          className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-100"
          style={{ minHeight: 600 }}
        >
          {imageLoadError ? (
            <div className="flex min-h-[600px] items-center justify-center p-6 text-center text-red-600">
              {imageLoadError}
            </div>
          ) : resolvedImageUrl ? (
            <img
              src={resolvedImageUrl}
              alt="Floor plan"
              className="block h-auto w-full select-none object-contain"
              draggable={false}
            />
          ) : (
            <div className="flex min-h-[600px] items-center justify-center p-6 text-slate-500">
              Loading floor plan...
            </div>
          )}

          {resolvedImageUrl &&
            placements.map((placement) => {
              const hvac = hvacMap.get(placement.itemId);
              const hvacName =
                hvac?.hvacName ?? hvac?.name ?? placement.itemName ?? "Unnamed HVAC";

              return (
                <div
                  key={placement.itemId}
                  className="absolute"
                  style={{
                    left: `${placement.x}%`,
                    top: `${placement.y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                  onMouseEnter={() => setHoveredItemId(placement.itemId)}
                  onMouseLeave={() =>
                    setHoveredItemId((prev) =>
                      prev === placement.itemId ? null : prev
                    )
                  }
                >
                  <div className="relative">
                    <div className="flex min-w-[130px] items-center gap-2 rounded-xl border border-blue-500 bg-white px-3 py-2 text-slate-900 shadow-lg transition hover:scale-[1.02]">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                        <Fan
                          className="h-4 w-4 animate-spin"
                          style={{ animationDuration: "2s" }}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${getStatusDotClass(
                              hvac?.status
                            )}`}
                          />
                          <p className="truncate text-xs font-semibold">
                            {hvacName}
                          </p>
                        </div>

                        <p className="truncate text-[11px] text-slate-500">
                          {hvac?.deviceId || "No device ID"}
                        </p>
                      </div>
                    </div>

                    {hoveredItemId === placement.itemId && hvac && (
                      <div className="absolute left-1/2 top-[calc(100%+10px)] z-20 w-72 -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-2xl">
                        <div className="mb-3 flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                            <Fan
                              className="h-5 w-5 animate-spin"
                              style={{ animationDuration: "2s" }}
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">
                              {hvac.hvacName ?? hvac.name ?? "Unnamed HVAC"}
                            </p>
                            <p className="truncate text-xs text-slate-500">
                              {hvac.deviceId || "No device ID"}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-400">
                              Protocol
                            </p>
                            <p className="font-medium text-slate-700">
                              {hvac.protocol || "-"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-400">
                              Unit Type
                            </p>
                            <p className="font-medium text-slate-700">
                              {hvac.unitType || "-"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-400">
                              Status
                            </p>
                            <p className="font-medium text-slate-700">
                              {hvac.status || "-"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-400">
                              Temperature
                            </p>
                            <p className="font-medium text-slate-700">
                              {typeof hvac.temperature === "number"
                                ? `${hvac.temperature}°C`
                                : "-"}
                            </p>
                          </div>

                          <div className="col-span-2">
                            <p className="text-xs uppercase tracking-wide text-slate-400">
                              Last Seen
                            </p>
                            <p className="font-medium text-slate-700">
                              {formatLastSeen(hvac.lastSeenAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}