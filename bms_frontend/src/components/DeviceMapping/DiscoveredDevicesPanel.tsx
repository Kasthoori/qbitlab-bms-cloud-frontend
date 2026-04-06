import type { DiscoveredHvacDeviceDto } from "@/api/bms";

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
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Discovered Devices</h2>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
          {devices.length}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {devices.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
            No discovered devices available.
          </div>
        ) : (
          devices.map((device) => {
            const dragId = device.discoveredDeviceId;
            const isDragging = !!dragId && draggingDeviceId === dragId;

            return (
              <div
                key={device.discoveredDeviceId ?? device.externalDeviceId}
                draggable={!!dragId}
                onDragStart={(e) => {
                  if (!dragId) return;

                  console.log("Dragging discoveredDeviceId:", dragId);
                  console.log("Dragging full device:", device);

                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", dragId);
                  onStartDrag(dragId);
                }}
                onDragEnd={onEndDrag}
                className={[
                  "rounded-2xl border p-4 transition",
                  isDragging
                    ? "border-sky-400 bg-sky-50 opacity-80"
                    : "border-slate-200 bg-white hover:border-slate-300",
                  dragId
                    ? "cursor-grab active:cursor-grabbing"
                    : "cursor-not-allowed opacity-60",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      {device.deviceName || device.deviceIdentifier || "Unnamed Device"}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      ID: {device.discoveredDeviceId || "Unavailable"}
                    </p>
                  </div>

                  <span
                    className={[
                      "rounded-full px-3 py-1 text-xs font-semibold",
                      device.online
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-600",
                    ].join(" ")}
                  >
                    {device.online ? "Online" : "Offline"}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-700">
                  <div>
                    <span className="font-medium text-slate-900">Protocol:</span>{" "}
                    {device.protocol || "-"}
                  </div>
                  <div>
                    <span className="font-medium text-slate-900">Identifier:</span>{" "}
                    {device.deviceIdentifier || "-"}
                  </div>
                  <div>
                    <span className="font-medium text-slate-900">Model:</span>{" "}
                    {device.model || "-"}
                  </div>
                  <div>
                    <span className="font-medium text-slate-900">Manufacturer:</span>{" "}
                    {device.manufacturer || "-"}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}