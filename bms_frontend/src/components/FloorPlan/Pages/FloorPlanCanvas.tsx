import { useMemo, useRef, useState } from "react";
import { Fan, Lock, Unlock, Trash2, Loader2 } from "lucide-react";
import type { HvacDto } from "@/api/bms";
import type { FloorPlanPlacement } from "../types/floorplan.types";
import { isFailedHvac } from "@/utils/hvac.utils";
import { useProtectedImageUrl } from "@/hooks/useProtectedImageUrl";

type Props = {
  imageUrl: string;
  hvacs: HvacDto[];
  placements: FloorPlanPlacement[];
  selectedItemId: string | null;
  onPlaceItem: (hvac: HvacDto, x: number, y: number) => void;
  onMoveItem: (itemId: string, x: number, y: number) => void;
  onToggleLock: (itemId: string, locked: boolean) => Promise<void> | void;
  onRemoveItem: (itemId: string) => Promise<void> | void;
};

type DragState = {
  itemId: string;
} | null;

export default function FloorPlanCanvas({
  imageUrl,
  hvacs,
  placements,
  selectedItemId,
  onPlaceItem,
  onMoveItem,
  onToggleLock,
  onRemoveItem,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [dragState, setDragState] = useState<DragState>(null);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const [savingItemId, setSavingItemId] = useState<string | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  const { resolvedImageUrl, imageLoadError, imageLoading } =
    useProtectedImageUrl(imageUrl);

  const selectedHvac =
    hvacs.find((h) => (h.hvacId ?? h.externalDeviceId ?? "") === selectedItemId) ?? null;

  const hvacMap = useMemo(() => {
    return new Map(hvacs.map((h) => [h.hvacId ?? h.externalDeviceId ?? "", h] as const));
  }, [hvacs]);

  function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
  }

  function clientToPercent(clientX: number, clientY: number) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return null;

    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;

    return {
      x: clamp(x, 0, 100),
      y: clamp(y, 0, 100),
    };
  }

  function handleCanvasClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!selectedHvac || !resolvedImageUrl) return;

    const point = clientToPercent(e.clientX, e.clientY);
    if (!point) return;

    onPlaceItem(selectedHvac, point.x, point.y);
  }

  function handlePointerDown(
    e: React.PointerEvent<HTMLDivElement>,
    placement: FloorPlanPlacement
  ) {
    if (
      placement.locked ||
      !resolvedImageUrl ||
      savingItemId === placement.itemId
    ) {
      return;
    }

    e.stopPropagation();
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    setDragState({ itemId: placement.itemId });
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragState || !resolvedImageUrl) return;

    const activePlacement = placements.find((p) => p.itemId === dragState.itemId);
    if (!activePlacement || activePlacement.locked) return;

    const point = clientToPercent(e.clientX, e.clientY);
    if (!point) return;

    onMoveItem(dragState.itemId, point.x, point.y);
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (dragState) {
      try {
        (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
    setDragState(null);
  }

  async function handleToggleLock(
    e: React.MouseEvent<HTMLButtonElement>,
    placement: FloorPlanPlacement
  ) {
    e.stopPropagation();

    try {
      setSavingItemId(placement.itemId);
      await onToggleLock(placement.itemId, !placement.locked);
    } finally {
      setSavingItemId(null);
    }
  }

  async function handleRemove(
    e: React.MouseEvent<HTMLButtonElement>,
    placement: FloorPlanPlacement
  ) {
    e.preventDefault();
    e.stopPropagation();

    try {
      setDeletingItemId(placement.itemId);
      await onRemoveItem(placement.itemId);
    } finally {
      setDeletingItemId(null);
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

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100"
        style={{ minHeight: 600 }}
        onClick={handleCanvasClick}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
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
            {imageLoading ? "Loading floor plan..." : "No floor plan image"}
          </div>
        )}

        {resolvedImageUrl &&
          placements.map((placement) => {
            const hvac = hvacMap.get(placement.itemId);
            const failed = isFailedHvac(hvac);
            const hvacName =
              hvac?.hvacName ?? hvac?.name ?? placement.itemName ?? "Unnamed HVAC";

            const isSaving = savingItemId === placement.itemId;
            const isDeleting = deletingItemId === placement.itemId;

            return (
              <div
                key={placement.itemId}
                className="absolute"
                style={{
                  left: `${placement.x}%`,
                  top: `${placement.y}%`,
                  transform: "translate(-50%, -50%)",
                  touchAction: "none",
                }}
                onPointerDown={(e) => handlePointerDown(e, placement)}
                onMouseEnter={() => setHoveredItemId(placement.itemId)}
                onMouseLeave={() =>
                  setHoveredItemId((prev) =>
                    prev === placement.itemId ? null : prev
                  )
                }
              >
                <div className="relative">
                  <div
                    className={`flex min-w-[130px] items-center gap-2 rounded-xl border px-3 py-2 shadow-lg transition ${
                      placement.locked
                        ? "border-slate-700 bg-slate-800 text-white"
                        : failed
                          ? "border-red-500 bg-red-50 text-red-900"
                          : "border-blue-500 bg-white text-slate-900"
                    } ${isSaving ? "opacity-80" : ""}`}
                  >
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                        placement.locked
                          ? "bg-white/15 text-white"
                          : failed
                            ? "bg-red-100 text-red-700"
                            : "bg-blue-100 text-blue-700"
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
                        <p className="truncate text-xs font-semibold">{hvacName}</p>
                      </div>

                      <p
                        className={`truncate text-[11px] ${
                          placement.locked
                            ? "text-slate-300"
                            : failed
                              ? "text-red-700"
                              : "text-slate-500"
                        }`}
                      >
                        {failed ? "Fault detected" 
                        : hvac?.externalDeviceId || hvac?.deviceId || "No device ID"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => handleToggleLock(e, placement)}
                      disabled={isSaving || isDeleting}
                      className={`rounded-full p-1 transition disabled:cursor-not-allowed disabled:opacity-60 ${
                        placement.locked
                          ? "bg-white/15 hover:bg-white/25"
                          : "bg-slate-100 hover:bg-slate-200"
                      }`}
                      title={placement.locked ? "Unlock item" : "Lock item"}
                    >
                      {isSaving ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : placement.locked ? (
                        <Lock className="h-3.5 w-3.5" />
                      ) : (
                        <Unlock className="h-3.5 w-3.5" />
                      )}
                    </button>

                    <button
                      type="button"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => handleRemove(e, placement)}
                      disabled={isSaving || isDeleting}
                      className="rounded-full bg-red-500/90 p-1 text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                      title="Remove from floor plan"
                    >
                      {isDeleting ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>

                  {hoveredItemId === placement.itemId && hvac && (
                    <div className="absolute left-1/2 top-[calc(100%+10px)] z-20 w-72 -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-2xl">
                      <div className="mb-3 flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                            failed
                              ? "bg-red-100 text-red-700"
                              : "bg-blue-100 text-blue-700"
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
                          <p className="truncate text-xs text-slate-500">
                            {hvac.externalDeviceId || hvac.deviceId || "No device ID"}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-400">
                            Protocol
                          </p>
                          <p className="font-medium text-slate-700">
                            {hvac?.protocol || "-"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-400">
                            Unit Type
                          </p>
                          <p className="font-medium text-slate-700">
                            {hvac?.unitType || "-"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-400">
                            Status
                          </p>
                          <p
                            className={`font-medium ${
                              failed ? "text-red-700" : "text-slate-700"
                            }`}
                          >
                            {hvac?.status || "-"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-400">
                            Temperature
                          </p>
                          <p className="font-medium text-slate-700">
                            {/* {typeof hvac?.temperature === "number"
                              ? `${hvac.temperature}°C`
                              : "-"} */}
                            {formatTemp(hvac?.temperature)}
                          </p>
                        </div>

                        <div className="col-span-2">
                          <p className="text-xs uppercase tracking-wide text-slate-400">
                            Last Seen
                          </p>
                          <p className="font-medium text-slate-700">
                            {formatLastSeen(hvac?.lastSeenAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

        {resolvedImageUrl && selectedHvac && (
          <div className="pointer-events-none absolute bottom-4 left-4 rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-lg">
            Click on the plan to place:{" "}
            {selectedHvac.hvacName ?? selectedHvac.name ?? "Unnamed HVAC"}
          </div>
        )}
      </div>
    </div>
  );
}