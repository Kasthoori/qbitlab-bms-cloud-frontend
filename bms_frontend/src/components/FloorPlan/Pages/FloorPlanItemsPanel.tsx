import { Fan, Lock, Unlock, Trash2, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
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
    <div className="space-y-5 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl">
      <div>
        <h3 className="text-xl font-semibold text-white">Site HVACs</h3>
        <p className="mt-2 text-sm text-slate-400">
          Total: {hvacs.length} | Placed: {placedHvacs.length} | Unplaced: {unplacedHvacs.length}
        </p>
      </div>

      <div>
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Unplaced HVACs
        </h4>

        <div className="space-y-3">
          {unplacedHvacs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-slate-400">
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
                  className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-4 text-left transition ${
                    active
                      ? failed
                        ? "border-rose-500/40 bg-rose-500/10"
                        : "border-cyan-400/30 bg-cyan-500/10"
                      : failed
                      ? "border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                      failed
                        ? "bg-rose-500/10 text-rose-300"
                        : active
                        ? "bg-cyan-500/10 text-cyan-300"
                        : "bg-white/10 text-slate-300"
                    }`}
                  >
                    <Fan className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className={`truncate font-medium ${failed ? "text-rose-200" : "text-white"}`}>
                      {hvacName}
                    </p>
                    <p className={`truncate text-xs ${failed ? "text-rose-300" : "text-slate-400"}`}>
                      {failed
                        ? "Fault detected"
                        : hvac.externalDeviceId || hvac.deviceId || "No device id"}
                    </p>
                  </div>

                  {active && !failed ? (
                    <CheckCircle2 className="h-5 w-5 text-cyan-300" />
                  ) : null}

                  {failed ? <AlertTriangle className="h-5 w-5 text-rose-300" /> : null}
                </button>
              );
            })
          )}
        </div>
      </div>

      <div>
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Placed HVACs
        </h4>

        <div className="space-y-3">
          {placedHvacs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-slate-400">
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
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-4 ${
                    failed
                      ? "border-rose-500/20 bg-rose-500/5"
                      : "border-white/10 bg-white/5"
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                      failed ? "bg-rose-500/10 text-rose-300" : "bg-white/10 text-slate-300"
                    }`}
                  >
                    <Fan className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className={`truncate font-medium ${failed ? "text-rose-200" : "text-white"}`}>
                      {hvacName}
                    </p>
                    <p className={`truncate text-xs ${failed ? "text-rose-300" : "text-slate-400"}`}>
                      {failed
                        ? `Fault | X: ${placement.x.toFixed(1)}% | Y: ${placement.y.toFixed(1)}%`
                        : `X: ${placement.x.toFixed(1)}% | Y: ${placement.y.toFixed(1)}%`}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleLock(hvacId, placement.locked)}
                    disabled={isSaving || isDeleting}
                    className={`rounded-2xl p-2.5 transition disabled:cursor-not-allowed disabled:opacity-60 ${
                      placement.locked
                        ? "bg-amber-500/15 text-amber-300 hover:bg-amber-500/20"
                        : "bg-white/10 text-slate-300 hover:bg-white/15"
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
                    className="rounded-2xl bg-rose-500/90 p-2.5 text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
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