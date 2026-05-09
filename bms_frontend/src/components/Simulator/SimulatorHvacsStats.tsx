import { Activity, AlertTriangle, CheckCircle2, Cpu } from "lucide-react";
import { type SimulatorHvacDto } from "@/api/bms";

type Props = {
  rows: SimulatorHvacDto[];
};

export default function SimulatorHvacStats({ rows }: Props) {
  const total = rows.length;
  const enabled = rows.filter((row) => row.enabled).length;
  const fault = rows.filter((row) => row.fault).length;
  const online = rows.filter((row) => row.onState).length;

  return (
    <section className="grid gap-4 md:grid-cols-4">
      <StatCard
        label="Total Simulators"
        value={total}
        icon={<Cpu size={22} />}
        helper="Configured devices"
      />
      <StatCard
        label="Enabled"
        value={enabled}
        icon={<CheckCircle2 size={22} />}
        helper="Loaded by config"
      />
      <StatCard
        label="On State"
        value={online}
        icon={<Activity size={22} />}
        helper="Currently SIMULATOR on"
      />
      <StatCard
        label="Fault"
        value={fault}
        icon={<AlertTriangle size={22} />}
        helper="Failure simulation"
        danger={fault > 0}
      />
    </section>
  );
}

function StatCard({
  label,
  value,
  icon,
  helper,
  danger,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  helper: string;
  danger?: boolean;
}) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/6 p-5 shadow-xl shadow-slate-950/30 backdrop-blur-2xl">
      <div
        className={`absolute -right-10 -top-10 h-28 w-28 rounded-full blur-2xl ${
          danger ? "bg-red-500/20" : "bg-cyan-500/10"
        }`}
      />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <div className="mt-3 text-3xl font-semibold text-white">{value}</div>
          <p className="mt-2 text-xs text-slate-500">{helper}</p>
        </div>

        <div
          className={`rounded-2xl border p-3 ${
            danger
              ? "border-red-300/30 bg-red-400/10 text-red-200"
              : "border-cyan-300/30 bg-cyan-400/10 text-cyan-200"
          }`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}