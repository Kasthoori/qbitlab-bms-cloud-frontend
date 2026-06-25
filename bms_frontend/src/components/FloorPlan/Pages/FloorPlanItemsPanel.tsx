import {
  AlertTriangle,
  CheckCircle2,
  Fan,
  Loader2,
  Lock,
  Trash2,
  Unlock,
} from "lucide-react";
import { useMemo, useState } from "react";

import type { HvacDto } from "@/api/bms";
import { BmsButton, BmsCard } from "@/components/UI";
import { isFailedHvac } from "@/utils/hvac.utils";

import type { FloorPlanPlacement } from "../types/floorplan.types";

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

  const placedIds = useMemo(
    () => new Set(placements.map((placement) => placement.itemId)),
    [placements]
  );

  const placedHvacs = useMemo(
    () =>
      hvacs.filter((hvac) =>
        placedIds.has(hvac.hvacId ?? hvac.externalDeviceId ?? "")
      ),
    [hvacs, placedIds]
  );

  const unplacedHvacs = useMemo(
    () =>
      hvacs.filter(
        (hvac) => !placedIds.has(hvac.hvacId ?? hvac.externalDeviceId ?? "")
      ),
    [hvacs, placedIds]
  );

  const getPlacement = (itemId: string) =>
    placements.find((placement) => placement.itemId === itemId);

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
    <BmsCard variant="section" className="space-y-5 p-5">
      <div className="border-b border-white/10 pb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200/80">
          Floor plan devices
        </p>

        <h3 className="mt-1 text-xl font-semibold text-white">Site HVACs</h3>

        <p className="mt-2 text-sm text-slate-400">
          Total: {hvacs.length} | Placed: {placedHvacs.length} | Unplaced:{" "}
          {unplacedHvacs.length}
        </p>
      </div>

      <section>
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Unplaced HVACs
        </h4>

        <div className="space-y-3">
          {unplacedHvacs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/4 p-4 text-sm text-slate-400">
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
                        ? "border-rose-500/40 bg-rose-500/10 shadow-[0_0_30px_rgba(244,63,94,0.08)]"
                        : "border-cyan-400/30 bg-cyan-500/10 shadow-[0_0_30px_rgba(34,211,238,0.08)]"
                      : failed
                        ? "border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10"
                        : "border-white/10 bg-white/4 hover:border-cyan-300/20 hover:bg-white/[0.07]"
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
                    <p
                      className={`truncate font-medium ${
                        failed ? "text-rose-200" : "text-white"
                      }`}
                    >
                      {hvacName}
                    </p>

                    <p
                      className={`truncate text-xs ${
                        failed ? "text-rose-300" : "text-slate-400"
                      }`}
                    >
                      {failed
                        ? "Fault detected"
                        : hvac.externalDeviceId ||
                          hvac.deviceId ||
                          "No device id"}
                    </p>
                  </div>

                  {active && !failed ? (
                    <CheckCircle2 className="h-5 w-5 text-cyan-300" />
                  ) : null}

                  {failed ? (
                    <AlertTriangle className="h-5 w-5 text-rose-300" />
                  ) : null}
                </button>
              );
            })
          )}
        </div>
      </section>

      <section>
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Placed HVACs
        </h4>

        <div className="space-y-3">
          {placedHvacs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/4 p-4 text-sm text-slate-400">
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
              const disabled = isSaving || isDeleting;

              return (
                <div
                  key={hvacId}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-4 transition ${
                    failed
                      ? "border-rose-500/20 bg-rose-500/5"
                      : "border-white/10 bg-white/4 hover:bg-white/6"
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                      failed
                        ? "bg-rose-500/10 text-rose-300"
                        : "bg-white/10 text-slate-300"
                    }`}
                  >
                    <Fan className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate font-medium ${
                        failed ? "text-rose-200" : "text-white"
                      }`}
                    >
                      {hvacName}
                    </p>

                    <p
                      className={`truncate text-xs ${
                        failed ? "text-rose-300" : "text-slate-400"
                      }`}
                    >
                      {failed
                        ? `Fault | X: ${placement.x.toFixed(
                            1
                          )}% | Y: ${placement.y.toFixed(1)}%`
                        : `X: ${placement.x.toFixed(
                            1
                          )}% | Y: ${placement.y.toFixed(1)}%`}
                    </p>
                  </div>

                  <BmsButton
                    type="button"
                    variant={placement.locked ? "warning" : "ghost"}
                    size="sm"
                    onClick={() => handleToggleLock(hvacId, placement.locked)}
                    disabled={disabled}
                    title={placement.locked ? "Unlock item" : "Lock item"}
                    className="min-h-0 rounded-2xl px-3 py-2.5"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : placement.locked ? (
                      <Unlock className="h-4 w-4" />
                    ) : (
                      <Lock className="h-4 w-4" />
                    )}
                  </BmsButton>

                  <BmsButton
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => handleRemove(hvacId)}
                    disabled={disabled}
                    title="Remove from floor plan"
                    className="min-h-0 rounded-2xl px-3 py-2.5"
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </BmsButton>
                </div>
              );
            })
          )}
        </div>
      </section>
    </BmsCard>
  );
}