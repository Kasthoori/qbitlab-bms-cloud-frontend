/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Fan,
  ArrowLeft,
  Sparkles,
  Map as MapIcon,
  AlertCircle,
  CheckSquare,
  Thermometer,
} from "lucide-react";
import { BmsApi, type FloorPlanDto, type HvacDto } from "@/api/bms";
import type { FloorPlanPlacement } from "../../../types/floorplan.types";
import { isFailedHvac } from "@/utils/hvac.utils";
import { useProtectedImageUrl } from "@/hooks/useProtectedImageUrl";

const glassCard =
  "rounded-3xl border border-white/10 bg-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl";

const glassButton =
  "inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 shadow-[0_8px_30px_rgba(0,0,0,0.18)] transition hover:bg-white/10 hover:text-white";

const glassInput =
  "rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition backdrop-blur focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30";

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
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

  const { resolvedImageUrl, imageLoadError, imageLoading } =
    useProtectedImageUrl(floorPlanImageUrl);

  const selectedFloorPlan = useMemo(() => {
    return (
      floorPlans.find(
        (p) => (p.floorPlanId ?? p.id ?? "") === selectedFloorPlanId
      ) ?? null
    );
  }, [floorPlans, selectedFloorPlanId]);

  const hvacMap = useMemo(() => {
      return new Map<string, HvacDto>(
        hvacs.map((h) => [h.hvacId ?? "", h])
      );
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
        BmsApi.getHvacFloorPlanDetails(tenantId, siteId),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, siteId]);

  async function handleFloorPlanChange(floorPlanId: string) {
    if (!tenantId || !siteId) return;

    setSelectedFloorPlanId(floorPlanId);
    setFloorPlanImageUrl(BmsApi.getFloorPlanFileUrl(tenantId, siteId, floorPlanId));
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

  function formatTemp(value?: number | null) {
    if (value == null) return "-";
    return `${value.toFixed(1)}°C`;
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
      case "FAILED":
      case "FAULT":
        return "bg-red-500";
      case "WARNING":
        return "bg-amber-500";
      default:
        return "bg-slate-400";
    }
  }

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
            onClick={() => navigate(-1)}
            className={glassButton}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>

        <div className={`${glassCard} p-6`}>
          <h1 className="text-3xl font-bold text-white">View Floor Plan</h1>
          <p className="mt-2 text-slate-400">
            No floor plan found for this site.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className={glassButton}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(135deg,rgba(2,6,23,0.96),rgba(15,23,42,0.94),rgba(30,41,59,0.94))] p-6 text-white shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">
              <Sparkles className="h-4 w-4" />
              Floor Plans
            </div>

            <h1 className="mt-3 text-3xl font-bold">Site Floor Plan</h1>
            <p className="mt-2 text-sm text-slate-300">
              Hover over an HVAC marker to inspect equipment details.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-300">
                <MapIcon className="h-3.5 w-3.5" />
                {selectedFloorPlan.name ?? "Floor Plan"}
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300">
                <CheckSquare className="h-3.5 w-3.5" />
                Visible HVACs: {placements.length}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm font-medium text-slate-300">Floor Plan</label>

            <select
              value={selectedFloorPlanId}
              onChange={(e) => handleFloorPlanChange(e.target.value)}
              className={glassInput}
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
        </div>
      </div>

      <div className={`${glassCard} p-4`}>
        <div
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/40"
          style={{ minHeight: 600 }}
        >
          {imageLoadError ? (
            <div className="flex min-h-150 items-center justify-center p-6 text-center text-rose-300">
              <div className="flex items-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3">
                <AlertCircle className="h-5 w-5" />
                {imageLoadError}
              </div>
            </div>
          ) : resolvedImageUrl ? (
            <img
              src={resolvedImageUrl}
              alt="Floor plan"
              className="block h-auto w-full select-none object-contain"
              draggable={false}
            />
          ) : (
            <div className="flex min-h-150 items-center justify-center p-6 text-slate-400">
              {imageLoading ? "Loading floor plan..." : "No floor plan image"}
            </div>
          )}

          {resolvedImageUrl &&
            placements.map((placement) => {
              const hvac = hvacMap.get(placement.itemId);
              const failed = isFailedHvac(hvac);
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
                    <div
                      className={`flex min-w-35 items-center gap-2 rounded-2xl border px-3 py-2.5 shadow-2xl backdrop-blur-xl transition hover:scale-[1.02] ${
                        failed
                          ? "border-rose-500/30 bg-rose-500/10 text-rose-100"
                          : "border-cyan-400/20 bg-slate-950/75 text-white"
                      }`}
                    >
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                          failed
                            ? "bg-rose-500/10 text-rose-300"
                            : "bg-cyan-500/10 text-cyan-300"
                        }`}
                      >
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

                        <p
                          className={`truncate text-[11px] ${
                            failed ? "text-rose-200" : "text-slate-400"
                          }`}
                        >
                          {failed ? "Fault detected" : hvac?.deviceId || "No device ID"}
                        </p>
                      </div>
                    </div>

                    {hoveredItemId === placement.itemId && hvac && (
                      <div className="absolute left-1/2 top-[calc(100%+10px)] z-20 w-72 -translate-x-1/2 rounded-3xl border border-white/10 bg-slate-950/95 p-4 text-white shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
                        <div className="mb-3 flex items-center gap-3">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                              failed
                                ? "bg-rose-500/10 text-rose-300"
                                : "bg-cyan-500/10 text-cyan-300"
                            }`}
                          >
                            <Fan
                              className="h-5 w-5 animate-spin"
                              style={{ animationDuration: "2s" }}
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">
                              {hvac.hvacName ?? hvac.name ?? "Unnamed HVAC"}
                            </p>
                            <p className="truncate text-xs text-slate-400">
                              {hvac.deviceId || "No device ID"}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-500">
                              Protocol
                            </p>
                            <p className="font-medium text-slate-200">
                              {hvac.protocol || "-"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-500">
                              Unit Type
                            </p>
                            <p className="font-medium text-slate-200">
                              {hvac.unitType || "-"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-500">
                              Status
                            </p>
                            <p
                              className={`font-medium ${
                                failed ? "text-rose-300" : "text-slate-200"
                              }`}
                            >
                              {hvac.status || "-"}
                            </p>
                          </div>

                          <div>
                            <p className="inline-flex items-center gap-1 text-xs uppercase tracking-wide text-slate-500">
                              <Thermometer className="h-3.5 w-3.5" />
                              Temperature
                            </p>
                            <p className="font-medium text-slate-200">
                              {formatTemp(hvac.temperature)}
                            </p>
                          </div>

                          <div className="col-span-2">
                            <p className="text-xs uppercase tracking-wide text-slate-500">
                              Last Seen
                            </p>
                            <p className="font-medium text-slate-200">
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