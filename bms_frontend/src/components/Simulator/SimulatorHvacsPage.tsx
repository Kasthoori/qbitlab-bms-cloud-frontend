/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    BmsApi, type SimulatorHvacDto,
} from "@/api/bms";
import SimulatorHvacStats from "./SimulatorHvacsStats";
import SimulatorHvacFormPanel, { type SimulatorHvacFormState } from "./SimulatorHvacFormPanel";
import SimulatorHvacTable from "./SimulatorHvacTable";
import {
  Activity,
  Cpu,
  Plus,
  RefreshCcw,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

type Props = {
  tenantId: string;
  siteId: string;
  tenantName?: string;
  siteName?: string;
};

const emptyForm: SimulatorHvacFormState = {
  hvacId: "",
  edgeControllerId: "",

  externalDeviceId: "",
  unitName: "",
  unitType: "Split Unit",
  zone: "Default Zone",
  protocol: "SIMULATOR",

  temperature: "22",
  setpoint: "24",
  onState: true,
  fanSpeed: "50",
  flowRate: "1.2",
  fault: false,
  enabled: true,
};

export default function SimulatorHvacsPage({
  tenantId,
  siteId,
  tenantName,
  siteName,
}: Props) {
  const [rows, setRows] = useState<SimulatorHvacDto[]>([]);
  const [selectedRow, setSelectedRow] = useState<SimulatorHvacDto | null>(null);
  const [form, setForm] = useState<SimulatorHvacFormState>(emptyForm);

  const [query, setQuery] = useState("");
  const [protocolFilter, setProtocolFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const isEditing = selectedRow !== null;

  const loadRows = useCallback(async () => {
  if (!tenantId || !siteId) return;

  setLoading(true);
  setErrorMessage("");

  try {
    const data = await BmsApi.getSimulatorHvacs(tenantId, siteId);
    setRows(Array.isArray(data) ? data : []);
  } catch (error) {
    console.error(error);
    setErrorMessage("Failed to load simulator HVACs.");
  } finally {
    setLoading(false);
  }
}, [tenantId, siteId]);

useEffect(() => {
  loadRows();
}, [loadRows]);


  const filteredRows = useMemo(() => {
    const search = query.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesSearch =
        !search ||
        row.externalDeviceId?.toLowerCase().includes(search) ||
        row.unitName?.toLowerCase().includes(search) ||
        row.zone?.toLowerCase().includes(search) ||
        row.protocol?.toLowerCase().includes(search);

      const matchesProtocol =
        protocolFilter === "ALL" || row.protocol === protocolFilter;

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "FAULT" && row.fault) ||
        (statusFilter === "NORMAL" && !row.fault) ||
        (statusFilter === "ENABLED" && row.enabled) ||
        (statusFilter === "DISABLED" && !row.enabled);

      return matchesSearch && matchesProtocol && matchesStatus;
    });
  }, [rows, query, protocolFilter, statusFilter]);

  function toNumber(value: string, fallback: number) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function optionalUuid(value: string) {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  function handleNew() {
    setSelectedRow(null);
    setForm(emptyForm);
    setErrorMessage("");
    setSuccessMessage("");
    setFormOpen(true);
  }

  function handleEdit(row: SimulatorHvacDto) {
    setSelectedRow(row);
    setForm({
      hvacId: row.hvacId ?? "",
      edgeControllerId: row.edgeControllerId ?? "",

      externalDeviceId: row.externalDeviceId ?? "",
      unitName: row.unitName ?? "",
      unitType: row.unitType ?? "Split Unit",
      zone: row.zone ?? "Default Zone",
      protocol: row.protocol ?? "SIMULATOR",

      temperature: String(row.temperature ?? 22),
      setpoint: String(row.setpoint ?? 24),
      onState: row.onState ?? true,
      fanSpeed: String(row.fanSpeed ?? 50),
      flowRate: String(row.flowRate ?? 1.2),
      fault: row.fault ?? false,
      enabled: row.enabled ?? true,
    });
    setErrorMessage("");
    setSuccessMessage("");
    setFormOpen(true);
  }

  function closeForm() {
    setSelectedRow(null);
    setForm(emptyForm);
    setFormOpen(false);
  }

  async function handleSubmit() {
    setErrorMessage("");
    setSuccessMessage("");

    if (!form.unitName.trim()) {
      setErrorMessage("Unit name is required.");
      return;
    }

    if (!isEditing && !form.externalDeviceId.trim()) {
      setErrorMessage("External device ID is required.");
      return;
    }

    setSaving(true);

    try {
      if (selectedRow) {
        await BmsApi.updateSimulatorHvac(tenantId, siteId, selectedRow.id, {
          hvacId: optionalUuid(form.hvacId),
          edgeControllerId: optionalUuid(form.edgeControllerId),
          unitName: form.unitName.trim(),
          unitType: form.unitType.trim(),
          zone: form.zone.trim(),
          protocol: form.protocol.trim(),
          temperature: toNumber(form.temperature, 22),
          setpoint: toNumber(form.setpoint, 24),
          onState: form.onState,
          fanSpeed: toNumber(form.fanSpeed, 50),
          flowRate: toNumber(form.flowRate, 1.2),
          fault: form.fault,
          enabled: form.enabled,
        });

        setSuccessMessage("Simulator HVAC updated successfully.");
      } else {
        await BmsApi.createSimulatorHvac(tenantId, siteId, {
          hvacId: optionalUuid(form.hvacId),
          edgeControllerId: optionalUuid(form.edgeControllerId),
          externalDeviceId: form.externalDeviceId.trim(),
          unitName: form.unitName.trim(),
          unitType: form.unitType.trim(),
          zone: form.zone.trim(),
          protocol: form.protocol.trim(),
          temperature: toNumber(form.temperature, 22),
          setpoint: toNumber(form.setpoint, 24),
          onState: form.onState,
          fanSpeed: toNumber(form.fanSpeed, 50),
          flowRate: toNumber(form.flowRate, 1.2),
          fault: form.fault,
          enabled: form.enabled,
        });

        setSuccessMessage("Simulator HVAC created successfully.");
      }

      closeForm();
      await loadRows();
    } catch (error) {
      console.error(error);
      setErrorMessage(
        selectedRow
          ? "Failed to update simulator HVAC."
          : "Failed to create simulator HVAC."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(row: SimulatorHvacDto) {
    const confirmed = window.confirm(
      `Delete simulator HVAC ${row.externalDeviceId}?`
    );

    if (!confirmed) return;

    setErrorMessage("");
    setSuccessMessage("");

    try {
      await BmsApi.deleteSimulatorHvac(tenantId, siteId, row.id);
      setSuccessMessage("Simulator HVAC deleted successfully.");
      await loadRows();
    } catch (error) {
      console.error(error);
      setErrorMessage("Failed to delete simulator HVAC.");
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-30 -top-30 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute -right-30 top-40 h-96 w-96 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <main className="relative mx-auto max-w-7xl space-y-6 p-6">
        <section className="overflow-hidden rounded-4xl border border-white/10 bg-white/6 shadow-2xl shadow-cyan-950/30 backdrop-blur-2xl">
          <div className="relative p-6 md:p-8">
            <div className="absolute right-6 top-6 hidden rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs text-cyan-200 md:flex md:items-center md:gap-2">
              <Sparkles size={14} />
              AI-ready simulator config
            </div>

            <div className="flex max-w-3xl items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/30 bg-cyan-400/10 text-cyan-200 shadow-lg shadow-cyan-500/10">
                <Cpu size={24} />
              </div>

              <div>
                <p className="text-sm font-medium text-cyan-300">
                  Edge Simulation Control
                </p>
                <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white md:text-4xl">
                  Simulator HVACs
                </h1>
              </div>
            </div>

            <p className="mt-5 max-w-3xl text-sm leading-6 text-slate-300">
              Manage SIMULATOR HVAC devices for this site. These records are
              loaded by the Edge Controller config endpoint and used to generate
              telemetry for testing tenants, sites, mappings, alerts and command
              workflows.
            </p>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <GlassInfo
                icon={<ShieldCheck size={18} />}
                label="Tenant"
                value={tenantName ?? tenantId}
              />
              <GlassInfo
                icon={<Activity size={18} />}
                label="Site"
                value={siteId ?? siteName}
              />
              <GlassInfo
                icon={<Cpu size={18} />}
                label="Backend route"
                value="/simulator-hvacs"
              />
            </div>
          </div>
        </section>

        <SimulatorHvacStats rows={rows} />

        {errorMessage && (
          <AlertBox type="error" message={errorMessage} />
        )}

        {successMessage && (
          <AlertBox type="success" message={successMessage} />
        )}

        <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-4 shadow-2xl shadow-slate-950/30 backdrop-blur-2xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by external ID, unit name, zone or protocol..."
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 py-3 pl-11 pr-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-400/10"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <select
                value={protocolFilter}
                onChange={(e) => setProtocolFilter(e.target.value)}
                className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none focus:border-cyan-300/60"
              >
                <option value="ALL">All protocols</option>
                <option value="SIMULATOR">SIMULATOR</option>
                <option value="BACNET">BACNET</option>
                <option value="MODBUS">MODBUS</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none focus:border-cyan-300/60"
              >
                <option value="ALL">All status</option>
                <option value="ENABLED">Enabled</option>
                <option value="DISABLED">Disabled</option>
                <option value="FAULT">Fault</option>
                <option value="NORMAL">Normal</option>
              </select>

              <button
                type="button"
                onClick={loadRows}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10"
              >
                <RefreshCcw size={16} />
                Refresh
              </button>

              <button
                type="button"
                onClick={handleNew}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-200"
              >
                <Plus size={16} />
                Add HVAC
              </button>
            </div>
          </div>
        </section>

        <SimulatorHvacTable
          rows={filteredRows}
          loading={loading}
          editingId={selectedRow?.id ?? null}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </main>

      <SimulatorHvacFormPanel
        open={formOpen}
        form={form}
        setForm={setForm}
        isEditing={isEditing}
        saving={saving}
        onClose={closeForm}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

function GlassInfo({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 backdrop-blur-xl">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
        <span className="text-cyan-300">{icon}</span>
        {label}
      </div>
      <div className="mt-2 break-all text-sm font-medium text-slate-200">
        {value}
      </div>
    </div>
  );
}

function AlertBox({
  type,
  message,
}: {
  type: "success" | "error";
  message: string;
}) {
  const isSuccess = type === "success";

  return (
    <div
      className={`rounded-2xl border px-5 py-4 text-sm backdrop-blur-xl ${
        isSuccess
          ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
          : "border-red-400/30 bg-red-500/10 text-red-200"
      }`}
    >
      {message}
    </div>
  );
}