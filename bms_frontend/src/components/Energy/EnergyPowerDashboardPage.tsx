import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  BatteryCharging,
  Bolt,
  Building2,
  Gauge,
  Leaf,
  Loader2,
  PlugZap,
  RefreshCw,
  Settings2,
  Sparkles,
  TrendingUp,
  Zap,
  ArrowLeft,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

import {
  EnergyApi,
  type EnergyMeterSummaryDto,
  type EnergyOverviewResponse,
} from "@/api/energy";

function formatNumber(value: number | null | undefined, digits = 2): string {
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

function onlineStatusClass(status: string): string {
  return status === "ONLINE"
    ? "border-emerald-300/30 bg-emerald-500/15 text-emerald-100"
    : "border-rose-300/30 bg-rose-500/15 text-rose-100";
}

function efficiencyClass(value?: number | null): string {
  const score = Number(value ?? 0);

  if (score >= 85) return "text-emerald-200";
  if (score >= 65) return "text-amber-200";
  return "text-rose-200";
}

function efficiencyBadgeClass(value?: number | null): string {
  const score = Number(value ?? 0);

  if (score >= 85) {
    return "border-emerald-300/30 bg-emerald-500/15 text-emerald-100";
  }

  if (score >= 65) {
    return "border-amber-300/30 bg-amber-500/15 text-amber-100";
  }

  return "border-rose-300/30 bg-rose-500/15 text-rose-100";
}

function chartTextColor() {
  return "#cbd5e1";
}

function gridColor() {
  return "rgba(255,255,255,0.08)";
}

/**
 * ViewportLoadOnce
 *
 * Production-safe lazy loading.
 * It mounts expensive sections only once when they come near the viewport.
 */
function ViewportLoadOnce({
  children,
  fallback,
  delay = 0,
  y = 18,
}: {
  children: ReactNode;
  fallback?: ReactNode;
  delay?: number;
  y?: number;
}) {
  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: "300px 0px",
    threshold: 0.05,
  });

  return (
    <div ref={ref}>
      {inView ? (
        <motion.div
          initial={{ opacity: 0, y, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: 0.38,
            delay,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {children}
        </motion.div>
      ) : (
        fallback ?? <EnergySkeletonCard />
      )}
    </div>
  );
}

function EnergySkeletonCard({ minHeight = "min-h-[220px]" }: { minHeight?: string }) {
  return (
    <div
      className={`${minHeight} animate-pulse rounded-3xl border border-white/10 bg-white/6 p-5 shadow-2xl shadow-cyan-500/10 backdrop-blur-2xl`}
    >
      <div className="h-4 w-40 rounded-full bg-white/10" />
      <div className="mt-4 h-8 w-56 rounded-full bg-white/10" />
      <div className="mt-6 grid gap-3">
        <div className="h-16 rounded-2xl bg-white/10" />
        <div className="h-16 rounded-2xl bg-white/10" />
      </div>
    </div>
  );
}

export default function EnergyPowerDashboardPage() {
  const navigate = useNavigate();
  const { tenantId, siteId } = useParams();

  const [overview, setOverview] = useState<EnergyOverviewResponse | null>(null);
  const [meters, setMeters] = useState<EnergyMeterSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const glassButton =
  "inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-slate-100 shadow-lg shadow-black/20 backdrop-blur-xl transition hover:bg-white/15";

  const resolvedSiteId = siteId ?? "";

  /**
   * Loads energy dashboard data.
   * This fetches overview and meter current-state together.
   */
  useEffect(() => {
    if (!resolvedSiteId) {
      setError("Missing site id for Energy Dashboard.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadEnergyData(isBackgroundRefresh = false) {
      try {
        if (isBackgroundRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError(null);

        const [overviewResponse, metersResponse] = await Promise.all([
          EnergyApi.getEnergyOverview(resolvedSiteId, 7),
          EnergyApi.getEnergyMeters(resolvedSiteId),
        ]);

        if (!cancelled) {
          setOverview(overviewResponse);
          setMeters(metersResponse);
        }
      } catch (err) {
        console.error("Failed to load energy dashboard:", err);

        if (!cancelled) {
          setError(
            "Cannot load Energy Dashboard. Please check backend Energy APIs, permissions, and site assignment."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    loadEnergyData(false);

    const intervalId = window.setInterval(() => {
      loadEnergyData(true);
    }, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [resolvedSiteId]);

  const chartData = useMemo(() => {
    return (overview?.trend ?? []).map((item) => ({
      date: item.date?.slice(5) ?? item.date,
      energyKwh: Number(item.energyKwh ?? 0),
      averagePowerKw: Number(item.averagePowerKw ?? 0),
      averageEfficiencyScore: Number(item.averageEfficiencyScore ?? 0),
      estimatedCost: Number(item.estimatedCost ?? 0),
    }));
  }, [overview]);

  const criticalMeters = useMemo(() => {
    return meters.filter((meter) => Number(meter.efficiencyScore ?? 100) < 65);
  }, [meters]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="rounded-3xl border border-white/10 bg-white/6 p-8 shadow-2xl shadow-cyan-500/10 backdrop-blur-2xl">
            <Loader2 className="mx-auto h-9 w-9 animate-spin text-cyan-200" />
            <p className="mt-4 text-sm text-slate-300">
              Loading energy intelligence dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100">
        <div className="rounded-3xl border border-rose-300/20 bg-rose-500/10 p-6 text-rose-100 shadow-2xl shadow-rose-500/10 backdrop-blur-2xl">
          <h2 className="text-lg font-semibold">Energy dashboard unavailable</h2>
          <p className="mt-2 text-sm text-rose-100/80">{error}</p>

          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="mt-5 rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/15"
          >
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="relative z-20 px-5 pt-6 md:px-8 lg:px-10">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className={glassButton}
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>
    </div>
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-[-10%] top-[-10%] h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute right-[-10%] top-[20%] h-96 w-96 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute bottom-[-15%] left-[25%] h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <main className="relative z-10 px-5 py-6 pb-12 md:px-8 lg:px-10">
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
                    QbitLabs BMS Energy Intelligence
                  </p>
                  <h1 className="mt-1 text-2xl font-bold text-white md:text-3xl">
                    Power Consumption & Efficiency
                  </h1>
                </div>
              </div>

              <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">
                Real-time energy meter telemetry, consumption trend, estimated
                cost, carbon estimate, online status, and efficiency scoring
                from Edge Controller energy ingestion.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-emerald-300/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                <p className="text-xs text-emerald-100/70">Meters</p>
                <p className="font-semibold">
                  {overview.onlineMeters} Online / {overview.offlineMeters} Offline
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/admin/tenants/${tenantId}/sites/${resolvedSiteId}/energy/mapping`
                  )
                }
                className="inline-flex items-center gap-2 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-300/20"
              >
                <Settings2 className="h-4 w-4" />
                Meter Mapping
              </button>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/20"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>
        </motion.section>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={<Bolt className="h-5 w-5" />}
            label="Current Load"
            value={`${formatNumber(overview.currentPowerKw, 2)} kW`}
            hint="Live power demand"
          />

          <MetricCard
            icon={<BatteryCharging className="h-5 w-5" />}
            label="Today Usage"
            value={`${formatNumber(overview.todayEnergyKwh, 2)} kWh`}
            hint="Consumption since midnight"
          />

          <MetricCard
            icon={<TrendingUp className="h-5 w-5" />}
            label="Estimated Cost"
            value={`$${formatNumber(overview.estimatedTodayCost, 2)}`}
            hint="Based on meter tariff"
          />

          <MetricCard
            icon={<Gauge className="h-5 w-5" />}
            label="Efficiency Score"
            value={`${formatNumber(overview.averageEfficiencyScore, 1)}%`}
            hint="Higher is better"
            valueClass={efficiencyClass(overview.averageEfficiencyScore)}
          />
        </section>

        <section className="mt-6 grid gap-5 xl:grid-cols-[1.5fr_0.8fr]">
          <ViewportLoadOnce fallback={<EnergySkeletonCard minHeight="min-h-[420px]" />}>
            <EnergyTrendChart data={chartData} />
          </ViewportLoadOnce>

          <ViewportLoadOnce delay={0.08} fallback={<EnergySkeletonCard minHeight="min-h-[420px]" />}>
            <EnergyAiInsightPanel
              overview={overview}
              criticalMeters={criticalMeters}
              meterCount={meters.length}
            />
          </ViewportLoadOnce>
        </section>

        <ViewportLoadOnce fallback={<EnergySkeletonCard minHeight="min-h-[520px]" />}>
          <EnergyMetersTable meters={meters} />
        </ViewportLoadOnce>
      </main>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  hint,
  valueClass = "text-white",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  hint: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/6 p-5 shadow-2xl shadow-cyan-500/10 backdrop-blur-2xl">
      <div className="flex items-center justify-between">
        <div className="rounded-2xl border border-white/10 bg-white/10 p-3 text-cyan-100">
          {icon}
        </div>
        <Activity className="h-4 w-4 text-slate-500" />
      </div>

      <p className="mt-5 text-sm text-slate-400">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${valueClass}`}>{value}</p>
      <p className="mt-2 text-xs text-slate-400">{hint}</p>
    </div>
  );
}

function EnergyTrendChart({
  data,
}: {
  data: Array<{
    date: string;
    energyKwh: number;
    averagePowerKw: number;
    averageEfficiencyScore: number;
    estimatedCost: number;
  }>;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/6 p-5 shadow-2xl shadow-cyan-500/10 backdrop-blur-2xl">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-3 text-cyan-100">
          <Zap className="h-5 w-5" />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white">7-Day Energy Trend</h2>
          <p className="text-sm text-slate-300">
            Daily kWh usage and average load from cumulative meter readings.
          </p>
        </div>
      </div>

      <div className="h-80 w-full">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-2xl border border-white/10 bg-slate-950/50 text-sm text-slate-400">
            No energy telemetry available yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="energyKwhGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="powerKwGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#a78bfa" stopOpacity={0.02} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke={gridColor()} />
              <XAxis dataKey="date" stroke={chartTextColor()} fontSize={11} />
              <YAxis stroke={chartTextColor()} fontSize={11} />

              <Tooltip
                contentStyle={{
                  background: "rgba(15,23,42,0.96)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "16px",
                  color: "#f8fafc",
                }}
                labelStyle={{
                  color: "#ffffff",
                  fontWeight: 600,
                }}
              />

              <Area
                type="monotone"
                dataKey="energyKwh"
                name="Energy kWh"
                stroke="#22d3ee"
                fill="url(#energyKwhGradient)"
                strokeWidth={2}
              />

              <Area
                type="monotone"
                dataKey="averagePowerKw"
                name="Avg Power kW"
                stroke="#a78bfa"
                fill="url(#powerKwGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function EnergyAiInsightPanel({
  overview,
  criticalMeters,
  meterCount,
}: {
  overview: EnergyOverviewResponse;
  criticalMeters: EnergyMeterSummaryDto[];
  meterCount: number;
}) {
  const efficiency = Number(overview.averageEfficiencyScore ?? 0);

  const message =
    meterCount === 0
      ? "No energy meters are configured for this site yet."
      : efficiency >= 85
        ? "Energy profile looks healthy. Current load is close to expected baseline."
        : efficiency >= 65
          ? "Energy efficiency is moderate. Review operating schedule, HVAC runtime, and after-hours load."
          : "Energy efficiency is low. Investigate abnormal load, stuck equipment, poor power factor, or after-hours operation.";

  return (
    <div className="h-full rounded-3xl border border-cyan-300/15 bg-cyan-300/[0.07] p-5 shadow-2xl shadow-cyan-500/10 backdrop-blur-2xl">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-3 text-cyan-100">
          <Sparkles className="h-5 w-5" />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white">AI Energy Insight</h2>
          <p className="text-sm text-slate-300">
            Rule-based insight now. OpenAI explanation can be added later.
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
        <p className="text-xs uppercase tracking-[0.25em] text-cyan-200/70">
          Efficiency interpretation
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-200">{message}</p>
      </div>

      <div className="mt-4 grid gap-3">
        <InsightMiniCard
          icon={<Leaf className="h-4 w-4" />}
          label="CO₂ Estimate"
          value={`${formatNumber(overview.estimatedTodayCo2Kg, 2)} kg`}
        />

        <InsightMiniCard
          icon={<AlertTriangle className="h-4 w-4" />}
          label="Low Efficiency Meters"
          value={String(criticalMeters.length)}
          danger={criticalMeters.length > 0}
        />

        <InsightMiniCard
          icon={<Building2 className="h-4 w-4" />}
          label="Configured Meters"
          value={String(meterCount)}
        />
      </div>
    </div>
  );
}

function InsightMiniCard({
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
          ? "border-rose-300/20 bg-rose-500/10 text-rose-100"
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

function EnergyMetersTable({ meters }: { meters: EnergyMeterSummaryDto[] }) {
  return (
    <section className="mt-6 rounded-3xl border border-white/10 bg-white/6 p-5 shadow-2xl shadow-cyan-500/10 backdrop-blur-2xl">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Energy Meters</h2>
          <p className="text-sm text-slate-300">
            BACnet, Modbus, and simulator-ready meter current state.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-2 text-xs text-slate-400">
          {meters.length} meter(s)
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="min-w-full divide-y divide-white/10 text-sm">
          <thead className="bg-white/4 text-left text-xs uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-4 py-3">Meter</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Power</th>
              <th className="px-4 py-3">Total kWh</th>
              <th className="px-4 py-3">Power Factor</th>
              <th className="px-4 py-3">Efficiency</th>
              <th className="px-4 py-3">Last Seen</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/10">
            {meters.map((meter) => (
              <tr key={meter.energyMeterId} className="text-slate-200 hover:bg-white/4">
                <td className="px-4 py-4">
                  <p className="font-semibold text-white">{meter.meterName}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {meter.externalDeviceId} · {meter.protocol}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {meter.location ?? "No location"}
                  </p>
                </td>

                <td className="px-4 py-4">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${onlineStatusClass(
                      meter.status
                    )}`}
                  >
                    {meter.status}
                  </span>
                </td>

                <td className="px-4 py-4">{formatNumber(meter.activePowerKw, 2)} kW</td>

                <td className="px-4 py-4">{formatNumber(meter.totalEnergyKwh, 2)} kWh</td>

                <td className="px-4 py-4">{formatNumber(meter.powerFactor, 2)}</td>

                <td className="px-4 py-4">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${efficiencyBadgeClass(
                      meter.efficiencyScore
                    )}`}
                  >
                    {formatNumber(meter.efficiencyScore, 1)}%
                  </span>
                </td>

                <td className="px-4 py-4 text-xs text-slate-400">
                  {formatDateTime(meter.telemetryTime)}
                </td>
              </tr>
            ))}

            {meters.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-400">
                  No energy meters found. Send simulator telemetry or create an
                  energy meter from the management screen later.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}