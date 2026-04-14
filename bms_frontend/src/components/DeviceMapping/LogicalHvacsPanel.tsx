import { useMemo, useState } from "react";
import type {
  DiscoveredHvacDeviceDto,
  HvacDeviceMappingDto,
  HvacDto,
} from "@/api/bms";
import { Fan, Link2, CheckCircle2 } from "lucide-react";

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
    mappings.forEach((m) => {
      if (m.hvacId) {
        map.set(m.hvacId, m);
      }
    });
    return map;
  }, [mappings]);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Logical BMS HVACs</h2>
          <p className="mt-1 text-sm text-slate-400">
            Drop a discovered device onto an HVAC to create a mapping.
          </p>
        </div>

        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm font-semibold text-slate-200">
          {hvacs.length}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {hvacs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-center text-sm text-slate-400">
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
                    ? "border-emerald-400/20 bg-emerald-500/10"
                    : isHovered && !disabled
                    ? "border-cyan-400/30 bg-cyan-500/10"
                    : "border-white/10 bg-white/5 hover:bg-white/10",
                ].join(" ")}
                onDragOver={(e) => {
                  if (alreadyMapped || disabled) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                }}
                onDragEnter={() => {
                  if (!alreadyMapped && !disabled) {
                    setHoveredHvacId(hvac.hvacId);
                  }
                }}
                onDragLeave={() => {
                  setHoveredHvacId((prev) => (prev === hvac.hvacId ? null : prev));
                }}
                onDrop={(e) => {
                  if (alreadyMapped || disabled) return;

                  e.preventDefault();
                  const discoveredDeviceId = e.dataTransfer.getData("text/plain");
                  setHoveredHvacId(null);

                  if (!discoveredDeviceId) return;
                  onDropDevice(hvac.hvacId, discoveredDeviceId);
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-blue-300">
                      <Fan className="h-5 w-5" />
                    </div>

                    <div>
                      <h3 className="text-base font-semibold text-white">
                        {hvac.hvacName || "Unnamed HVAC"}
                      </h3>
                      <p className="mt-1 text-xs text-slate-400">
                        HVAC ID: {hvac.hvacId}
                      </p>
                    </div>
                  </div>

                  {alreadyMapped ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Mapped
                    </span>
                  ) : (
                    <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                      Ready
                    </span>
                  )}
                </div>

                {alreadyMapped && currentMapping ? (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                    <span className="inline-flex items-center gap-2 font-medium text-slate-100">
                      <Link2 className="h-4 w-4 text-emerald-300" />
                      Mapped to:
                    </span>{" "}
                    {mappedToLabel}
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-400">
                    Drop discovered device here
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}