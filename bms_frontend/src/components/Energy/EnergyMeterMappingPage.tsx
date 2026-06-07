import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Cpu,
  //Gauge,
  Loader2,
  MapPin,
  PlugZap,
  RefreshCw,
  Settings2,
  Sparkles,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";

import {
  EnergyDiscoveryApi,
  type DiscoveredEnergyMeterDto,
  type MapDiscoveredEnergyMeterRequest,
} from "@/api/energyDiscovery";
import {
  EnergyApi,
  type EnergyMeterSummaryDto,
} from "@/api/energy";

function formatNumber(value?: number | null, digits = 2): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "—";
  }

  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function formatDateTime(value?: string | null): string {
  if (!value) return "No data";
  return new Date(value).toLocaleString();
}

function statusClass(value: boolean): string {
  return value
    ? "border-emerald-300/30 bg-emerald-500/15 text-emerald-100"
    : "border-rose-300/30 bg-rose-500/15 text-rose-100";
}

function protocolClass(protocol: string): string {
  const normalized = protocol.toUpperCase();

  if (normalized === "BACNET") {
    return "border-cyan-300/30 bg-cyan-500/15 text-cyan-100";
  }

  if (normalized === "MODBUS") {
    return "border-violet-300/30 bg-violet-500/15 text-violet-100";
  }

  return "border-emerald-300/30 bg-emerald-500/15 text-emerald-100";
}

export default function EnergyMeterMappingPage() {
  const navigate = useNavigate();
  const { tenantId, siteId } = useParams();

  const [discoveredMeters, setDiscoveredMeters] = useState<
    DiscoveredEnergyMeterDto[]
  >([]);
  const [mappedMeters, setMappedMeters] = useState<EnergyMeterSummaryDto[]>([]);
  const [selectedMeter, setSelectedMeter] =
    useState<DiscoveredEnergyMeterDto | null>(null);

  const [meterName, setMeterName] = useState("");
  const [location, setLocation] = useState("");
  const [baselinePowerKw, setBaselinePowerKw] = useState("10.000");
  const [ratedPowerKw, setRatedPowerKw] = useState("20.000");
  const [costPerKwh, setCostPerKwh] = useState("0.3000");
  const [co2KgPerKwh, setCo2KgPerKwh] = useState("0.1000");

  const [loading, setLoading] = useState(true);
  const [mapping, setMapping] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const resolvedTenantId = tenantId ?? "";
  const resolvedSiteId = siteId ?? "";

  const glassButton =
  "inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-slate-100 shadow-lg shadow-black/20 backdrop-blur-xl transition hover:bg-white/15";

  useEffect(() => {
    if (!resolvedTenantId || !resolvedSiteId) {
      setError("Missing tenant or site id for Energy Meter Mapping.");
      setLoading(false);
      return;
    }

    loadPage(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedTenantId, resolvedSiteId]);

  async function loadPage(isBackgroundRefresh = true) {
    try {
      if (isBackgroundRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      const [discoveredResponse, mappedResponse] = await Promise.all([
        EnergyDiscoveryApi.getDiscoveredMeters(resolvedTenantId, resolvedSiteId),
        EnergyApi.getEnergyMeters(resolvedSiteId),
      ]);

      setDiscoveredMeters(discoveredResponse);
      setMappedMeters(mappedResponse);
    } catch (err) {
      console.error("Failed to load energy meter mapping page:", err);
      setError(
        "Cannot load Energy Meter Mapping. Please check backend API, login token, and permissions."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const unmappedMeters = useMemo(
    () => discoveredMeters.filter((meter) => !meter.mapped),
    [discoveredMeters]
  );

  const mappedCount = useMemo(
    () => discoveredMeters.filter((meter) => meter.mapped).length,
    [discoveredMeters]
  );

  function openMapModal(meter: DiscoveredEnergyMeterDto) {
    setSelectedMeter(meter);
    setMeterName(meter.deviceName || meter.externalDeviceId);
    setLocation(meter.location || "");
    setBaselinePowerKw("10.000");
    setRatedPowerKw("20.000");
    setCostPerKwh("0.3000");
    setCo2KgPerKwh("0.1000");
    setSuccessMessage(null);
    setError(null);
  }

  function closeMapModal() {
    if (mapping) return;
    setSelectedMeter(null);
  }

  async function handleMapMeter() {
    if (!selectedMeter) return;

    try {
      setMapping(true);
      setError(null);
      setSuccessMessage(null);

      const req: MapDiscoveredEnergyMeterRequest = {
        discoveredMeterId: selectedMeter.discoveredMeterId,
        meterName: meterName.trim() || selectedMeter.deviceName || selectedMeter.externalDeviceId,
        location: location.trim() || selectedMeter.location || null,
        baselinePowerKw: toNullableNumber(baselinePowerKw),
        ratedPowerKw: toNullableNumber(ratedPowerKw),
        costPerKwh: toNullableNumber(costPerKwh),
        co2KgPerKwh: toNullableNumber(co2KgPerKwh),
      };

      const mapped = await EnergyDiscoveryApi.mapDiscoveredMeter(
        resolvedTenantId,
        resolvedSiteId,
        req
      );

      setSuccessMessage("Energy meter mapped successfully.");
      setSelectedMeter(null);

      await loadPage(true);

      navigate(
        `/admin/tenants/${resolvedTenantId}/sites/${resolvedSiteId}/energy/meters/${mapped.energyMeterId}/point-mapping`,
        {
          state: {
            meterName: mapped.meterName,
            externalDeviceId: mapped.externalDeviceId,
            protocol: mapped.protocol,
          },
        }
      );
    } catch (err) {
      console.error("Failed to map discovered energy meter:", err);
      setError(
        "Cannot map this energy meter. Please check permissions and backend logs."
      );
    } finally {
      setMapping(false);
    }
  }

  function toNullableNumber(value: string): number | null {
    const trimmed = value.trim();

    if (!trimmed) {
      return null;
    }

    const parsed = Number(trimmed);

    return Number.isFinite(parsed) ? parsed : null;
  }

  if (loading) {
    return (
      <PageShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="rounded-3xl border border-white/10 bg-white/6 p-8 shadow-2xl shadow-cyan-500/10 backdrop-blur-2xl">
            <Loader2 className="mx-auto h-9 w-9 animate-spin text-cyan-200" />
            <p className="mt-4 text-sm text-slate-300">
              Loading energy meter mapping...
            </p>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <main className="relative z-10 px-5 py-6 pb-12 md:px-8 lg:px-10">
        <div className="mb-5">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className={glassButton}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
    </div>
        <motion.section
          initial={{ opacity: 0, y: 18, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-3xl border border-white/10 bg-white/[0.07] p-6 shadow-2xl shadow-cyan-500/10 backdrop-blur-2xl"
        >
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-3 text-cyan-100">
                  <PlugZap className="h-6 w-6" />
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-cyan-200/70">
                    QbitLabs BMS Energy Mapping
                  </p>
                  <h1 className="mt-1 text-2xl font-bold text-white md:text-3xl">
                    Energy Meter Discovery & Mapping
                  </h1>
                </div>
              </div>

              <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">
                Review meters discovered by the Edge Controller, map them into
                production Energy Meters, then configure simulator, BACnet, or
                Modbus point mappings.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/user/tenants/${resolvedTenantId}/sites/${resolvedSiteId}/energy`
                  )
                }
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/15"
              >
                <ArrowLeft className="h-4 w-4" />
                Energy Dashboard
              </button>

              <button
                type="button"
                onClick={() => loadPage(true)}
                className="inline-flex items-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/20"
              >
                <RefreshCw
                  className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
            </div>
          </div>
        </motion.section>

        {error && (
          <div className="mt-5 rounded-3xl border border-rose-300/20 bg-rose-500/10 p-4 text-sm text-rose-100 shadow-2xl shadow-rose-500/10 backdrop-blur-2xl">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mt-5 rounded-3xl border border-emerald-300/20 bg-emerald-500/10 p-4 text-sm text-emerald-100 shadow-2xl shadow-emerald-500/10 backdrop-blur-2xl">
            {successMessage}
          </div>
        )}

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={<Cpu className="h-5 w-5" />}
            label="Discovered"
            value={String(discoveredMeters.length)}
            hint="Reported by Edge Controller"
          />
          <MetricCard
            icon={<AlertTriangle className="h-5 w-5" />}
            label="Unmapped"
            value={String(unmappedMeters.length)}
            hint="Ready for mapping"
            danger={unmappedMeters.length > 0}
          />
          <MetricCard
            icon={<CheckCircle2 className="h-5 w-5" />}
            label="Mapped"
            value={String(mappedCount)}
            hint="Linked to energy_meters"
          />
          <MetricCard
            icon={<Zap className="h-5 w-5" />}
            label="Production Meters"
            value={String(mappedMeters.length)}
            hint="Visible on Energy Dashboard"
          />
        </section>

        <section className="mt-6 grid gap-5 xl:grid-cols-[1.45fr_0.75fr]">
          <DiscoveredMetersPanel
            meters={discoveredMeters}
            onMap={openMapModal}
            tenantId={resolvedTenantId}
            siteId={resolvedSiteId}
          />

          <AiMappingPanel
            discoveredCount={discoveredMeters.length}
            unmappedCount={unmappedMeters.length}
            mappedCount={mappedCount}
          />
        </section>

        <MappedMetersPanel
          meters={mappedMeters}
          tenantId={resolvedTenantId}
          siteId={resolvedSiteId}
        />
      </main>

      {selectedMeter && (
        <MapMeterModal
          meter={selectedMeter}
          meterName={meterName}
          location={location}
          baselinePowerKw={baselinePowerKw}
          ratedPowerKw={ratedPowerKw}
          costPerKwh={costPerKwh}
          co2KgPerKwh={co2KgPerKwh}
          mapping={mapping}
          onMeterNameChange={setMeterName}
          onLocationChange={setLocation}
          onBaselinePowerChange={setBaselinePowerKw}
          onRatedPowerChange={setRatedPowerKw}
          onCostChange={setCostPerKwh}
          onCo2Change={setCo2KgPerKwh}
          onClose={closeMapModal}
          onSubmit={handleMapMeter}
        />
      )}
    </PageShell>
  );
}

function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-[-10%] top-[-10%] h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute right-[-10%] top-[20%] h-96 w-96 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute bottom-[-15%] left-[25%] h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>
      {children}
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  hint,
  danger = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  hint: string;
  danger?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl border p-5 shadow-2xl backdrop-blur-2xl ${
        danger
          ? "border-amber-300/20 bg-amber-500/10 shadow-amber-500/10"
          : "border-white/10 bg-white/6 shadow-cyan-500/10"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="rounded-2xl border border-white/10 bg-white/10 p-3 text-cyan-100">
          {icon}
        </div>
        <Activity className="h-4 w-4 text-slate-500" />
      </div>

      <p className="mt-5 text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-bold text-white">{value}</p>
      <p className="mt-2 text-xs text-slate-400">{hint}</p>
    </div>
  );
}

function DiscoveredMetersPanel({
  meters,
  onMap,
  tenantId,
  siteId,
}: {
  meters: DiscoveredEnergyMeterDto[];
  onMap: (meter: DiscoveredEnergyMeterDto) => void;
  tenantId: string;
  siteId: string;
}) {
  const navigate = useNavigate();

  return (
    <section className="rounded-3xl border border-white/10 bg-white/6 p-5 shadow-2xl shadow-cyan-500/10 backdrop-blur-2xl">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-white">
          Discovered Energy Meters
        </h2>
        <p className="text-sm text-slate-300">
          Meters found by Edge Controller discovery scan.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="min-w-full divide-y divide-white/10 text-sm">
          <thead className="bg-white/4 text-left text-xs uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-4 py-3">Meter</th>
              <th className="px-4 py-3">Protocol</th>
              <th className="px-4 py-3">Power</th>
              <th className="px-4 py-3">Energy</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Mapped</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/10">
            {meters.map((meter) => (
              <tr
                key={meter.discoveredMeterId}
                className="text-slate-200 hover:bg-white/4"
              >
                <td className="px-4 py-4">
                  <p className="font-semibold text-white">
                    {meter.deviceName || meter.externalDeviceId}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {meter.externalDeviceId}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                    <MapPin className="h-3 w-3" />
                    {meter.location || "No location"}
                  </p>
                </td>

                <td className="px-4 py-4">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${protocolClass(
                      meter.protocol
                    )}`}
                  >
                    {meter.protocol}
                  </span>
                </td>

                <td className="px-4 py-4">
                  {formatNumber(meter.activePowerKw, 2)} kW
                </td>

                <td className="px-4 py-4">
                  {formatNumber(meter.totalEnergyKwh, 2)} kWh
                </td>

                <td className="px-4 py-4">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${statusClass(
                      meter.online
                    )}`}
                  >
                    {meter.online ? "ONLINE" : "OFFLINE"}
                  </span>
                </td>

                <td className="px-4 py-4">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${
                      meter.mapped
                        ? "border-emerald-300/30 bg-emerald-500/15 text-emerald-100"
                        : "border-amber-300/30 bg-amber-500/15 text-amber-100"
                    }`}
                  >
                    {meter.mapped ? "MAPPED" : "UNMAPPED"}
                  </span>
                </td>

                <td className="px-4 py-4 text-right">
                  {meter.mapped ? (
                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/admin/tenants/${tenantId}/sites/${siteId}/energy`
                        )
                      }
                      className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs font-medium text-cyan-100 transition hover:bg-cyan-300/20"
                    >
                      Dashboard
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onMap(meter)}
                      className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-xs font-medium text-emerald-100 transition hover:bg-emerald-300/20"
                    >
                      Map Meter
                    </button>
                  )}
                </td>
              </tr>
            ))}

            {meters.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center text-sm text-slate-400"
                >
                  No discovered energy meters yet. Run Edge discovery scan or
                  simulator discovery sender.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AiMappingPanel({
  discoveredCount,
  unmappedCount,
  mappedCount,
}: {
  discoveredCount: number;
  unmappedCount: number;
  mappedCount: number;
}) {
  const message =
    discoveredCount === 0
      ? "No meters have been discovered yet. Run Edge Controller simulator discovery first."
      : unmappedCount > 0
        ? "Some discovered meters are not mapped yet. Map them before configuring point mappings and live telemetry."
        : "All discovered meters are mapped. Next step is point mapping validation for simulator, BACnet, or Modbus.";

  return (
    <section className="rounded-3xl border border-cyan-300/15 bg-cyan-300/[0.07] p-5 shadow-2xl shadow-cyan-500/10 backdrop-blur-2xl">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-3 text-cyan-100">
          <Sparkles className="h-5 w-5" />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white">
            AI Mapping Guidance
          </h2>
          <p className="text-sm text-slate-300">
            Production checklist for energy meter onboarding.
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
        <p className="text-sm leading-6 text-slate-200">{message}</p>
      </div>

      <div className="mt-4 grid gap-3">
        <MiniInsight
          icon={<Cpu className="h-4 w-4" />}
          label="Discovered"
          value={String(discoveredCount)}
        />
        <MiniInsight
          icon={<AlertTriangle className="h-4 w-4" />}
          label="Needs Mapping"
          value={String(unmappedCount)}
          danger={unmappedCount > 0}
        />
        <MiniInsight
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Mapped"
          value={String(mappedCount)}
        />
      </div>
    </section>
  );
}

function MiniInsight({
  icon,
  label,
  value,
  danger = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        danger
          ? "border-amber-300/20 bg-amber-500/10 text-amber-100"
          : "border-white/10 bg-white/4 text-slate-200"
      }`}
    >
      <div className="flex items-center gap-2 text-xs text-slate-400">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function MappedMetersPanel({
  meters,
  tenantId,
  siteId,
}: {
  meters: EnergyMeterSummaryDto[];
  tenantId: string;
  siteId: string;
}) {
  const navigate = useNavigate();

  return (
    <section className="mt-6 rounded-3xl border border-white/10 bg-white/6 p-5 shadow-2xl shadow-cyan-500/10 backdrop-blur-2xl">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-white">
          Production Energy Meters
        </h2>
        <p className="text-sm text-slate-300">
          Meters already mapped to the Energy module.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="min-w-full divide-y divide-white/10 text-sm">
          <thead className="bg-white/4 text-left text-xs uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-4 py-3">Meter</th>
              <th className="px-4 py-3">Protocol</th>
              <th className="px-4 py-3">Power</th>
              <th className="px-4 py-3">Energy</th>
              <th className="px-4 py-3">Efficiency</th>
              <th className="px-4 py-3">Last Seen</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/10">
            {meters.map((meter) => (
              <tr
                key={meter.energyMeterId}
                className="text-slate-200 hover:bg-white/4"
              >
                <td className="px-4 py-4">
                  <p className="font-semibold text-white">{meter.meterName}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {meter.externalDeviceId}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {meter.location || "No location"}
                  </p>
                </td>

                <td className="px-4 py-4">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${protocolClass(
                      meter.protocol
                    )}`}
                  >
                    {meter.protocol}
                  </span>
                </td>

                <td className="px-4 py-4">
                  {formatNumber(meter.activePowerKw, 2)} kW
                </td>

                <td className="px-4 py-4">
                  {formatNumber(meter.totalEnergyKwh, 2)} kWh
                </td>

                <td className="px-4 py-4">
                  {formatNumber(meter.efficiencyScore, 1)}%
                </td>

                <td className="px-4 py-4 text-xs text-slate-400">
                  {formatDateTime(meter.telemetryTime)}
                </td>

                <td className="px-4 py-4 text-right">
                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        `/admin/tenants/${tenantId}/sites/${siteId}/energy/meters/${meter.energyMeterId}/point-mapping`,
                        {
                          state: {
                            meterName: meter.meterName,
                            externalDeviceId: meter.externalDeviceId,
                            protocol: meter.protocol,
                          },
                        }
                      )
                    }
                    className="inline-flex items-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs font-medium text-cyan-100 transition hover:bg-cyan-300/20"
                  >
                    <Settings2 className="h-3.5 w-3.5" />
                    Point Mapping
                  </button>
                </td>
              </tr>
            ))}

            {meters.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center text-sm text-slate-400"
                >
                  No production energy meters yet. Map a discovered meter first.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function MapMeterModal({
  meter,
  meterName,
  location,
  baselinePowerKw,
  ratedPowerKw,
  costPerKwh,
  co2KgPerKwh,
  mapping,
  onMeterNameChange,
  onLocationChange,
  onBaselinePowerChange,
  onRatedPowerChange,
  onCostChange,
  onCo2Change,
  onClose,
  onSubmit,
}: {
  meter: DiscoveredEnergyMeterDto;
  meterName: string;
  location: string;
  baselinePowerKw: string;
  ratedPowerKw: string;
  costPerKwh: string;
  co2KgPerKwh: string;
  mapping: boolean;
  onMeterNameChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onBaselinePowerChange: (value: string) => void;
  onRatedPowerChange: (value: string) => void;
  onCostChange: (value: string) => void;
  onCo2Change: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-3xl rounded-3xl border border-white/10 bg-slate-950/95 p-6 text-slate-100 shadow-2xl shadow-cyan-500/20"
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">
              Map Discovered Meter
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white">
              {meter.deviceName || meter.externalDeviceId}
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              {meter.externalDeviceId} · {meter.protocol}
            </p>
          </div>

          <span
            className={`rounded-full border px-3 py-1 text-xs font-medium ${protocolClass(
              meter.protocol
            )}`}
          >
            {meter.protocol}
          </span>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field
            label="Meter Name"
            value={meterName}
            onChange={onMeterNameChange}
            placeholder="Main Incoming Energy Meter"
          />
          <Field
            label="Location"
            value={location}
            onChange={onLocationChange}
            placeholder="Main Switchboard"
          />
          <Field
            label="Baseline Power kW"
            value={baselinePowerKw}
            onChange={onBaselinePowerChange}
            placeholder="10.000"
          />
          <Field
            label="Rated Power kW"
            value={ratedPowerKw}
            onChange={onRatedPowerChange}
            placeholder="20.000"
          />
          <Field
            label="Cost per kWh"
            value={costPerKwh}
            onChange={onCostChange}
            placeholder="0.3000"
          />
          <Field
            label="CO₂ kg per kWh"
            value={co2KgPerKwh}
            onChange={onCo2Change}
            placeholder="0.1000"
          />
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
          <p>
            After mapping, this meter becomes a production Energy Meter. Next
            step is Point Mapping for simulator, BACnet, or Modbus.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={mapping}
            className="rounded-2xl border border-white/10 bg-white/10 px-5 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-white/15 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSubmit}
            disabled={mapping}
            className="inline-flex items-center gap-2 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-5 py-2.5 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-300/20 disabled:opacity-50"
          >
            {mapping && <Loader2 className="h-4 w-4 animate-spin" />}
            Map Meter
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/40 focus:bg-white/10"
      />
    </label>
  );
}