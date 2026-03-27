import { useMemo, useState } from "react";
import type {
  DiscoveredHvacDeviceDto,
  HvacDeviceMappingDto,
  HvacDto,
} from "@/api/bms";

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

  // const discoveredDeviceByAnyKey = useMemo(() => {
  //   const map = new Map<string, DiscoveredHvacDeviceDto>();

  //   discoveredDevices.forEach((device) => {
  //     if (device.discoveredDeviceId) {
  //       map.set(device.discoveredDeviceId, device);
  //     }

  //     if (device.externalDeviceId) {
  //       map.set(device.externalDeviceId, device);
  //     }

  //     if (device.deviceIdentifier) {
  //       map.set(device.deviceIdentifier, device);
  //     }
  //   });

  //   return map;
  // }, [discoveredDevices]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Logical BMS HVACs</h2>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
          {hvacs.length}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {hvacs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
            No HVACs found for this site.
          </div>
        ) : (
          hvacs.map((hvac) => {
            const alreadyMapped = mappedHvacIds.has(hvac.hvacId);
            const currentMapping = mappingByHvacId.get(hvac.hvacId);
            const isHovered = hoveredHvacId === hvac.hvacId;

            // const mappedDevice =
            //   (currentMapping?.externalDeviceId
            //     ? discoveredDeviceByAnyKey.get(currentMapping.externalDeviceId)
            //     : undefined) ||
            //   (currentMapping?.hvacName
            //     ? discoveredDeviceByAnyKey.get(currentMapping.hvacName)
            //     : undefined);

            const mappedToLabel =
                currentMapping?.unitName ||
                currentMapping?.externalDeviceId ||
                "Unknown device";

            return (
              <div
                key={hvac.hvacId}
                className={[
                  "rounded-2xl border p-4 transition",
                  alreadyMapped
                    ? "border-emerald-200 bg-emerald-50"
                    : isHovered && !disabled
                    ? "border-sky-400 bg-sky-50"
                    : "border-slate-200 bg-white hover:border-slate-300",
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
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      {hvac.hvacName || "Unnamed HVAC"}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      HVAC ID: {hvac.hvacId}
                    </p>
                  </div>

                  {alreadyMapped ? (
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                      Mapped
                    </span>
                  ) : (
                    <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                      Ready
                    </span>
                  )}
                </div>

                {alreadyMapped && currentMapping ? (
                  <div className="mt-4 rounded-xl bg-white/70 px-3 py-2 text-sm text-slate-700">
                    <span className="font-medium text-slate-900">Mapped to:</span>{" "}
                    {mappedToLabel}
                  </div>
                ) : (
                  <div className="mt-4 rounded-xl border border-dashed border-slate-300 px-3 py-3 text-sm text-slate-500">
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