import { useEffect, useRef, useState } from "react";
import { Fan, Lock, Unlock, Trash2 } from "lucide-react";
import { keycloak } from "@/keycloak";
import type { HvacDto } from "@/api/bms";
import type { FloorPlanPlacement } from "../types/floorplan.types";

type Props = {
  imageUrl: string;
  hvacs: HvacDto[];
  placements: FloorPlanPlacement[];
  selectedItemId: string | null;
  onPlaceItem: (hvac: HvacDto, x: number, y: number) => void;
  onMoveItem: (itemId: string, x: number, y: number) => void;
  onToggleLock: (itemId: string) => void;
  onRemoveItem: (itemId: string) => void;
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
  const [resolvedImageUrl, setResolvedImageUrl] = useState<string | null>(null);
  const [imageLoadError, setImageLoadError] = useState<string | null>(null);

  const selectedHvac =
    hvacs.find((h) => (h.hvacId ?? h.id ?? "") === selectedItemId) ?? null;

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    console.log("FloorPlanCanvas imageUrl:", imageUrl);

    async function loadProtectedImage() {
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

        const res = await fetch(imageUrl, {
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
  }, [imageUrl]);

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
    if (placement.locked || !resolvedImageUrl) return;

    e.stopPropagation();
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    setDragState({ itemId: placement.itemId });
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragState || !resolvedImageUrl) return;

    const point = clientToPercent(e.clientX, e.clientY);
    if (!point) return;

    onMoveItem(dragState.itemId, point.x, point.y);
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (dragState) {
      try {
        (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore pointer release issues
      }
    }
    setDragState(null);
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
            Loading floor plan...
          </div>
        )}

        {resolvedImageUrl &&
          placements.map((placement) => (
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
            >
              <div
                className={`flex items-center gap-2 rounded-full border px-3 py-2 shadow-lg ${
                  placement.locked
                    ? "border-slate-700 bg-slate-800 text-white"
                    : "border-blue-600 bg-blue-600 text-white"
                }`}
              >
                <Fan className="h-4 w-4" />

                <span className="max-w-40 truncate text-xs font-medium">
                  {placement.itemName}
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleLock(placement.itemId);
                  }}
                  className="rounded-full bg-white/20 p-1 hover:bg-white/30"
                  title={placement.locked ? "Unlock item" : "Lock item"}
                >
                  {placement.locked ? (
                    <Lock className="h-3.5 w-3.5" />
                  ) : (
                    <Unlock className="h-3.5 w-3.5" />
                  )}
                </button>
                <button
                    type="button"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onRemoveItem(placement.itemId);
                    }}
                    className="rounded-full bg-red-500/80 p-1 hover:bg-red-500"
                    title="Remove from floor plan"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
              </div>
            </div>
          ))}

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