import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Activity,
  Building2,
  Cpu,
  Gauge,
  Loader2,
  MapPin,
  ShieldCheck,
  Sparkles,
  Thermometer,
  Wrench,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  BmsApi,
  type DashboardAiInsightDto,
  type DashboardOverviewResponse,
  type DashboardSiteCardDto,
} from "@/api/bms";
import { DashboardChartsSection } from "./DashboardCharts";

function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat().format(value);
}

function formatTemp(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${value.toFixed(1)}°C`;
}

function riskBadgeClass(riskLevel: string) {
  if (riskLevel === "CRITICAL") {
    return "border-rose-300/40 bg-rose-500/15 text-rose-100";
  }

  if (riskLevel === "WARNING") {
    return "border-amber-300/40 bg-amber-500/15 text-amber-100";
  }

  return "border-emerald-300/40 bg-emerald-500/15 text-emerald-100";
}

function healthBarClass(score: number) {
  if (score < 50) return "bg-rose-400";
  if (score < 75) return "bg-amber-300";
  return "bg-emerald-300";
}

function roleTitle(role: string) {
  if (role === "BMS_ADMIN") return "Command Center";
  if (role === "SITE_MANAGER") return "Site Operations Dashboard";
  return "Technician Action Dashboard";
}

export default function RoleBasedDashboardPage() {
  const navigate = useNavigate();

  const [data, setData] = useState<DashboardOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRisk, setSelectedRisk] = useState<"ALL" | "CRITICAL" | "WARNING" | "HEALTHY">("ALL");

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError(null);

        const response = await BmsApi.getDashboardOverview();

        if (!cancelled) {
          setData(response);
        }
      } catch (err) {
        console.error(err);

        if (!cancelled) {
          setError("Cannot load dashboard overview. Please check backend API and role permissions.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredSites = useMemo(() => {
    if (!data) return [];

    if (selectedRisk === "ALL") {
      return data.sites;
    }

    return data.sites.filter((site) => site.riskLevel === selectedRisk);
  }, [data, selectedRisk]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-8 shadow-2xl shadow-cyan-500/10 backdrop-blur-2xl">
            <Loader2 className="mx-auto h-9 w-9 animate-spin text-cyan-200" />
            <p className="mt-4 text-sm text-slate-300">Loading BMS intelligence dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100">
        <div className="rounded-3xl border border-rose-300/20 bg-rose-500/10 p-6 text-rose-100 shadow-2xl shadow-rose-500/10 backdrop-blur-2xl">
          <h2 className="text-lg font-semibold">Dashboard unavailable</h2>
          <p className="mt-2 text-sm text-rose-100/80">{error}</p>
        </div>
      </div>
    );
  }

  const { kpis } = data;

  return (
    <div className="min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-[-10%] top-[-10%] h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute right-[-10%] top-[20%] h-96 w-96 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute bottom-[-15%] left-[25%] h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <main className="relative z-10 px-5 py-6 md:px-8 lg:px-10">
        <DashboardHeader role={data.role} generatedAt={data.generatedAt} />

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            icon={<Building2 className="h-5 w-5" />}
            label={data.role === "BMS_ADMIN" ? "Tenants / Sites" : "Assigned Sites"}
            value={
              data.role === "BMS_ADMIN"
                ? `${formatNumber(kpis.totalTenants)} / ${formatNumber(kpis.totalSites)}`
                : formatNumber(kpis.totalSites)
            }
            hint="Access controlled by backend"
          />

          <KpiCard
            icon={<Cpu className="h-5 w-5" />}
            label="Total HVACs"
            value={formatNumber(kpis.totalHvacs)}
            hint={`${formatNumber(kpis.activeHvacs)} active machines`}
          />

          <KpiCard
            icon={<AlertTriangle className="h-5 w-5" />}
            label="Failed HVACs"
            value={formatNumber(kpis.failedHvacs)}
            hint={`${formatNumber(kpis.openAlerts)} open alerts`}
            danger={kpis.failedHvacs > 0}
          />

          <KpiCard
            icon={<Thermometer className="h-5 w-5" />}
            label="Average Temperature"
            value={formatTemp(kpis.averageTemperature)}
            hint={`${formatNumber(kpis.highRiskSites)} high-risk site(s)`}
          />
        </section>

        <DashboardChartsSection data={data} />

        <section className="mt-6 grid gap-5 xl:grid-cols-[1.5fr_1fr]">
          <div className="rounded-3xl border border-white/10 bg-white/6 p-5 shadow-2xl shadow-cyan-500/10 backdrop-blur-2xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">
                  Role-based operations
                </p>
                <h2 className="mt-2 text-xl font-semibold text-white">
                  {roleTitle(data.role)}
                </h2>
                <p className="mt-1 text-sm text-slate-300">
                  Showing only the tenant and site data allowed for your role.
                </p>
              </div>

              <RiskFilter value={selectedRisk} onChange={setSelectedRisk} />
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {filteredSites.map((site) => (
                <SiteHealthCard
                  key={site.siteId}
                  site={site}
                  onOpen={() =>
                    navigate(`/tenants/${site.tenantId}/sites/${site.siteId}/hvacs`, {
                      state: {
                        tenantName: site.tenantName,
                        siteName: site.siteName,
                      },
                    })
                  }
                />
              ))}

              {filteredSites.length === 0 && (
                <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 text-sm text-slate-300">
                  No sites found for this filter.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-5">
            <AiInsightsPanel insights={data.aiInsights} role={data.role} />

            <RiskSitesPanel sites={data.riskSites} />
          </div>
        </section>

        {data.role === "BMS_ADMIN" && (
          <section className="mt-6 rounded-3xl border border-white/10 bg-white/6 p-5 shadow-2xl shadow-violet-500/10 backdrop-blur-2xl">
            <div className="mb-4 flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-violet-200" />
              <div>
                <h2 className="text-lg font-semibold text-white">Tenant comparison</h2>
                <p className="text-sm text-slate-300">
                  Global comparison for admin decision making.
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/10">
              <table className="min-w-full divide-y divide-white/10 text-sm">
                <thead className="bg-white/4 text-left text-xs uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Tenant</th>
                    <th className="px-4 py-3">Sites</th>
                    <th className="px-4 py-3">HVACs</th>
                    <th className="px-4 py-3">Failed</th>
                    <th className="px-4 py-3">Open alerts</th>
                    <th className="px-4 py-3">Avg temp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {data.tenants.map((tenant) => (
                    <tr key={tenant.tenantId} className="text-slate-200 hover:bg-white/4">
                      <td className="px-4 py-3 font-medium text-white">{tenant.tenantName}</td>
                      <td className="px-4 py-3">{tenant.totalSites}</td>
                      <td className="px-4 py-3">{tenant.totalHvacs}</td>
                      <td className="px-4 py-3 text-rose-200">{tenant.failedHvacs}</td>
                      <td className="px-4 py-3 text-amber-200">{tenant.openAlerts}</td>
                      <td className="px-4 py-3">{formatTemp(tenant.averageTemperature)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function DashboardHeader({ role, generatedAt }: { role: string; generatedAt: string }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.07] p-6 shadow-2xl shadow-cyan-500/10 backdrop-blur-2xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-3 text-cyan-100">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-cyan-200/70">
                QbitLabs BMS Intelligence
              </p>
              <h1 className="mt-1 text-2xl font-bold text-white md:text-3xl">
                {roleTitle(role)}
              </h1>
            </div>
          </div>

          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">
            AI-ready operational dashboard for HVAC health, site risk, maintenance priority,
            tenant comparison, alerts, and technician actions.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-300">
          <p className="text-slate-400">Current role</p>
          <p className="mt-1 font-semibold text-cyan-100">{role}</p>
          <p className="mt-2 text-xs text-slate-500">
            Updated {new Date(generatedAt).toLocaleString()}
          </p>
        </div>
      </div>
    </section>
  );
}

function KpiCard({
  icon,
  label,
  value,
  hint,
  danger = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  danger?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-3xl border p-5 shadow-2xl backdrop-blur-2xl ${
        danger
          ? "border-rose-300/20 bg-rose-500/10 shadow-rose-500/10"
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
    </motion.div>
  );
}

function RiskFilter({
  value,
  onChange,
}: {
  value: "ALL" | "CRITICAL" | "WARNING" | "HEALTHY";
  onChange: (value: "ALL" | "CRITICAL" | "WARNING" | "HEALTHY") => void;
}) {
  const values: Array<"ALL" | "CRITICAL" | "WARNING" | "HEALTHY"> = [
    "ALL",
    "CRITICAL",
    "WARNING",
    "HEALTHY",
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {values.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onChange(item)}
          className={`rounded-2xl border px-4 py-2 text-xs font-medium transition ${
            value === item
              ? "border-cyan-300/40 bg-cyan-300/15 text-cyan-100"
              : "border-white/10 bg-white/4 text-slate-300 hover:bg-white/8"
          }`}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

function SiteHealthCard({
  site,
  onOpen,
}: {
  site: DashboardSiteCardDto;
  onOpen: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-white/10 bg-slate-950/50 p-5 shadow-xl shadow-black/20"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">{site.siteName}</h3>
          <p className="mt-1 text-xs text-slate-400">{site.tenantName}</p>

          {site.address && (
            <p className="mt-2 flex items-center gap-2 text-xs text-slate-500">
              <MapPin className="h-3.5 w-3.5" />
              {site.address}
            </p>
          )}
        </div>

        <span className={`rounded-full border px-3 py-1 text-xs ${riskBadgeClass(site.riskLevel)}`}>
          {site.riskLevel}
        </span>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Health score</span>
          <span>{site.healthScore}/100</span>
        </div>

        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full ${healthBarClass(site.healthScore)}`}
            style={{ width: `${Math.max(0, Math.min(100, site.healthScore))}%` }}
          />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <MiniMetric icon={<Cpu className="h-4 w-4" />} label="HVACs" value={site.totalHvacs} />
        <MiniMetric icon={<Zap className="h-4 w-4" />} label="Active" value={site.activeHvacs} />
        <MiniMetric
          icon={<AlertTriangle className="h-4 w-4" />}
          label="Failed"
          value={site.failedHvacs}
          danger={site.failedHvacs > 0}
        />
        <MiniMetric
          icon={<Wrench className="h-4 w-4" />}
          label="Due repairs"
          value={site.maintenanceDue}
          danger={site.maintenanceDue > 0}
        />
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/4 p-3">
        <p className="text-xs text-slate-400">AI risk reason</p>
        <p className="mt-1 text-sm text-slate-200">{site.riskReason}</p>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <div className="text-xs text-slate-400">
          Avg temp: <span className="text-cyan-100">{formatTemp(site.averageTemperature)}</span>
        </div>

        <button
          type="button"
          onClick={onOpen}
          className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs font-medium text-cyan-100 transition hover:bg-cyan-300/20"
        >
          Open site
        </button>
      </div>
    </motion.div>
  );
}

function MiniMetric({
  icon,
  label,
  value,
  danger = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  danger?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-3 ${
        danger
          ? "border-rose-300/20 bg-rose-500/10 text-rose-100"
          : "border-white/10 bg-white/4 text-slate-200"
      }`}
    >
      <div className="flex items-center gap-2 text-xs text-slate-400">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}

function AiInsightsPanel({
  insights,
  role,
}: {
  insights: DashboardAiInsightDto[];
  role: string;
}) {
  return (
    <div className="rounded-3xl border border-cyan-300/15 bg-cyan-300/[0.07] p-5 shadow-2xl shadow-cyan-500/10 backdrop-blur-2xl">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-3 text-cyan-100">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">AI assistance</h2>
          <p className="text-sm text-slate-300">Rule-based now. OpenAI-ready later.</p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {insights.length === 0 && (
          <div className="rounded-2xl border border-emerald-300/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
            No critical AI insights at the moment. Sites appear stable for your role view.
          </div>
        )}

        {insights.map((insight) => (
          <div
            key={`${insight.title}-${insight.severity}`}
            className="rounded-2xl border border-white/10 bg-slate-950/50 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold text-white">{insight.title}</h3>
              <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] text-slate-300">
                {insight.severity}
              </span>
            </div>

            <p className="mt-2 text-sm text-slate-300">{insight.message}</p>
            <p className="mt-3 text-sm text-cyan-100">
              {role === "TECHNICIAN" ? "Technician action: " : "Recommended action: "}
              {insight.recommendedAction}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function RiskSitesPanel({ sites }: { sites: DashboardOverviewResponse["riskSites"] }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/6 p-5 shadow-2xl shadow-rose-500/10 backdrop-blur-2xl">
      <div className="mb-4 flex items-center gap-3">
        <Gauge className="h-5 w-5 text-amber-200" />
        <div>
          <h2 className="text-lg font-semibold text-white">Risk sites</h2>
          <p className="text-sm text-slate-300">Sites likely to fail or needing attention.</p>
        </div>
      </div>

      <div className="space-y-3">
        {sites.length === 0 && (
          <div className="rounded-2xl border border-emerald-300/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
            No high-risk sites found.
          </div>
        )}

        {sites.map((site) => (
          <div
            key={site.siteId}
            className="rounded-2xl border border-white/10 bg-slate-950/50 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-medium text-white">{site.siteName}</h3>
                <p className="text-xs text-slate-400">{site.tenantName}</p>
              </div>

              <span className={`rounded-full border px-3 py-1 text-xs ${riskBadgeClass(site.riskLevel)}`}>
                {site.riskLevel}
              </span>
            </div>

            <p className="mt-3 text-sm text-slate-300">{site.reason}</p>

            <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs text-slate-400">
              <div className="rounded-xl bg-white/4 p-2">
                <p className="text-rose-100">{site.failedHvacs}</p>
                <p>Failed</p>
              </div>
              <div className="rounded-xl bg-white/4 p-2">
                <p className="text-amber-100">{site.openAlerts}</p>
                <p>Alerts</p>
              </div>
              <div className="rounded-xl bg-white/4 p-2">
                <p className="text-slate-100">{site.offlineHvacs}</p>
                <p>Offline</p>
              </div>
              <div className="rounded-xl bg-white/4 p-2">
                <p className="text-cyan-100">{site.maintenanceDue}</p>
                <p>Due</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}