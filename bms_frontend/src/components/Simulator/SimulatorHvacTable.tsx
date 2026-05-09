import {
  AlertTriangle,
  Edit3,
  Fan,
  Power,
  Trash2,
  Wifi,
  WifiOff,
} from "lucide-react";
import { type SimulatorHvacDto } from "@/api/bms";

type Props = {
  rows: SimulatorHvacDto[];
  loading: boolean;
  editingId: string | null;
  onEdit: (row: SimulatorHvacDto) => void;
  onDelete: (row: SimulatorHvacDto) => void;
};

export default function SimulatorHvacTable({
  rows,
  loading,
  editingId,
  onEdit,
  onDelete,
}: Props) {
  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/6 shadow-2xl shadow-slate-950/30 backdrop-blur-2xl">
      <div className="border-b border-white/10 px-5 py-4">
        <h2 className="text-lg font-semibold text-white">
          Simulator Device Registry
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Devices returned to the Edge Controller when this site is assigned to
          the edge.
        </p>
      </div>

      {loading ? (
        <div className="p-8 text-sm text-slate-400">
          Loading simulator HVACs...
        </div>
      ) : rows.length === 0 ? (
        <div className="p-8 text-sm text-slate-400">
          No simulator HVACs found.
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/60 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4">Device</th>
                  <th className="px-5 py-4">Protocol</th>
                  <th className="px-5 py-4">Telemetry</th>
                  <th className="px-5 py-4">State</th>
                  <th className="px-5 py-4">Config</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className={`border-t border-white/10 transition ${
                      editingId === row.id
                        ? "bg-cyan-300/10"
                        : "hover:bg-white/4"
                    }`}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
                          <Fan
                            size={20}
                            className={row.onState ? "animate-spin-slow" : ""}
                          />
                        </div>

                        <div>
                          <div className="font-semibold text-white">
                            {row.unitName}
                          </div>
                          <div className="font-mono text-xs text-cyan-200">
                            {row.externalDeviceId}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            {row.zone || "No zone"}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <ProtocolBadge protocol={row.protocol} />
                    </td>

                    <td className="px-5 py-4">
                      <div className="grid gap-1 text-xs text-slate-300">
                        <span>Temp: {row.temperature ?? "-"} °C</span>
                        <span>Setpoint: {row.setpoint ?? "-"} °C</span>
                        <span>Fan: {row.fanSpeed ?? "-"}%</span>
                        <span>Flow: {row.flowRate ?? "-"}</span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-2">
                        <StateBadge
                          active={Boolean(row.onState)}
                          activeLabel="On"
                          inactiveLabel="Off"
                          iconActive={<Power size={13} />}
                        />

                        <FaultBadge fault={Boolean(row.fault)} />
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      {row.enabled ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
                          <Wifi size={13} />
                          Enabled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-500/30 bg-slate-700/30 px-3 py-1 text-xs text-slate-300">
                          <WifiOff size={13} />
                          Disabled
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onEdit(row)}
                          className="rounded-xl border border-cyan-300/20 bg-cyan-300/10 p-2 text-cyan-200 transition hover:bg-cyan-300/20"
                          title="Edit"
                        >
                          <Edit3 size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => onDelete(row)}
                          className="rounded-xl border border-red-300/20 bg-red-400/10 p-2 text-red-200 transition hover:bg-red-400/20"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-4 p-4 lg:hidden">
            {rows.map((row) => (
              <MobileCard
                key={row.id}
                row={row}
                editing={editingId === row.id}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function MobileCard({
  row,
  editing,
  onEdit,
  onDelete,
}: {
  row: SimulatorHvacDto;
  editing: boolean;
  onEdit: (row: SimulatorHvacDto) => void;
  onDelete: (row: SimulatorHvacDto) => void;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        editing
          ? "border-cyan-300/30 bg-cyan-300/10"
          : "border-white/10 bg-slate-950/40"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-white">{row.unitName}</div>
          <div className="font-mono text-xs text-cyan-200">
            {row.externalDeviceId}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {row.zone || "No zone"}
          </div>
        </div>

        <ProtocolBadge protocol={row.protocol} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-300">
        <Metric label="Temp" value={`${row.temperature ?? "-"} °C`} />
        <Metric label="Setpoint" value={`${row.setpoint ?? "-"} °C`} />
        <Metric label="Fan" value={`${row.fanSpeed ?? "-"}%`} />
        <Metric label="Flow" value={`${row.flowRate ?? "-"}`} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <StateBadge
          active={Boolean(row.onState)}
          activeLabel="On"
          inactiveLabel="Off"
          iconActive={<Power size={13} />}
        />
        <FaultBadge fault={Boolean(row.fault)} />
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => onEdit(row)}
          className="flex-1 rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-sm text-cyan-200"
        >
          Edit
        </button>

        <button
          type="button"
          onClick={() => onDelete(row)}
          className="flex-1 rounded-xl border border-red-300/20 bg-red-400/10 px-3 py-2 text-sm text-red-200"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/4 p-3">
      <div className="text-slate-500">{label}</div>
      <div className="mt-1 font-medium text-slate-100">{value}</div>
    </div>
  );
}

function ProtocolBadge({ protocol }: { protocol?: string | null }) {
  return (
    <span className="inline-flex rounded-full border border-violet-300/20 bg-violet-400/10 px-3 py-1 text-xs font-medium text-violet-200">
      {protocol || "SIMULATOR"}
    </span>
  );
}

function FaultBadge({ fault }: { fault: boolean }) {
  if (fault) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-300/20 bg-red-400/10 px-3 py-1 text-xs text-red-200">
        <AlertTriangle size={13} />
        Fault
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
      Normal
    </span>
  );
}

function StateBadge({
  active,
  activeLabel,
  inactiveLabel,
  iconActive,
}: {
  active: boolean;
  activeLabel: string;
  inactiveLabel: string;
  iconActive: React.ReactNode;
}) {
  return active ? (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200">
      {iconActive}
      {activeLabel}
    </span>
  ) : (
    <span className="inline-flex rounded-full border border-slate-500/30 bg-slate-700/30 px-3 py-1 text-xs text-slate-300">
      {inactiveLabel}
    </span>
  );
}