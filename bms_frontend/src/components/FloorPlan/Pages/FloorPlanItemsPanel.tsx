import { Fan, Lock, Unlock } from "lucide-react";
import type { HvacDto } from "@/api/bms";
import type { FloorPlanPlacement } from "../types/floorplan.types";

type Props = {
  hvacs: HvacDto[];
  placements: FloorPlanPlacement[];
  selectedItemId: string | null;
  onSelectItem: (itemId: string | null) => void;
  onToggleLock: (itemId: string) => void;
};

export default function FloorPlanItemsPanel({
  hvacs,
  placements,
  selectedItemId,
  onSelectItem,
  onToggleLock,
}: Props) {
  const placedIds = new Set(placements.map((p) => p.itemId));

  const placedHvacs = hvacs.filter((h) =>
    placedIds.has(h.hvacId ?? h.id ?? "")
  );

  const unplacedHvacs = hvacs.filter(
    (h) => !placedIds.has(h.hvacId ?? h.id ?? "")
  );

  const getPlacement = (itemId: string) =>
    placements.find((p) => p.itemId === itemId);

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Site HVACs</h3>
        <p className="mt-1 text-sm text-slate-500">
          Total: {hvacs.length} | Placed: {placedHvacs.length} | Unplaced:{" "}
          {unplacedHvacs.length}
        </p>
      </div>

      <div>
        <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Unplaced HVACs
        </h4>

        <div className="space-y-2">
          {unplacedHvacs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-3 text-sm text-slate-500">
              All HVACs are already placed.
            </div>
          ) : (
            unplacedHvacs.map((hvac) => {
              const hvacId = hvac.hvacId ?? hvac.id ?? "";
              const hvacName = hvac.hvacName ?? hvac.name ?? "Unnamed HVAC";
              const active = selectedItemId === hvacId;

              return (
                <button
                  key={hvacId}
                  type="button"
                  onClick={() => onSelectItem(active ? null : hvacId)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${
                    active
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <Fan className="h-5 w-5 text-slate-600" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-900">
                      {hvacName}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {hvac.deviceId || "No device id"}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div>
        <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Placed HVACs
        </h4>

        <div className="space-y-2">
          {placedHvacs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-3 text-sm text-slate-500">
              No HVACs placed yet.
            </div>
          ) : (
            placedHvacs.map((hvac) => {
              const hvacId = hvac.hvacId ?? hvac.id ?? "";
              const hvacName = hvac.hvacName ?? hvac.name ?? "Unnamed HVAC";
              const placement = getPlacement(hvacId);

              if (!placement) return null;

              return (
                <div
                  key={hvacId}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3"
                >
                  <Fan className="h-5 w-5 text-slate-600" />

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-900">
                      {hvacName}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      X: {placement.x.toFixed(1)}% | Y: {placement.y.toFixed(1)}%
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onToggleLock(hvacId)}
                    className={`rounded-lg p-2 ${
                      placement.locked
                        ? "bg-slate-700 text-white hover:bg-slate-800"
                        : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                    }`}
                    title={placement.locked ? "Unlock item" : "Lock item"}
                  >
                    {placement.locked ? (
                      <Lock className="h-4 w-4" />
                    ) : (
                      <Unlock className="h-4 w-4" />
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}