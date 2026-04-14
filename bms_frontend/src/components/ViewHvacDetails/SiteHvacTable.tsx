import type { FC } from "react";
import {
  Activity,
  Fan,
  Gauge,
  Thermometer,
  AlertTriangle,
  Wifi,
  WifiOff,
} from "lucide-react";
import type { HvacSiteDetailsDto } from "../../types/hvac";

type SiteHvacTableProps = {
  rows: HvacSiteDetailsDto[];
  connected: boolean;
};

const SiteHvacTable: FC<SiteHvacTableProps> = ({ rows, connected }) => {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">
            <Activity className="h-4 w-4" />
            Live Telemetry
          </div>

          <h2 className="mt-3 text-2xl font-semibold text-white">HVAC Details</h2>
          <p className="text-sm text-slate-400">
            Live HVAC data for the selected site
          </p>
        </div>

        <span
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold ${
            connected
              ? "border border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
              : "border border-rose-400/20 bg-rose-500/10 text-rose-300"
          }`}
        >
          {connected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
          {connected ? "CONNECTED" : "DISCONNECTED"}
        </span>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-white/10">
        <table className="min-w-full">
          <thead className="bg-white/5">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                Unit
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                Temp
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                Setpoint
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                Power
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                Fan
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                Flow
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                Fault
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                Last Update
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/10 bg-slate-950/30">
            {rows.map((row, index) => (
              <tr
                key={row.hvacId ?? row.externalDeviceId ?? `${row.hvacName}-${index}`}
                className="transition hover:bg-white/5"
              >
                <td className="whitespace-nowrap px-4 py-4 text-sm text-white">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-cyan-300">
                      <Fan className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-white">
                        {row.unitName || row.hvacName || "-"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {row.externalDeviceId || row.hvacId || "No ID"}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-200">
                  <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-300">
                    <Thermometer className="h-3.5 w-3.5" />
                    {typeof row.temperature === "number"
                      ? `${row.temperature.toFixed(2)}°C`
                      : "-"}
                  </span>
                </td>

                <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-200">
                  <span className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-300">
                    <Gauge className="h-3.5 w-3.5" />
                    {typeof row.setpoint === "number"
                      ? `${row.setpoint.toFixed(2)}°C`
                      : "-"}
                  </span>
                </td>

                <td className="whitespace-nowrap px-4 py-4 text-sm">
                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                      row.onState
                        ? "border border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
                        : "border border-white/10 bg-white/5 text-slate-300"
                    }`}
                  >
                    {row.onState ? "ON" : "OFF"}
                  </span>
                </td>

                <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-200">
                  {typeof row.fanSpeed === "number" ? `${row.fanSpeed.toFixed(0)}%` : "-"}
                </td>

                <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-200">
                  {typeof row.flowRate === "number"
                    ? `${row.flowRate.toFixed(2)} m³/h`
                    : "-"}
                </td>

                <td className="whitespace-nowrap px-4 py-4 text-sm">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
                      row.fault
                        ? "border border-rose-400/20 bg-rose-500/10 text-rose-300"
                        : "border border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
                    }`}
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {row.fault ? "FAULT" : "OK"}
                  </span>
                </td>

                <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-400">
                  {row.telemetryTime
                    ? new Date(row.telemetryTime).toLocaleTimeString()
                    : "-"}
                </td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center">
                  <div className="mx-auto max-w-md rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-slate-400">
                    No data available for this site
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SiteHvacTable;