import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  Cpu,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";

import {
  HvacFaultApi,
  type CreateHvacFaultMappingRequest,
  type HvacFaultAlarmDto,
  type HvacFaultComponentType,
  type HvacFaultMappingDto,
  type HvacFaultProtocol,
  type HvacFaultSeverity,
  type HvacFaultType,
} from "@/api/hvacFaults";

import { BmsButton, BmsInput, BmsSelect } from "@/components/UI";

type HvacFaultMappingPageProps = {
  tenantId: string;
  siteId: string;
  hvacId: string;
  externalDeviceId?: string;
};

const COMPONENT_TYPES: HvacFaultComponentType[] = [
  "UNIT",
  "FAN",
  "FILTER",
  "COMPRESSOR",
  "VALVE",
  "COIL",
  "SENSOR",
  "DAMPER",
  "PUMP",
  "VFD",
  "THERMOSTAT",
  "AIRFLOW",
  "PRESSURE",
  "TEMPERATURE",
  "COMMUNICATION",
  "POWER",
  "OTHER",
];

const FAULT_TYPES: HvacFaultType[] = [
  "GENERAL_UNIT_FAULT",
  "FAN_FAILURE",
  "FAN_TRIP",
  "FAN_FEEDBACK_MISMATCH",
  "FILTER_CLOGGED",
  "FILTER_DIFFERENTIAL_PRESSURE_HIGH",
  "COMPRESSOR_FAULT",
  "COMPRESSOR_LOCKOUT",
  "COOLING_VALVE_LEAKING",
  "HEATING_VALVE_LEAKING",
  "VALVE_STUCK_OPEN",
  "VALVE_STUCK_CLOSED",
  "LOW_AIR_FLOW",
  "HIGH_AIR_FLOW",
  "LOW_PRESSURE",
  "HIGH_PRESSURE",
  "SUPPLY_AIR_TEMP_FAULT",
  "RETURN_AIR_TEMP_FAULT",
  "ZONE_TEMP_SENSOR_FAULT",
  "SENSOR_FAILURE",
  "COMMUNICATION_LOST",
  "STALE_TELEMETRY",
  "POWER_FAILURE",
  "VFD_FAULT",
  "OTHER",
];

const SEVERITIES: HvacFaultSeverity[] = ["INFO", "WARNING", "CRITICAL"];

const PROTOCOLS: HvacFaultProtocol[] = ["BACNET", "MODBUS", "MODBUS_RTU", "SIMULATOR"];

function createInitialForm(
  externalDeviceId: string
): Omit<CreateHvacFaultMappingRequest, "tenantId" | "siteId" | "hvacId"> {
  return {
    externalDeviceId,
    protocol: "BACNET",
    protocolRef: "",
    rawObjectName: "",
    rawDescription: "",
    componentType: "OTHER",
    componentName: "",
    faultType: "OTHER",
    internalFaultCode: "",
    severity: "WARNING",
    haystackTags: "",
    activeValue: "active",
    normalValue: "inactive",
    recommendation: "",
    enabled: true,
  };
}

export function HvacFaultMappingPage({
  tenantId,
  siteId,
  hvacId,
  externalDeviceId = "",
}: HvacFaultMappingPageProps) {
  const [mappings, setMappings] = useState<HvacFaultMappingDto[]>([]);
  const [alarms, setAlarms] = useState<HvacFaultAlarmDto[]>([]);
  const [form, setForm] = useState(createInitialForm(externalDeviceId));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const openAlarms = useMemo(
    () => alarms.filter((alarm) => alarm.status === "OPEN"),
    [alarms]
  );

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      externalDeviceId: prev.externalDeviceId || externalDeviceId,
    }));
  }, [externalDeviceId]);

  async function load() {
    setLoading(true);
    setErrorMessage(null);

    try {
      const [mappingData, alarmData] = await Promise.all([
        HvacFaultApi.listFaultMappings({ tenantId, siteId, hvacId }),
        HvacFaultApi.listFaultAlarms({
          tenantId,
          siteId,
          hvacId,
          status: "OPEN",
        }),
      ]);

      setMappings(mappingData);
      setAlarms(alarmData);
    } catch (error) {
      setErrorMessage(toErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, siteId, hvacId]);

  async function createMapping() {
    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await HvacFaultApi.createFaultMapping({
        tenantId,
        siteId,
        hvacId,
        ...form,
        externalDeviceId: form.externalDeviceId.trim(),
        protocolRef: form.protocolRef.trim(),
        rawObjectName: cleanOptional(form.rawObjectName),
        rawDescription: cleanOptional(form.rawDescription),
        componentName: form.componentName.trim(),
        internalFaultCode: form.internalFaultCode.trim().toUpperCase(),
        haystackTags: cleanOptional(form.haystackTags),
        activeValue: form.activeValue.trim(),
        normalValue: cleanOptional(form.normalValue),
        recommendation: cleanOptional(form.recommendation),
      });

      setForm(createInitialForm(externalDeviceId));
      setSuccessMessage("Fault mapping saved successfully.");
      await load();
    } catch (error) {
      setErrorMessage(toErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function deleteMapping(mappingId: string) {
    const ok = window.confirm("Delete this fault mapping?");
    if (!ok) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await HvacFaultApi.deleteFaultMapping(mappingId);
      setSuccessMessage("Fault mapping deleted.");
      await load();
    } catch (error) {
      setErrorMessage(toErrorMessage(error));
    }
  }

  const canSave =
    form.externalDeviceId.trim() !== "" &&
    form.protocolRef.trim() !== "" &&
    form.componentName.trim() !== "" &&
    form.internalFaultCode.trim() !== "" &&
    form.activeValue.trim() !== "";

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-cyan-200/80">
              Fault intelligence
            </p>

            <h1 className="mt-2 text-2xl font-bold text-white">
              HVAC Fault Mapping
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              Map raw BACnet, Modbus, or simulator alarm points to real HVAC
              components such as fan, filter, compressor, valve, VFD, sensor, or
              communication fault.
            </p>

            <div className="mt-4 grid gap-2 text-xs text-slate-400 md:grid-cols-4">
              <InfoPill label="Tenant" value={tenantId} />
              <InfoPill label="Site" value={siteId} />
              <InfoPill label="HVAC" value={hvacId} />
              <InfoPill
                label="External Device"
                value={externalDeviceId || "Manual"}
              />
            </div>
          </div>

          <BmsButton
            type="button"
            variant="secondary"
            onClick={load}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </BmsButton>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <StatCard
            icon={<Cpu className="h-5 w-5" />}
            label="Mapped fault points"
            value={mappings.length}
          />

          <StatCard
            icon={<BellRing className="h-5 w-5" />}
            label="Open fault alarms"
            value={openAlarms.length}
          />

          <StatCard
            icon={<CheckCircle2 className="h-5 w-5" />}
            label="Status"
            value={loading ? "Loading" : "Ready"}
          />
        </div>
      </section>

      {errorMessage && (
        <div className="rounded-2xl border border-red-400/30 bg-red-950/30 p-4 text-sm text-red-100">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-950/30 p-4 text-sm text-emerald-100">
          {successMessage}
        </div>
      )}

      <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl">
        <h2 className="text-lg font-bold text-white">Create fault mapping</h2>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <BmsInput
            label="External Device ID"
            value={form.externalDeviceId}
            placeholder="Example: 3001 or em-main-01"
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                externalDeviceId: event.target.value,
              }))
            }
          />

          <BmsSelect
            label="Protocol"
            value={form.protocol}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                protocol: event.target.value as HvacFaultProtocol,
              }))
            }
          >
            {PROTOCOLS.map((protocol) => (
              <option key={protocol} value={protocol}>
                {protocol}
              </option>
            ))}
          </BmsSelect>

          <BmsInput
            label="Protocol Ref"
            value={form.protocolRef}
            placeholder="Example: binaryInput:9"
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                protocolRef: event.target.value,
              }))
            }
          />

          <BmsInput
            label="Raw Object Name"
            value={form.rawObjectName}
            placeholder="Example: FAN_FAIL"
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                rawObjectName: event.target.value,
              }))
            }
          />

          <BmsInput
            label="Raw Description"
            value={form.rawDescription}
            placeholder="Example: Supply fan fault"
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                rawDescription: event.target.value,
              }))
            }
          />

          <BmsSelect
            label="Component Type"
            value={form.componentType}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                componentType: event.target.value as HvacFaultComponentType,
              }))
            }
          >
            {COMPONENT_TYPES.map((item) => (
              <option key={item} value={item}>
                {human(item)}
              </option>
            ))}
          </BmsSelect>

          <BmsInput
            label="Component Name"
            value={form.componentName}
            placeholder="Example: Supply Fan"
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                componentName: event.target.value,
              }))
            }
          />

          <BmsSelect
            label="Fault Type"
            value={form.faultType}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                faultType: event.target.value as HvacFaultType,
              }))
            }
          >
            {FAULT_TYPES.map((item) => (
              <option key={item} value={item}>
                {human(item)}
              </option>
            ))}
          </BmsSelect>

          <BmsInput
            label="Internal Fault Code"
            value={form.internalFaultCode}
            placeholder="Example: FAILURE-002"
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                internalFaultCode: event.target.value,
              }))
            }
          />

          <BmsSelect
            label="Severity"
            value={form.severity}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                severity: event.target.value as HvacFaultSeverity,
              }))
            }
          >
            {SEVERITIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </BmsSelect>

          <BmsInput
            label="Active Value"
            value={form.activeValue}
            placeholder="active"
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                activeValue: event.target.value,
              }))
            }
          />

          <BmsInput
            label="Normal Value"
            value={form.normalValue}
            placeholder="inactive"
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                normalValue: event.target.value,
              }))
            }
          />

          <BmsInput
            label="Haystack Tags"
            value={form.haystackTags}
            placeholder="fan,fault,sensor"
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                haystackTags: event.target.value,
              }))
            }
          />

          <div className="md:col-span-3">
            <BmsInput
              label="Recommendation"
              value={form.recommendation}
              placeholder="Example: Check fan motor, VFD, overload trip, belt, and run feedback."
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  recommendation: event.target.value,
                }))
              }
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <BmsButton
            type="button"
            variant="primary"
            disabled={!canSave || saving}
            onClick={createMapping}
          >
            <Plus className="h-4 w-4" />
            {saving ? "Saving..." : "Save mapping"}
          </BmsButton>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl">
        <h2 className="text-lg font-bold text-white">Open fault alarms</h2>

        <div className="mt-5 space-y-3">
          {openAlarms.length === 0 ? (
            <EmptyState text="No open fault alarms for this HVAC." />
          ) : (
            openAlarms.map((alarm) => (
              <AlarmCard key={alarm.id} alarm={alarm} />
            ))
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl">
        <h2 className="text-lg font-bold text-white">Saved fault mappings</h2>

        <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
          {mappings.length === 0 ? (
            <EmptyState text="No fault mappings saved yet." />
          ) : (
            <table className="min-w-full divide-y divide-white/10 text-sm">
              <thead className="bg-white/5 text-left text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">Protocol Point</th>
                  <th className="px-4 py-3">Component</th>
                  <th className="px-4 py-3">Fault</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/10 text-slate-200">
                {mappings.map((mapping) => (
                  <tr key={mapping.id} className="bg-slate-950/30">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white">
                        {mapping.protocol} / {mapping.externalDeviceId}
                      </div>
                      <div className="text-xs text-slate-400">
                        {mapping.protocolRef}
                        {mapping.rawObjectName
                          ? ` · ${mapping.rawObjectName}`
                          : ""}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div>{mapping.componentName}</div>
                      <div className="text-xs text-slate-400">
                        {human(mapping.componentType)}
                      </div>
                    </td>

                    <td className="px-4 py-3">{human(mapping.faultType)}</td>

                    <td className="px-4 py-3">
                      <SeverityBadge severity={mapping.severity} />
                    </td>

                    <td className="px-4 py-3 font-mono text-xs">
                      {mapping.internalFaultCode}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        className="inline-flex items-center rounded-xl border border-red-400/30 px-3 py-2 text-xs font-bold text-red-200 transition hover:bg-red-500/10"
                        onClick={() => void deleteMapping(mapping.id)}
                      >
                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center gap-3 text-cyan-200">
        {icon}
        <span className="text-xs uppercase tracking-wider text-slate-400">
          {label}
        </span>
      </div>
      <div className="mt-3 truncate text-2xl font-black text-white">
        {value}
      </div>
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-slate-500">
        {label}
      </div>
      <div className="mt-1 truncate font-mono text-xs text-slate-200">
        {value}
      </div>
    </div>
  );
}

function AlarmCard({ alarm }: { alarm: HvacFaultAlarmDto }) {
  return (
    <div className="rounded-2xl border border-red-400/20 bg-red-950/20 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-200" />
            <h3 className="font-bold text-white">{alarm.title}</h3>
          </div>

          <p className="mt-2 text-sm leading-6 text-slate-300">
            {alarm.message}
          </p>

          {alarm.recommendation && (
            <p className="mt-2 text-sm leading-6 text-cyan-100">
              Recommended action: {alarm.recommendation}
            </p>
          )}
        </div>

        <SeverityBadge severity={alarm.severity} />
      </div>

      <div className="mt-4 grid gap-3 text-xs text-slate-400 md:grid-cols-4">
        <AlarmMeta label="Fault code" value={alarm.internalFaultCode} />
        <AlarmMeta label="Raw point" value={alarm.protocolRef} />
        <AlarmMeta label="Raw value" value={alarm.rawValue || "-"} />
        <AlarmMeta
          label="Last seen"
          value={new Date(alarm.lastSeenAt).toLocaleString()}
        />
      </div>
    </div>
  );
}

function AlarmMeta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="block text-slate-500">{label}</span>
      <span className="font-mono text-slate-200">{value}</span>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: HvacFaultSeverity }) {
  const className =
    severity === "CRITICAL"
      ? "border-red-400/40 bg-red-500/10 text-red-100"
      : severity === "WARNING"
        ? "border-amber-400/40 bg-amber-500/10 text-amber-100"
        : "border-cyan-400/40 bg-cyan-500/10 text-cyan-100";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${className}`}
    >
      {severity}
    </span>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-400">
      {text}
    </div>
  );
}

function human(value: string) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}

function cleanOptional(value: string | undefined | null) {
  if (!value || value.trim() === "") {
    return undefined;
  }

  return value.trim();
}

function toErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected error while processing HVAC fault mapping.";
}