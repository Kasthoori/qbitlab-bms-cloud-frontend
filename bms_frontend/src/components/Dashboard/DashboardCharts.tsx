/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
  Area,
  AreaChart,
  Rectangle,
} from "recharts";
import {
  type DashboardOverviewResponse,
  type DashboardSiteCardDto,
  type DashboardTenantSummaryDto,
} from "@/api/bms";

function chartTextColor() {
  return "#cbd5e1";
}

function gridColor() {
  return "rgba(255,255,255,0.08)";
}

function riskColor(riskLevel: string) {
  if (riskLevel === "CRITICAL") return "#fb7185";
  if (riskLevel === "WARNING") return "#facc15";
  return "#34d399";
}

function shortName(name: string, max = 14) {
  if (!name) return "Unknown";
  return name.length > max ? `${name.slice(0, max)}...` : name;
}

function GlassChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/6 p-5 shadow-2xl shadow-cyan-500/10 backdrop-blur-2xl">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
      </div>

      <div className="h-72 w-full">{children}</div>
    </div>
  );
}

function EmptyChart({ message = "No chart data available" }: { message?: string }) {
  return (
    <div className="flex h-full items-center justify-center rounded-2xl border border-white/10 bg-slate-950/50 text-sm text-slate-400">
      {message}
    </div>
  );
}

export function SiteHealthBarChart({ sites }: { sites: DashboardSiteCardDto[] }) {
  const data = sites
    .slice()
    .sort((a, b) => a.healthScore - b.healthScore)
    .slice(0, 12)
    .map((site) => ({
      siteName: shortName(site.siteName),
      healthScore: site.healthScore,
      riskLevel: site.riskLevel,
    }));

  return (
    <GlassChartCard
      title="Site health comparison"
      subtitle="Lowest health score sites appear first"
    >
      {data.length === 0 ? (
        <EmptyChart />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          {/* <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor()} />
            <XAxis dataKey="siteName" stroke={chartTextColor()} fontSize={11} />
            <YAxis stroke={chartTextColor()} fontSize={11} domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                background: "rgba(15,23,42,0.95)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "16px",
                color: "#fff",
              }}
            />
            <Bar dataKey="healthScore" radius={[12, 12, 0, 0]}>
              {data.map((entry) => (
                <Cell key={entry.siteName} fill={riskColor(entry.riskLevel)} />
              ))}
            </Bar>
          </BarChart> */}
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor()} />

            <XAxis
              dataKey="siteName"
              stroke={chartTextColor()}
              fontSize={11}
            />

            <YAxis
              stroke={chartTextColor()}
              fontSize={11}
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />

            <Tooltip
              cursor={{ fill: "rgba(148, 163, 184, 0.08)" }}
              contentStyle={{
                background: "rgba(15,23,42,0.95)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "16px",
                color: "#f8fafc",
              }}
              labelStyle={{
                color: "#ffffff",
                fontWeight: 600,
              }}
              itemStyle={{
                color: "#e0f2fe",
                fontWeight: 500,
              }}

              formatter={(value) => [`${value}%`, "Health Score"]}
            />

            <Bar
              dataKey="healthScore"
              radius={[12, 12, 0, 0]}
              shape={(props: any) => {
                const entry = props.payload;

                return (
                  <Rectangle
                    {...props}
                    fill={riskColor(entry.riskLevel)}
                    radius={[12, 12, 0, 0]}
                  />
                );
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </GlassChartCard>
  );
}

export function FailedHvacsBarChart({ sites }: { sites: DashboardSiteCardDto[] }) {
  const data = sites
    .filter((site) => site.failedHvacs > 0 || site.openAlerts > 0 || site.offlineHvacs > 0)
    .sort((a, b) => b.failedHvacs - a.failedHvacs)
    .slice(0, 12)
    .map((site) => ({
      siteName: shortName(site.siteName),
      failedHvacs: site.failedHvacs,
      openAlerts: site.openAlerts,
      offlineHvacs: site.offlineHvacs,
    }));

  return (
    <GlassChartCard
      title="Failure and alert comparison"
      subtitle="Failed HVACs, open alerts, and offline machines by site"
    >
      {data.length === 0 ? (
        <EmptyChart message="No failed HVACs or open alerts found" />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor()} />
            <XAxis dataKey="siteName" stroke={chartTextColor()} fontSize={11} />
            <YAxis stroke={chartTextColor()} fontSize={11} />
            <Tooltip
              contentStyle={{
                background: "rgba(15,23,42,0.95)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "16px",
                color: "#fff",
              }}
            />
            <Legend />
            <Bar dataKey="failedHvacs" name="Failed HVACs" fill="#fb7185" radius={[8, 8, 0, 0]} />
            <Bar dataKey="openAlerts" name="Open Alerts" fill="#facc15" radius={[8, 8, 0, 0]} />
            <Bar dataKey="offlineHvacs" name="Offline" fill="#94a3b8" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </GlassChartCard>
  );
}

export function TemperatureBySiteChart({ sites }: { sites: DashboardSiteCardDto[] }) {
  const data = sites
    .filter((site) => site.averageTemperature !== null)
    .sort((a, b) => (b.averageTemperature ?? 0) - (a.averageTemperature ?? 0))
    .slice(0, 12)
    .map((site) => ({
      siteName: shortName(site.siteName),
      averageTemperature: Number(site.averageTemperature?.toFixed(1)),
      averageSetpoint:
        site.averageSetpoint === null || site.averageSetpoint === undefined
          ? null
          : Number(site.averageSetpoint.toFixed(1)),
    }));

  return (
    <GlassChartCard
      title="Temperature by site"
      subtitle="Average temperature and average setpoint"
    >
      {data.length === 0 ? (
        <EmptyChart message="No temperature data available" />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="temperatureGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="setpointGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#a78bfa" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke={gridColor()} />
            <XAxis dataKey="siteName" stroke={chartTextColor()} fontSize={11} />
            <YAxis stroke={chartTextColor()} fontSize={11} />
            <Tooltip
              contentStyle={{
                background: "rgba(15,23,42,0.95)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "16px",
                color: "#fff",
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="averageTemperature"
              name="Average Temperature"
              stroke="#22d3ee"
              fill="url(#temperatureGradient)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="averageSetpoint"
              name="Average Setpoint"
              stroke="#a78bfa"
              fill="url(#setpointGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </GlassChartCard>
  );
}

export function RiskDistributionChart({ sites }: { sites: DashboardSiteCardDto[] }) {
  const healthy = sites.filter((site) => site.riskLevel === "HEALTHY").length;
  const warning = sites.filter((site) => site.riskLevel === "WARNING").length;
  const critical = sites.filter((site) => site.riskLevel === "CRITICAL").length;

  const data = [
    { name: "Healthy", value: healthy, color: "#34d399" },
    { name: "Warning", value: warning, color: "#facc15" },
    { name: "Critical", value: critical, color: "#fb7185" },
  ].filter((item) => item.value > 0);

  return (
    <GlassChartCard
      title="Risk distribution"
      subtitle="Healthy, warning, and critical site split"
    >
      {data.length === 0 ? (
        <EmptyChart />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={58}
              outerRadius={92}
              paddingAngle={5}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>

            <Tooltip
              contentStyle={{
                background: "rgba(15,23,42,0.95)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "16px",
                color: "#fff",
              }}
            />

            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </GlassChartCard>
  );
}

export function TenantComparisonChart({
  tenants,
}: {
  tenants: DashboardTenantSummaryDto[];
}) {
  const data = tenants
    .slice()
    .sort((a, b) => b.failedHvacs - a.failedHvacs)
    .slice(0, 10)
    .map((tenant) => ({
      tenantName: shortName(tenant.tenantName),
      totalSites: tenant.totalSites,
      totalHvacs: tenant.totalHvacs,
      failedHvacs: tenant.failedHvacs,
      openAlerts: tenant.openAlerts,
    }));

  return (
    <GlassChartCard
      title="Tenant comparison"
      subtitle="Admin view across tenants"
    >
      {data.length === 0 ? (
        <EmptyChart />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor()} />
            <XAxis dataKey="tenantName" stroke={chartTextColor()} fontSize={11} />
            <YAxis stroke={chartTextColor()} fontSize={11} />
            <Tooltip
              contentStyle={{
                background: "rgba(15,23,42,0.95)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "16px",
                color: "#fff",
              }}
            />
            <Legend />
            <Bar dataKey="totalSites" name="Sites" fill="#22d3ee" radius={[8, 8, 0, 0]} />
            <Bar dataKey="totalHvacs" name="HVACs" fill="#a78bfa" radius={[8, 8, 0, 0]} />
            <Bar dataKey="failedHvacs" name="Failed" fill="#fb7185" radius={[8, 8, 0, 0]} />
            <Bar dataKey="openAlerts" name="Alerts" fill="#facc15" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </GlassChartCard>
  );
}

export function DashboardChartsSection({ data }: { data: DashboardOverviewResponse }) {
  return (
    <section className="mt-6 space-y-5">
      <div className="grid gap-5 xl:grid-cols-2">
        <SiteHealthBarChart sites={data.sites} />
        <FailedHvacsBarChart sites={data.sites} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <TemperatureBySiteChart sites={data.sites} />
        <RiskDistributionChart sites={data.sites} />
      </div>

      {data.role === "BMS_ADMIN" && (
        <div className="grid gap-5">
          <TenantComparisonChart tenants={data.tenants} />
        </div>
      )}
    </section>
  );
}