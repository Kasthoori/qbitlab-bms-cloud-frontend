import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, BellRing, CheckCircle2, Eye, RefreshCw, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";

import {
  HvacFaultApi,
  HVAC_FAULT_COMPONENT_TYPES,
  HVAC_FAULT_SEVERITIES,
  type HvacFaultAlarmDto,
  type HvacFaultAlarmStatus,
  type HvacFaultComponentType,
  type HvacFaultSeverity,
} from "@/api/hvacFaults";
import { BmsButton, BmsInput, BmsSelect } from "@/components/UI";
import { errorMessage, formatDateTime, humanize, severityClasses } from "./faultUi";

type Props = { tenantId: string; siteId: string; initialHvacId?: string };

type Filters = {
  status: HvacFaultAlarmStatus | "ALL";
  severity: HvacFaultSeverity | "ALL";
  hvacId: string;
  componentType: HvacFaultComponentType | "ALL";
  search: string;
};

const INITIAL_FILTERS: Filters = {
  status: "OPEN", severity: "ALL", hvacId: "", componentType: "ALL", search: "",
};

export function HvacFaultAlarmsPage({ tenantId, siteId, initialHvacId = "" }: Props) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [alarms, setAlarms] = useState<HvacFaultAlarmDto[]>([]);
  const [filters, setFilters] = useState<Filters>({ ...INITIAL_FILTERS, hvacId: initialHvacId });
  const [selected, setSelected] = useState<HvacFaultAlarmDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await HvacFaultApi.listFaultAlarms({
        tenantId, siteId,
        hvacId: filters.hvacId || undefined,
        status: filters.status,
      });
      setAlarms(Array.isArray(data) ? data : []);
    } catch (requestError) {
      setError(errorMessage(requestError));
      setAlarms([]);
    } finally {
      setLoading(false);
    }
  }, [tenantId, siteId, filters.hvacId, filters.status]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const alarmId = searchParams.get("alarmId");
    if (!alarmId || alarms.length === 0) return;
    const match = alarms.find((alarm) => alarm.id === alarmId);
    if (match) setSelected(match);
  }, [alarms, searchParams]);

  const visible = useMemo(() => {
    const needle = filters.search.trim().toLowerCase();
    return alarms.filter((alarm) => {
      if (filters.severity !== "ALL" && alarm.severity !== filters.severity) return false;
      if (filters.componentType !== "ALL" && alarm.componentType !== filters.componentType) return false;
      if (!needle) return true;
      return [alarm.title, alarm.componentName, alarm.internalFaultCode, alarm.protocolRef, alarm.rawValue, alarm.hvacId]
        .some((value) => String(value ?? "").toLowerCase().includes(needle));
    });
  }, [alarms, filters.componentType, filters.search, filters.severity]);

  const counts = useMemo(() => ({
    open: alarms.filter((alarm) => alarm.status === "OPEN").length,
    critical: alarms.filter((alarm) => alarm.status === "OPEN" && alarm.severity === "CRITICAL").length,
    resolved: alarms.filter((alarm) => alarm.status === "RESOLVED").length,
  }), [alarms]);

  function openDetails(alarm: HvacFaultAlarmDto) {
    setSelected(alarm);
    const next = new URLSearchParams(searchParams);
    next.set("alarmId", alarm.id);
    setSearchParams(next, { replace: true });
  }

  function closeDetails() {
    setSelected(null);
    const next = new URLSearchParams(searchParams);
    next.delete("alarmId");
    setSearchParams(next, { replace: true });
  }

  return (
    <div className="bms-dashboard-bg bms-dashboard-shell mx-auto w-full max-w-7xl space-y-6">
      <section className="bms-dashboard-hero">
        <div className="bms-dashboard-hero-content">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
                <BellRing className="h-4 w-4" /> Fault Operations
              </div>
              <h1 className="mt-3 text-3xl font-bold text-slate-100">HVAC Component Fault Alarms</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                Technician view for active and resolved Level 2 component alarms, raw protocol evidence and recommended action.
              </p>
              <p className="mt-3 break-all text-xs text-slate-500">Tenant: {tenantId} · Site: {siteId}</p>
            </div>
            <BmsButton variant="secondary" onClick={() => void load()} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
            </BmsButton>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <Stat icon={<AlertTriangle className="h-5 w-5" />} label="Open" value={counts.open} />
        <Stat icon={<BellRing className="h-5 w-5" />} label="Critical open" value={counts.critical} />
        <Stat icon={<CheckCircle2 className="h-5 w-5" />} label="Resolved in result" value={counts.resolved} />
      </div>

      <section className="bms-section">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <BmsSelect label="Status" value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value as Filters["status"] }))}>
            <option value="ALL">All</option><option value="OPEN">Open</option><option value="RESOLVED">Resolved</option>
          </BmsSelect>
          <BmsSelect label="Severity" value={filters.severity} onChange={(e) => setFilters((p) => ({ ...p, severity: e.target.value as Filters["severity"] }))}>
            <option value="ALL">All</option>{HVAC_FAULT_SEVERITIES.map((v) => <option key={v}>{v}</option>)}
          </BmsSelect>
          <BmsSelect label="Component" value={filters.componentType} onChange={(e) => setFilters((p) => ({ ...p, componentType: e.target.value as Filters["componentType"] }))}>
            <option value="ALL">All</option>{HVAC_FAULT_COMPONENT_TYPES.map((v) => <option key={v} value={v}>{humanize(v)}</option>)}
          </BmsSelect>
          <BmsInput label="HVAC ID" value={filters.hvacId} placeholder="Optional HVAC ID" onChange={(e) => setFilters((p) => ({ ...p, hvacId: e.target.value }))} />
          <BmsInput label="Search" value={filters.search} placeholder="Component, code, point..." onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))} />
        </div>
      </section>

      {error && <div className="rounded-2xl border border-rose-400/30 bg-rose-950/30 p-4 text-sm text-rose-100">{error}</div>}

      <section className="bms-section overflow-hidden">
        {loading ? <div className="p-8 text-slate-300">Loading fault alarms...</div> : visible.length === 0 ? (
          <div className="p-10 text-center text-slate-400">No alarms match the current filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10 text-sm">
              <thead className="bg-white/5 text-left text-xs uppercase tracking-wider text-slate-400">
                <tr><th className="px-4 py-3">Status</th><th className="px-4 py-3">HVAC / Component</th><th className="px-4 py-3">Fault</th><th className="px-4 py-3">Protocol point</th><th className="px-4 py-3">Raw value</th><th className="px-4 py-3">Occurrences</th><th className="px-4 py-3">Last seen</th><th className="px-4 py-3"></th></tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-slate-200">
                {visible.map((alarm) => (
                  <tr key={alarm.id} className="hover:bg-white/[0.03]">
                    <td className="px-4 py-3"><span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${alarm.status === "OPEN" ? "border-rose-400/30 bg-rose-500/10 text-rose-100" : "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"}`}>{alarm.status}</span></td>
                    <td className="px-4 py-3"><div className="font-semibold text-white">{alarm.componentName}</div><div className="text-xs text-slate-500">{alarm.hvacId} · {humanize(alarm.componentType)}</div></td>
                    <td className="px-4 py-3"><div>{humanize(alarm.faultType)}</div><span className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-bold ${severityClasses(alarm.severity)}`}>{alarm.severity}</span></td>
                    <td className="px-4 py-3 font-mono text-xs"><div>{alarm.protocol}</div><div className="text-slate-500">{alarm.protocolRef}</div></td>
                    <td className="px-4 py-3 font-mono text-xs">{alarm.rawValue ?? "—"}</td>
                    <td className="px-4 py-3 text-center font-semibold">{alarm.occurrenceCount}</td>
                    <td className="px-4 py-3 text-xs">{formatDateTime(alarm.lastSeenAt)}</td>
                    <td className="px-4 py-3 text-right"><button type="button" onClick={() => openDetails(alarm)} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/10"><Eye className="h-3.5 w-3.5" /> Details</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selected && <AlarmDrawer alarm={selected} onClose={closeDetails} />}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return <div className="bms-section"><div className="flex items-center gap-3 text-cyan-200">{icon}<span className="text-xs uppercase tracking-wider text-slate-400">{label}</span></div><div className="mt-3 text-3xl font-black text-white">{value}</div></div>;
}

function AlarmDrawer({ alarm, onClose }: { alarm: HvacFaultAlarmDto; onClose: () => void }) {
  const rows: Array<[string, string]> = [
    ["Alarm ID", alarm.id], ["Status", alarm.status], ["Severity", alarm.severity], ["HVAC ID", alarm.hvacId],
    ["Component", `${alarm.componentName} (${humanize(alarm.componentType)})`], ["Fault type", humanize(alarm.faultType)],
    ["Internal code", alarm.internalFaultCode], ["Protocol", alarm.protocol], ["External device", alarm.externalDeviceId],
    ["Protocol Ref", alarm.protocolRef], ["Raw object", alarm.rawObjectName ?? "—"], ["Raw value", alarm.rawValue ?? "—"],
    ["Event state", alarm.rawEventState ?? "—"], ["Reliability", alarm.rawReliability ?? "—"],
    ["Occurrences", String(alarm.occurrenceCount)], ["First seen", formatDateTime(alarm.firstSeenAt)],
    ["Last seen", formatDateTime(alarm.lastSeenAt)], ["Resolved", formatDateTime(alarm.resolvedAt)],
  ];
  return <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm" onMouseDown={onClose}>
    <aside className="h-full w-full max-w-2xl overflow-y-auto border-l border-white/10 bg-slate-950 p-6 shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
      <div className="flex items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Alarm detail</p><h2 className="mt-2 text-2xl font-bold text-white">{alarm.title}</h2></div><button type="button" onClick={onClose} className="rounded-xl border border-white/10 p-2 text-slate-300 hover:bg-white/10" aria-label="Close"><X className="h-5 w-5" /></button></div>
      <p className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-slate-300">{alarm.message}</p>
      {alarm.recommendation && <div className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-4"><div className="text-xs font-bold uppercase tracking-wider text-cyan-200">Recommended action</div><p className="mt-2 text-sm leading-6 text-cyan-50">{alarm.recommendation}</p></div>}
      <dl className="mt-6 grid gap-3 sm:grid-cols-2">{rows.map(([label, value]) => <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.025] p-3"><dt className="text-[11px] uppercase tracking-wider text-slate-500">{label}</dt><dd className="mt-1 break-all text-sm text-slate-200">{value}</dd></div>)}</dl>
    </aside>
  </div>;
}
