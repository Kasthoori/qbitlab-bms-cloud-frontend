import type { DiscoveredHvacDeviceDto } from "@/api/bms";
import { BmsCard } from "@/components/UI";
import { Cpu, Move, RadioTower, Wifi, WifiOff } from "lucide-react";

type Props = {
  devices?: DiscoveredHvacDeviceDto[];
  draggingDeviceId: string | null;
  onStartDrag: (deviceId: string) => void;
  onEndDrag: () => void;
};

export default function DiscoveredDevicesPanel({
  devices = [],
  draggingDeviceId,
  onStartDrag,
  onEndDrag,
}: Props) {
  return (
    <BmsCard variant="section" className="p-5">
      <div className="mb-5 flex items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200/80">
            Source devices
          </p>

          <h2 className="mt-1 text-xl font-semibold text-white">
            Discovered Devices
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Drag a live device onto a logical HVAC card.
          </p>
        </div>

        <span className="rounded-full border border-white/10 bg-white/4 px-3 py-1 text-sm font-semibold text-slate-200">
          {devices.length}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {devices.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/4 p-6 text-center text-sm text-slate-400">
            No discovered devices available.
          </div>
        ) : (
          devices.map((device) => {
            const dragId = device.discoveredDeviceId;
            const isDragging = Boolean(dragId) && draggingDeviceId === dragId;
            const isOnline = Boolean(device.online);

            return (
              <div
                key={device.discoveredDeviceId ?? device.externalDeviceId}
                draggable={Boolean(dragId)}
                onDragStart={(event) => {
                  if (!dragId) return;

                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", dragId);
                  onStartDrag(dragId);
                }}
                onDragEnd={onEndDrag}
                className={[
                  "rounded-3xl border p-4 transition",
                  isDragging
                    ? "border-cyan-400/30 bg-cyan-500/10 opacity-80 shadow-[0_0_30px_rgba(34,211,238,0.1)]"
                    : "border-white/10 bg-white/4 hover:border-cyan-300/20 hover:bg-white/4",
                  dragId
                    ? "cursor-grab active:cursor-grabbing"
                    : "cursor-not-allowed opacity-60",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/4 text-cyan-300">
                      <Cpu className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate text-base font-semibold text-white">
                        {device.deviceName ||
                          device.deviceIdentifier ||
                          "Unnamed Device"}
                      </h3>

                      <p className="mt-1 break-all text-xs text-slate-400">
                        ID: {device.discoveredDeviceId || "Unavailable"}
                      </p>
                    </div>
                  </div>

                  <span
                    className={[
                      "inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold",
                      isOnline
                        ? "border border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
                        : "border border-white/10 bg-white/4 text-slate-400",
                    ].join(" ")}
                  >
                    {isOnline ? (
                      <Wifi className="h-3.5 w-3.5" />
                    ) : (
                      <WifiOff className="h-3.5 w-3.5" />
                    )}
                    {isOnline ? "Online" : "Offline"}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-slate-300 md:grid-cols-2">
                  <div className="inline-flex items-center gap-2">
                    <RadioTower className="h-4 w-4 text-cyan-300" />
                    <span>
                      <span className="font-medium text-slate-100">
                        Protocol:
                      </span>{" "}
                      {device.protocol || "-"}
                    </span>
                  </div>

                  <div>
                    <span className="font-medium text-slate-100">
                      Identifier:
                    </span>{" "}
                    {device.deviceIdentifier || "-"}
                  </div>

                  <div>
                    <span className="font-medium text-slate-100">Model:</span>{" "}
                    {device.model || "-"}
                  </div>

                  <div>
                    <span className="font-medium text-slate-100">
                      Manufacturer:
                    </span>{" "}
                    {device.manufacturer || "-"}
                  </div>
                </div>

                <div className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/4 px-3 py-2 text-xs text-slate-400">
                  <Move className="h-3.5 w-3.5 text-blue-300" />
                  Drag to map
                </div>
              </div>
            );
          })
        )}
      </div>
    </BmsCard>
  );
}