import type { FC } from "react";
import type { HvacSiteDetailsDto } from "../../types/hvac";

type SiteHvacTableProps = {
  rows: HvacSiteDetailsDto[];
  connected: boolean;
};

const SiteHvacTable: FC<SiteHvacTableProps> = ({ rows, connected }) => {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">HVAC Details</h2>
          <p className="text-sm text-slate-500">
            Live HVAC data for the selected site
          </p>
        </div>

        <span
          className={`rounded-full px-4 py-1 text-xs font-semibold ${
            connected ? "bg-green-600 text-white" : "bg-red-600 text-white"
          }`}
        >
          {connected ? "CONNECTED" : "DISCONNECTED"}
        </span>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="min-w-full">
          <thead className="bg-slate-950">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-300">
                Unit
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-300">
                Temp (°C)
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-300">
                Setpoint (°C)
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-300">
                On/Off
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-300">
                Fan (%)
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-300">
                Flow
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-300">
                Fault
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-300">
                Last Update
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800 bg-slate-950">
            {rows.map((row, index) => (
              <tr key={row.hvacId ?? row.externalDeviceId ?? `${row.hvacName}-${index}`}>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-white">
                  {row.unitName || row.hvacName || "-"}
                </td>

                <td className="whitespace-nowrap px-4 py-3 text-sm text-white">
                  {typeof row.temperature === "number" ? row.temperature.toFixed(2) : "-"}
                </td>

                <td className="whitespace-nowrap px-4 py-3 text-sm text-white">
                  {typeof row.setpoint === "number" ? row.setpoint.toFixed(2) : "-"}
                </td>

                <td className="whitespace-nowrap px-4 py-3 text-sm">
                  <span
                    className={`rounded px-3 py-1 text-xs font-semibold ${
                      row.onState ? "bg-green-700 text-white" : "bg-slate-600 text-white"
                    }`}
                  >
                    {row.onState ? "ON" : "OFF"}
                  </span>
                </td>

                <td className="whitespace-nowrap px-4 py-3 text-sm text-white">
                  {typeof row.fanSpeed === "number" ? `${row.fanSpeed.toFixed(0)}%` : "-"}
                </td>

                <td className="whitespace-nowrap px-4 py-3 text-sm text-white">
                  {typeof row.flowRate === "number" ? `${row.flowRate.toFixed(2)} m³/h` : "-"}
                </td>

                <td className="whitespace-nowrap px-4 py-3 text-sm">
                  <span
                    className={`rounded px-3 py-1 text-xs font-semibold ${
                      row.fault ? "bg-red-700 text-white" : "bg-emerald-700 text-white"
                    }`}
                  >
                    {row.fault ? "FAULT" : "OK"}
                  </span>
                </td>

                <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-300">
                  {row.telemetryTime
                    ? new Date(row.telemetryTime).toLocaleTimeString()
                    : "-"}
                </td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-sm text-slate-400">
                  No data available for this site
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