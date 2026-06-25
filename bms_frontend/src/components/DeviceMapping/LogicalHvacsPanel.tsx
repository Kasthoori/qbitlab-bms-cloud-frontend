import { useMemo, useState } from "react";
import { CheckCircle2, Fan, Link2 } from "lucide-react";

import type {
  DiscoveredHvacDeviceDto,
  HvacDeviceMappingDto,
  HvacDto,
} from "@/api/bms";
import { BmsCard } from "@/components/UI";

type Props = {
  hvacs?: HvacDto[];
  mappedHvacIds?: Set<string>;
  mappings?: HvacDeviceMappingDto[];
  discoveredDevices?: DiscoveredHvacDeviceDto[];
  disabled?: boolean;
  onDropDevice: (hvacId: string, discoveredDeviceId: string) => void;
};

export default function LogicalHvacsPanel({
  hvacs = [],
  mappedHvacIds = new Set<string>(),
  mappings = [],
  disabled = false,
  onDropDevice,
}: Props) {
  const [hoveredHvacId, setHoveredHvacId] = useState<string | null>(null);

  const mappingByHvacId = useMemo(() => {
    const map = new Map<string, HvacDeviceMappingDto>();

    mappings.forEach((mapping) => {
      if (mapping.hvacId) {
        map.set(mapping.hvacId, mapping);
      }
    });

    return map;
  }, [mappings]);

  return (
    <BmsCard variant="section" className="p-5">
      <div className="mb-5 flex items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200/80">
            Mapping target
          </p>

          <h2 className="mt-1 text-xl font-semibold text-white">
            Logical BMS HVACs
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Drop a discovered device onto an HVAC to create a mapping.
          </p>
        </div>

        <span className="rounded-full border border-white/10 bg-white/4 px-3 py-1 text-sm font-semibold text-slate-200">
          {hvacs.length}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {hvacs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/4 p-6 text-center text-sm text-slate-400">
            No HVACs found for this site.
          </div>
        ) : (
          hvacs.map((hvac) => {
            const alreadyMapped = mappedHvacIds.has(hvac.hvacId);
            const currentMapping = mappingByHvacId.get(hvac.hvacId);
            const isHovered = hoveredHvacId === hvac.hvacId;

            const mappedToLabel =
              currentMapping?.unitName ||
              currentMapping?.externalDeviceId ||
              "Unknown device";

            return (
              <div
                key={hvac.hvacId}
                className={[
                  "rounded-3xl border p-4 transition",
                  alreadyMapped
                    ? "border-emerald-400/20 bg-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.08)]"
                    : isHovered && !disabled
                      ? "border-cyan-400/30 bg-cyan-500/10 shadow-[0_0_30px_rgba(34,211,238,0.1)]"
                      : "border-white/10 bg-white/4 hover:border-cyan-300/20 hover:bg-white/7",
                  disabled ? "cursor-not-allowed opacity-70" : "",
                ].join(" ")}
                onDragOver={(event) => {
                  if (alreadyMapped || disabled) return;

                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                }}
                onDragEnter={() => {
                  if (!alreadyMapped && !disabled) {
                    setHoveredHvacId(hvac.hvacId);
                  }
                }}
                onDragLeave={() => {
                  setHoveredHvacId((previous) =>
                    previous === hvac.hvacId ? null : previous
                  );
                }}
                onDrop={(event) => {
                  if (alreadyMapped || disabled) return;

                  event.preventDefault();

                  const discoveredDeviceId =
                    event.dataTransfer.getData("text/plain");

                  setHoveredHvacId(null);

                  if (!discoveredDeviceId) return;

                  onDropDevice(hvac.hvacId, discoveredDeviceId);
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/4 text-blue-300">
                      <Fan className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate text-base font-semibold text-white">
                        {hvac.hvacName || "Unnamed HVAC"}
                      </h3>

                      <p className="mt-1 break-all text-xs text-slate-400">
                        HVAC ID: {hvac.hvacId}
                      </p>
                    </div>
                  </div>

                  {alreadyMapped ? (
                    <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Mapped
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                      Ready
                    </span>
                  )}
                </div>

                {alreadyMapped && currentMapping ? (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/4 px-4 py-3 text-sm text-slate-300">
                    <span className="inline-flex items-center gap-2 font-medium text-slate-100">
                      <Link2 className="h-4 w-4 text-emerald-300" />
                      Mapped to:
                    </span>{" "}
                    {mappedToLabel}
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-white/4 px-4 py-3 text-sm text-slate-400">
                    Drop discovered device here
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </BmsCard>
  );
}