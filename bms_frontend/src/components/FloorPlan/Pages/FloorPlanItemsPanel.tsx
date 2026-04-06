import { Fan, Lock, Unlock, Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import type { HvacDto } from "@/api/bms";
import type { FloorPlanPlacement } from "../types/floorplan.types";
import { isFailedHvac } from "@/utils/hvac.utils";

type Props = {
  hvacs: HvacDto[];
  placements: FloorPlanPlacement[];
  selectedItemId: string | null;
  onSelectItem: (itemId: string | null) => void;
  onToggleLock: (itemId: string, locked: boolean) => Promise<void> | void;
  onRemoveItem: (itemId: string) => Promise<void> | void;
};

export default function FloorPlanItemsPanel({
  hvacs,
  placements,
  selectedItemId,
  onSelectItem,
  onToggleLock,
  onRemoveItem,
}: Props) {
  const [savingItemId, setSavingItemId] = useState<string | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  const placedIds = new Set(placements.map((p) => p.itemId));

  const placedHvacs = hvacs.filter((h) =>
    placedIds.has(h.hvacId ?? h.externalDeviceId ?? "")
  );

  const unplacedHvacs = hvacs.filter(
    (h) => !placedIds.has(h.hvacId ?? h.externalDeviceId ?? "")
  );

  const getPlacement = (itemId: string) =>
    placements.find((p) => p.itemId === itemId);

  async function handleToggleLock(itemId: string, currentlyLocked: boolean) {
    try {
      setSavingItemId(itemId);
      await onToggleLock(itemId, !currentlyLocked);
    } finally {
      setSavingItemId(null);
    }
  }

  async function handleRemove(itemId: string) {
    try {
      setDeletingItemId(itemId);
      await onRemoveItem(itemId);
    } finally {
      setDeletingItemId(null);
    }
  }

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
              const hvacId = hvac.hvacId ?? hvac.externalDeviceId ?? "";
              const hvacName = hvac.hvacName ?? hvac.name ?? "Unnamed HVAC";
              const active = selectedItemId === hvacId;
              const failed = isFailedHvac(hvac);

              return (
                <button
                  key={hvacId}
                  type="button"
                  onClick={() => onSelectItem(active ? null : hvacId)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${
                    active
                      ? failed
                        ? "border-red-500 bg-red-50"
                        : "border-blue-500 bg-blue-50"
                      : failed
                        ? "border-red-200 bg-red-50 hover:bg-red-100"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <Fan
                    className={`h-5 w-5 ${
                      failed ? "text-red-700" : "text-slate-600"
                    }`}
                  />

                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate font-medium ${
                        failed ? "text-red-900" : "text-slate-900"
                      }`}
                    >
                      {hvacName}
                    </p>
                    <p
                      className={`truncate text-xs ${
                        failed ? "text-red-700" : "text-slate-500"
                      }`}
                    >
                      {failed
                        ? "Fault detected"
                        : hvac.externalDeviceId || hvac.deviceId || "No device id"}
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
              const hvacId = hvac.hvacId ?? hvac.externalDeviceId ?? "";
              const hvacName = hvac.hvacName ?? hvac.name ?? "Unnamed HVAC";
              const placement = getPlacement(hvacId);
              const failed = isFailedHvac(hvac);

              if (!placement) return null;

              const isSaving = savingItemId === hvacId;
              const isDeleting = deletingItemId === hvacId;

              return (
                <div
                  key={hvacId}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-3 ${
                    failed
                      ? "border-red-200 bg-red-50"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <Fan
                    className={`h-5 w-5 ${
                      failed ? "text-red-700" : "text-slate-600"
                    }`}
                  />

                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate font-medium ${
                        failed ? "text-red-900" : "text-slate-900"
                      }`}
                    >
                      {hvacName}
                    </p>
                    <p
                      className={`truncate text-xs ${
                        failed ? "text-red-700" : "text-slate-500"
                      }`}
                    >
                      {failed
                        ? `Fault | X: ${placement.x.toFixed(1)}% | Y: ${placement.y.toFixed(1)}%`
                        : `X: ${placement.x.toFixed(1)}% | Y: ${placement.y.toFixed(1)}%`}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleLock(hvacId, placement.locked)}
                    disabled={isSaving || isDeleting}
                    className={`rounded-lg p-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                      placement.locked
                        ? "bg-slate-700 text-white hover:bg-slate-800"
                        : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                    }`}
                    title={placement.locked ? "Unlock item" : "Lock item"}
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : placement.locked ? (
                      <Unlock className="h-4 w-4" />
                    ) : (
                      <Lock className="h-4 w-4" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemove(hvacId)}
                    disabled={isSaving || isDeleting}
                    className="rounded-lg bg-red-100 p-2 text-red-700 hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-60"
                    title="Remove from floor plan"
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
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