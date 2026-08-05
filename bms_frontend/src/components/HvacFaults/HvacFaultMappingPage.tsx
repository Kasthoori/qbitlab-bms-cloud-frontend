import { useCallback, useEffect, useMemo, useState } from "react";
import { Cpu, Pencil, Plus, RefreshCw, Save, Trash2, X } from "lucide-react";

import {
  HvacFaultApi,
  HVAC_FAULT_COMPONENT_TYPES,
  HVAC_FAULT_PROTOCOLS,
  HVAC_FAULT_SEVERITIES,
  HVAC_FAULT_TYPES,
  type CreateHvacFaultMappingRequest,
  type HvacFaultComponentType,
  type HvacFaultMappingDto,
  type HvacFaultProtocol,
  type HvacFaultSeverity,
  type HvacFaultType,
  type UpdateHvacFaultMappingRequest,
} from "@/api/hvacFaults";
import { BmsButton, BmsInput, BmsSelect } from "@/components/UI";
import { cleanOptional, errorMessage, humanize, PROTOCOL_HELP, severityClasses, validateProtocolRef } from "./faultUi";

type Props = { tenantId: string; siteId: string; hvacId: string; externalDeviceId?: string };
type Form = Omit<CreateHvacFaultMappingRequest, "tenantId" | "siteId" | "hvacId">;
type MappingFilters = { protocol: HvacFaultProtocol | "ALL"; component: HvacFaultComponentType | "ALL"; severity: HvacFaultSeverity | "ALL"; enabled: "ALL" | "ENABLED" | "DISABLED"; search: string };

const EMPTY_FILTERS: MappingFilters = { protocol: "ALL", component: "ALL", severity: "ALL", enabled: "ALL", search: "" };

function initialForm(externalDeviceId = ""): Form {
  return {
    externalDeviceId, protocol: "BACNET", protocolRef: "", rawObjectName: "", rawDescription: "",
    componentType: "OTHER", componentName: "", faultType: "OTHER", internalFaultCode: "",
    severity: "WARNING", haystackTags: "", activeValue: "active", normalValue: "inactive",
    recommendation: "", enabled: true,
  };
}

export function HvacFaultMappingPage({ tenantId, siteId, hvacId, externalDeviceId = "" }: Props) {
  const [mappings, setMappings] = useState<HvacFaultMappingDto[]>([]);
  const [form, setForm] = useState<Form>(() => initialForm(externalDeviceId));
  const [filters, setFilters] = useState<MappingFilters>(EMPTY_FILTERS);
  const [editing, setEditing] = useState<HvacFaultMappingDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await HvacFaultApi.listFaultMappings({ tenantId, siteId, hvacId });
      setMappings(Array.isArray(data) ? data : []);
    } catch (requestError) {
      setError(errorMessage(requestError)); setMappings([]);
    } finally { setLoading(false); }
  }, [tenantId, siteId, hvacId]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { setForm((p) => ({ ...p, externalDeviceId: p.externalDeviceId || externalDeviceId })); }, [externalDeviceId]);

  const protocolError = validateProtocolRef(form.protocol, form.protocolRef);
  const canCreate = !protocolError && form.externalDeviceId.trim() !== "" && form.componentName.trim() !== "" && form.internalFaultCode.trim() !== "" && form.activeValue.trim() !== "";

  const visible = useMemo(() => {
    const needle = filters.search.trim().toLowerCase();
    return mappings.filter((mapping) => {
      if (filters.protocol !== "ALL" && mapping.protocol !== filters.protocol) return false;
      if (filters.component !== "ALL" && mapping.componentType !== filters.component) return false;
      if (filters.severity !== "ALL" && mapping.severity !== filters.severity) return false;
      if (filters.enabled === "ENABLED" && !mapping.enabled) return false;
      if (filters.enabled === "DISABLED" && mapping.enabled) return false;
      if (!needle) return true;
      return [mapping.externalDeviceId, mapping.protocolRef, mapping.componentName, mapping.internalFaultCode, mapping.rawObjectName]
        .some((value) => String(value ?? "").toLowerCase().includes(needle));
    });
  }, [filters, mappings]);

  async function createMapping() {
    if (!canCreate) return;
    setSaving(true); setError(null); setSuccess(null);
    try {
      await HvacFaultApi.createFaultMapping({
        tenantId, siteId, hvacId, ...form,
        externalDeviceId: form.externalDeviceId.trim(), protocolRef: form.protocolRef.trim(),
        rawObjectName: cleanOptional(form.rawObjectName), rawDescription: cleanOptional(form.rawDescription),
        componentName: form.componentName.trim(), internalFaultCode: form.internalFaultCode.trim().toUpperCase(),
        haystackTags: cleanOptional(form.haystackTags), activeValue: form.activeValue.trim(),
        normalValue: cleanOptional(form.normalValue), recommendation: cleanOptional(form.recommendation),
      });
      setForm(initialForm(externalDeviceId)); setSuccess("Fault mapping created."); await load();
    } catch (requestError) { setError(errorMessage(requestError)); }
    finally { setSaving(false); }
  }

  async function updateMapping(mapping: HvacFaultMappingDto, request: UpdateHvacFaultMappingRequest, message: string) {
    setBusyId(mapping.id); setError(null); setSuccess(null);
    try { await HvacFaultApi.updateFaultMapping(mapping.id, request); setSuccess(message); setEditing(null); await load(); }
    catch (requestError) { setError(errorMessage(requestError)); }
    finally { setBusyId(null); }
  }

  function updateRequest(mapping: HvacFaultMappingDto, enabled = mapping.enabled): UpdateHvacFaultMappingRequest {
    return {
      rawObjectName: cleanOptional(mapping.rawObjectName), rawDescription: cleanOptional(mapping.rawDescription),
      componentType: mapping.componentType, componentName: mapping.componentName.trim(), faultType: mapping.faultType,
      internalFaultCode: mapping.internalFaultCode.trim().toUpperCase(), severity: mapping.severity,
      haystackTags: cleanOptional(mapping.haystackTags), activeValue: mapping.activeValue.trim(),
      normalValue: cleanOptional(mapping.normalValue), recommendation: cleanOptional(mapping.recommendation), enabled,
    };
  }

  async function deleteMapping(mapping: HvacFaultMappingDto) {
    if (!window.confirm(`Delete mapping ${mapping.internalFaultCode}? Existing alarm history may prevent deletion.`)) return;
    setBusyId(mapping.id); setError(null); setSuccess(null);
    try { await HvacFaultApi.deleteFaultMapping(mapping.id); setSuccess("Fault mapping deleted."); await load(); }
    catch (requestError) { setError(`${errorMessage(requestError)} The backend foreign key may require disabling mappings instead of deleting mappings with alarm history.`); }
    finally { setBusyId(null); }
  }

  const help = PROTOCOL_HELP[form.protocol];

  return <div className="bms-dashboard-bg bms-dashboard-shell mx-auto w-full max-w-7xl space-y-6">
    <section className="bms-dashboard-hero"><div className="bms-dashboard-hero-content"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300"><Cpu className="h-4 w-4" /> Fault Configuration</div><h1 className="mt-3 text-3xl font-bold text-slate-100">HVAC Component Fault Mapping</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">Map raw Simulator, BACnet, Modbus TCP and Modbus RTU points to production component-fault definitions.</p><p className="mt-3 break-all text-xs text-slate-500">Tenant: {tenantId} · Site: {siteId} · HVAC: {hvacId}</p></div><BmsButton variant="secondary" onClick={() => void load()} disabled={loading}><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh</BmsButton></div></div></section>

    {error && <div className="rounded-2xl border border-rose-400/30 bg-rose-950/30 p-4 text-sm text-rose-100">{error}</div>}
    {success && <div className="rounded-2xl border border-emerald-400/30 bg-emerald-950/30 p-4 text-sm text-emerald-100">{success}</div>}

    <section className="bms-section"><h2 className="text-xl font-bold text-white">Create mapping</h2><div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <BmsInput label="External Device ID" value={form.externalDeviceId} placeholder="Example: ahu-01 or 3001" onChange={(e) => setForm((p) => ({ ...p, externalDeviceId: e.target.value }))} />
      <BmsSelect label="Protocol" value={form.protocol} onChange={(e) => setForm((p) => ({ ...p, protocol: e.target.value as HvacFaultProtocol, protocolRef: "" }))}>{HVAC_FAULT_PROTOCOLS.map((v) => <option key={v}>{v}</option>)}</BmsSelect>
      <div><BmsInput label="Protocol Ref" value={form.protocolRef} placeholder={help.example} onChange={(e) => setForm((p) => ({ ...p, protocolRef: e.target.value }))} /><p className={`mt-1 text-xs ${form.protocolRef && protocolError ? "text-rose-300" : "text-slate-500"}`}>{form.protocolRef && protocolError ? protocolError : help.help}</p></div>
      <BmsInput label="Raw Object Name" value={form.rawObjectName ?? ""} placeholder="Example: SUPPLY_FAN_FAIL" onChange={(e) => setForm((p) => ({ ...p, rawObjectName: e.target.value }))} />
      <BmsInput label="Raw Description" value={form.rawDescription ?? ""} placeholder="Description from BMS point list" onChange={(e) => setForm((p) => ({ ...p, rawDescription: e.target.value }))} />
      <BmsSelect label="Component Type" value={form.componentType} onChange={(e) => setForm((p) => ({ ...p, componentType: e.target.value as HvacFaultComponentType }))}>{HVAC_FAULT_COMPONENT_TYPES.map((v) => <option key={v} value={v}>{humanize(v)}</option>)}</BmsSelect>
      <BmsInput label="Component Name" value={form.componentName} placeholder="Example: Supply Fan" onChange={(e) => setForm((p) => ({ ...p, componentName: e.target.value }))} />
      <BmsSelect label="Fault Type" value={form.faultType} onChange={(e) => setForm((p) => ({ ...p, faultType: e.target.value as HvacFaultType }))}>{HVAC_FAULT_TYPES.map((v) => <option key={v} value={v}>{humanize(v)}</option>)}</BmsSelect>
      <BmsInput label="Internal Fault Code" value={form.internalFaultCode} placeholder="Example: AHU-FAN-001" onChange={(e) => setForm((p) => ({ ...p, internalFaultCode: e.target.value }))} />
      <BmsSelect label="Severity" value={form.severity} onChange={(e) => setForm((p) => ({ ...p, severity: e.target.value as HvacFaultSeverity }))}>{HVAC_FAULT_SEVERITIES.map((v) => <option key={v}>{v}</option>)}</BmsSelect>
      <BmsInput label="Active Value" value={form.activeValue} placeholder="true, 1, active or fault" onChange={(e) => setForm((p) => ({ ...p, activeValue: e.target.value }))} />
      <BmsInput label="Normal Value" value={form.normalValue ?? ""} placeholder="false, 0, inactive or normal" onChange={(e) => setForm((p) => ({ ...p, normalValue: e.target.value }))} />
      <BmsInput label="Haystack Tags" value={form.haystackTags ?? ""} placeholder="fan,fault,alarm" onChange={(e) => setForm((p) => ({ ...p, haystackTags: e.target.value }))} />
      <div className="md:col-span-2 xl:col-span-3"><label className="mb-1.5 block text-sm font-medium text-slate-200">Recommendation</label><textarea value={form.recommendation ?? ""} onChange={(e) => setForm((p) => ({ ...p, recommendation: e.target.value }))} rows={3} maxLength={1000} className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400/50" placeholder="Technician action, safety checks and escalation guidance." /></div>
      <label className="flex items-center gap-3 text-sm text-slate-200"><input type="checkbox" checked={form.enabled ?? true} onChange={(e) => setForm((p) => ({ ...p, enabled: e.target.checked }))} className="h-4 w-4" /> Enabled immediately</label>
    </div><div className="mt-5 flex justify-end"><BmsButton variant="primary" disabled={!canCreate || saving} onClick={() => void createMapping()}><Plus className="h-4 w-4" /> {saving ? "Saving..." : "Create mapping"}</BmsButton></div></section>

    <section className="bms-section"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <BmsSelect label="Protocol" value={filters.protocol} onChange={(e) => setFilters((p) => ({ ...p, protocol: e.target.value as MappingFilters["protocol"] }))}><option value="ALL">All</option>{HVAC_FAULT_PROTOCOLS.map((v) => <option key={v}>{v}</option>)}</BmsSelect>
      <BmsSelect label="Component" value={filters.component} onChange={(e) => setFilters((p) => ({ ...p, component: e.target.value as MappingFilters["component"] }))}><option value="ALL">All</option>{HVAC_FAULT_COMPONENT_TYPES.map((v) => <option key={v} value={v}>{humanize(v)}</option>)}</BmsSelect>
      <BmsSelect label="Severity" value={filters.severity} onChange={(e) => setFilters((p) => ({ ...p, severity: e.target.value as MappingFilters["severity"] }))}><option value="ALL">All</option>{HVAC_FAULT_SEVERITIES.map((v) => <option key={v}>{v}</option>)}</BmsSelect>
      <BmsSelect label="State" value={filters.enabled} onChange={(e) => setFilters((p) => ({ ...p, enabled: e.target.value as MappingFilters["enabled"] }))}><option value="ALL">All</option><option value="ENABLED">Enabled</option><option value="DISABLED">Disabled</option></BmsSelect>
      <BmsInput label="Search" value={filters.search} placeholder="Point, component or code" onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))} />
    </div></section>

    <section className="bms-section overflow-hidden"><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold text-white">Saved mappings</h2><span className="text-sm text-slate-400">{visible.length} of {mappings.length}</span></div>{loading ? <div className="p-8 text-slate-300">Loading mappings...</div> : visible.length === 0 ? <div className="p-10 text-center text-slate-400">No mappings match the filters.</div> : <div className="overflow-x-auto"><table className="min-w-full divide-y divide-white/10 text-sm"><thead className="bg-white/5 text-left text-xs uppercase tracking-wider text-slate-400"><tr><th className="px-4 py-3">State</th><th className="px-4 py-3">Protocol Point</th><th className="px-4 py-3">Component</th><th className="px-4 py-3">Fault</th><th className="px-4 py-3">Values</th><th className="px-4 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-white/10 text-slate-200">{visible.map((mapping) => <tr key={mapping.id} className="hover:bg-white/[0.03]"><td className="px-4 py-3"><button type="button" disabled={busyId === mapping.id} onClick={() => void updateMapping(mapping, updateRequest(mapping, !mapping.enabled), mapping.enabled ? "Mapping disabled." : "Mapping enabled.")} className={`rounded-full border px-2.5 py-1 text-xs font-bold ${mapping.enabled ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100" : "border-slate-500/30 bg-slate-500/10 text-slate-300"}`}>{mapping.enabled ? "ENABLED" : "DISABLED"}</button></td><td className="px-4 py-3"><div className="font-semibold text-white">{mapping.protocol} · {mapping.externalDeviceId}</div><div className="font-mono text-xs text-slate-500">{mapping.protocolRef}</div></td><td className="px-4 py-3"><div>{mapping.componentName}</div><div className="text-xs text-slate-500">{humanize(mapping.componentType)}</div></td><td className="px-4 py-3"><div>{humanize(mapping.faultType)}</div><span className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-bold ${severityClasses(mapping.severity)}`}>{mapping.severity}</span><div className="mt-1 font-mono text-xs text-slate-500">{mapping.internalFaultCode}</div></td><td className="px-4 py-3 font-mono text-xs"><div>Active: {mapping.activeValue}</div><div className="text-slate-500">Normal: {mapping.normalValue ?? "—"}</div></td><td className="px-4 py-3"><div className="flex justify-end gap-2"><button type="button" onClick={() => setEditing(mapping)} className="rounded-xl border border-white/10 p-2 hover:bg-white/10" aria-label="Edit"><Pencil className="h-4 w-4" /></button><button type="button" disabled={busyId === mapping.id} onClick={() => void deleteMapping(mapping)} className="rounded-xl border border-rose-400/20 p-2 text-rose-200 hover:bg-rose-500/10" aria-label="Delete"><Trash2 className="h-4 w-4" /></button></div></td></tr>)}</tbody></table></div>}</section>
    {editing && <EditMappingModal mapping={editing} busy={busyId === editing.id} onClose={() => setEditing(null)} onSave={(next) => updateMapping(editing, updateRequest(next), "Mapping updated.")} />}
  </div>;
}

function EditMappingModal({ mapping, busy, onClose, onSave }: { mapping: HvacFaultMappingDto; busy: boolean; onClose: () => void; onSave: (mapping: HvacFaultMappingDto) => void }) {
  const [form, setForm] = useState(mapping);
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm" onMouseDown={onClose}><div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-2xl" onMouseDown={(e) => e.stopPropagation()}><div className="flex items-start justify-between"><div><p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Edit mapping</p><h2 className="mt-2 text-2xl font-bold text-white">{mapping.componentName}</h2><p className="mt-1 font-mono text-xs text-slate-500">Identity is immutable: {mapping.protocol} · {mapping.externalDeviceId} · {mapping.protocolRef}</p></div><button type="button" onClick={onClose} className="rounded-xl border border-white/10 p-2"><X className="h-5 w-5" /></button></div><div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3"><BmsInput label="Raw Object Name" value={form.rawObjectName ?? ""} onChange={(e) => setForm((p) => ({ ...p, rawObjectName: e.target.value }))} /><BmsInput label="Raw Description" value={form.rawDescription ?? ""} onChange={(e) => setForm((p) => ({ ...p, rawDescription: e.target.value }))} /><BmsSelect label="Component Type" value={form.componentType} onChange={(e) => setForm((p) => ({ ...p, componentType: e.target.value as HvacFaultComponentType }))}>{HVAC_FAULT_COMPONENT_TYPES.map((v) => <option key={v} value={v}>{humanize(v)}</option>)}</BmsSelect><BmsInput label="Component Name" value={form.componentName} onChange={(e) => setForm((p) => ({ ...p, componentName: e.target.value }))} /><BmsSelect label="Fault Type" value={form.faultType} onChange={(e) => setForm((p) => ({ ...p, faultType: e.target.value as HvacFaultType }))}>{HVAC_FAULT_TYPES.map((v) => <option key={v} value={v}>{humanize(v)}</option>)}</BmsSelect><BmsInput label="Internal Fault Code" value={form.internalFaultCode} onChange={(e) => setForm((p) => ({ ...p, internalFaultCode: e.target.value }))} /><BmsSelect label="Severity" value={form.severity} onChange={(e) => setForm((p) => ({ ...p, severity: e.target.value as HvacFaultSeverity }))}>{HVAC_FAULT_SEVERITIES.map((v) => <option key={v}>{v}</option>)}</BmsSelect><BmsInput label="Active Value" value={form.activeValue} onChange={(e) => setForm((p) => ({ ...p, activeValue: e.target.value }))} /><BmsInput label="Normal Value" value={form.normalValue ?? ""} onChange={(e) => setForm((p) => ({ ...p, normalValue: e.target.value }))} /><BmsInput label="Haystack Tags" value={form.haystackTags ?? ""} onChange={(e) => setForm((p) => ({ ...p, haystackTags: e.target.value }))} /><div className="md:col-span-2 xl:col-span-3"><label className="mb-1.5 block text-sm font-medium text-slate-200">Recommendation</label><textarea rows={3} maxLength={1000} value={form.recommendation ?? ""} onChange={(e) => setForm((p) => ({ ...p, recommendation: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-100" /></div><label className="flex items-center gap-3 text-sm text-slate-200"><input type="checkbox" checked={form.enabled} onChange={(e) => setForm((p) => ({ ...p, enabled: e.target.checked }))} /> Enabled</label></div><div className="mt-6 flex justify-end gap-3"><BmsButton variant="secondary" onClick={onClose}>Cancel</BmsButton><BmsButton variant="primary" disabled={busy || !form.componentName.trim() || !form.internalFaultCode.trim() || !form.activeValue.trim()} onClick={() => onSave(form)}><Save className="h-4 w-4" /> {busy ? "Saving..." : "Save changes"}</BmsButton></div></div></div>;
}
