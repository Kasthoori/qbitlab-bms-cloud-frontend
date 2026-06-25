import {
  SiteHealthBarChart,
  FailedHvacsBarChart,
  TemperatureBySiteChart,
  RiskDistributionChart,
  TenantComparisonChart,
} from "../Dashboard/DashboardCharts";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragMoveEvent,
  type Modifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
//import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BellRing,
  Building2,
  CheckCircle2,
  ChevronRight,
  Cpu,
  GripVertical,
  LayoutDashboard,
  Loader2,
  Moon,
  RefreshCcw,
  Settings2,
  ShieldCheck,
  Sparkles,
  Sun,
  Wrench,
  X,
  Zap,
} from "lucide-react";

import {
  BmsApi,
  type DashboardAiInsightDto,
  type DashboardOverviewResponse,
  type DashboardRiskSiteDto,
  type DashboardRole,
  type DashboardSiteCardDto,
} from "@/api/bms";
import { BmsButton, BmsCard, BmsDashboardWidgetCard } from "@/components/UI";
import { DashboardWeatherCard } from "../Dashboard/DashboardWeatherCard";

//import DashboardNotificationIcons from "../Dashboard/DashboardNotificationIcons";

const DASHBOARD_KEY = "ROLE_BASE_DASHBOARD_V1";
const DRAWER_WIDTH_PX = 448;
const RIGHT_EDGE_OPEN_PX = 96;
const RIGHT_EDGE_OPEN_DRAG_DISTANCE_PX = 120;
const DRAWER_DROP_ZONE_PX = 72;
const DRAWER_DROP_MIN_OVERLAP_PX = 24;

type WidgetId =
  | "criticalSites"
  | "offlineHvacs"
  | "openRepairs"
  | "activeAlarms"
  | "aiRecommendation"
  | "sitePriorityList"
  | "recentActivity"
  | "energyWaste"
  | "complianceStatus"
  | "siteHealthChart"
  | "failedHvacsChart"
  | "temperatureChart"
  | "riskDistributionChart"
  | "tenantComparisonChart";

type WidgetSize = "small" | "medium" | "wide";

type WidgetLayoutItem = {
  id: WidgetId;
  enabled: boolean;
  size: WidgetSize;
  order: number;
};

type DashboardLayoutPayload = {
  widgets: WidgetLayoutItem[];
};

type DashboardPreferenceResponse = {
  dashboardKey: string;
  roleName: DashboardRole | string;
  layoutJson: string;
  defaultLayout: boolean;
};

type DashboardPreferenceApi = {
  getDashboardPreference: (
    dashboardKey: string
  ) => Promise<DashboardPreferenceResponse>;
  saveDashboardPreference: (
    dashboardKey: string,
    req: { layoutJson: string }
  ) => Promise<DashboardPreferenceResponse>;
};

type WidgetDefinition = {
  id: WidgetId;
  title: string;
  description: string;
  size: WidgetSize;
  requiredForDecision?: boolean;
};


const DASHBOARD_DRAG_MARGIN_PX = 16;

const restrictDashboardDragToViewport: Modifier = ({
  transform,
  draggingNodeRect,
}) => {
  if (!draggingNodeRect) {
    return transform;
  }

  const minX = DASHBOARD_DRAG_MARGIN_PX - draggingNodeRect.left;
  const maxX =
    window.innerWidth - DASHBOARD_DRAG_MARGIN_PX - draggingNodeRect.right;

  const minY = DASHBOARD_DRAG_MARGIN_PX - draggingNodeRect.top;
  const maxY =
    window.innerHeight - DASHBOARD_DRAG_MARGIN_PX - draggingNodeRect.bottom;

  return {
    ...transform,
    x: Math.min(Math.max(transform.x, minX), maxX),
    y: Math.min(Math.max(transform.y, minY), maxY),
  };
};

const WIDGET_DEFINITIONS: WidgetDefinition[] = [
  {
    id: "criticalSites",
    title: "Critical Sites",
    description: "Sites needing immediate attention.",
    size: "small",
    requiredForDecision: true,
  },
  {
    id: "offlineHvacs",
    title: "Offline HVACs",
    description: "HVAC units with stale or missing telemetry.",
    size: "small",
    requiredForDecision: true,
  },
  {
    id: "openRepairs",
    title: "Open Repairs",
    description: "Maintenance work currently due.",
    size: "small",
    requiredForDecision: true,
  },
  {
    id: "activeAlarms",
    title: "Active Alarms",
    description: "Open alarms and active warnings.",
    size: "small",
    requiredForDecision: true,
  },
  {
    id: "aiRecommendation",
    title: "AI Recommendation",
    description: "Most important operational recommendation.",
    size: "wide",
    requiredForDecision: true,
  },
  {
    id: "sitePriorityList",
    title: "Needs Attention First",
    description: "Prioritized site list for fast decisions.",
    size: "wide",
    requiredForDecision: true,
  },
  {
    id: "recentActivity",
    title: "Recent Activity",
    description: "Latest operational messages from dashboard data.",
    size: "wide",
  },
  {
    id: "energyWaste",
    title: "Energy Waste",
    description: "Quick operational energy-risk indicator.",
    size: "wide",
  },
  {
    id: "complianceStatus",
    title: "Compliance Status",
    description: "Maintenance and audit readiness overview.",
    size: "wide",
  },
  {
    id: "siteHealthChart",
    title: "Site Health Chart",
    description: "Visual representation of site health metrics.",
    size: "wide",
  },
  {
    id: "failedHvacsChart",
    title: "Failed HVACs Chart",
    description: "Overview of failed HVAC units.",
    size: "wide",
  },
  {
    id: "temperatureChart",
    title: "Temperature Chart",
    description: "Temperature trends across sites.",
    size: "wide",
  },
  {
    id: "riskDistributionChart",
    title: "Risk Distribution Chart",
    description: "Distribution of risks across sites.",
    size: "wide",
  },
  {
    id: "tenantComparisonChart",
    title: "Tenant Comparison Chart",
    description: "Comparison of tenant performance metrics.",
    size: "wide",
  },
];

function getDefinition(id: WidgetId): WidgetDefinition {
  return (
    WIDGET_DEFINITIONS.find((item) => item.id === id) ??
    WIDGET_DEFINITIONS[0]
  );
}

function defaultLayoutForRole(role: DashboardRole | string): WidgetLayoutItem[] {
  if (role === "SITE_MANAGER") {
    return [
      { id: "aiRecommendation", enabled: true, size: "wide", order: 1 },
      { id: "sitePriorityList", enabled: true, size: "wide", order: 2 },
      { id: "openRepairs", enabled: true, size: "small", order: 3 },
      { id: "activeAlarms", enabled: true, size: "small", order: 4 },
      { id: "offlineHvacs", enabled: true, size: "small", order: 5 },
      { id: "recentActivity", enabled: true, size: "wide", order: 6 },
      { id: "criticalSites", enabled: false, size: "small", order: 7 },
      { id: "energyWaste", enabled: false, size: "wide", order: 8 },
      { id: "complianceStatus", enabled: false, size: "wide", order: 9 },
      { id: "siteHealthChart", enabled: false, size: "wide", order: 10 },
      { id: "failedHvacsChart", enabled: false, size: "wide", order: 11 },
      { id: "temperatureChart", enabled: false, size: "wide", order: 12 },
      { id: "riskDistributionChart", enabled: false, size: "wide", order: 13 },
      { id: "tenantComparisonChart", enabled: false, size: "wide", order: 14 },
    ];
  }

  if (role === "TECHNICIAN") {
    return [
      { id: "openRepairs", enabled: true, size: "small", order: 1 },
      { id: "sitePriorityList", enabled: true, size: "wide", order: 2 },
      { id: "offlineHvacs", enabled: true, size: "small", order: 3 },
      { id: "activeAlarms", enabled: true, size: "small", order: 4 },
      { id: "recentActivity", enabled: true, size: "wide", order: 5 },
      { id: "criticalSites", enabled: false, size: "small", order: 6 },
      { id: "aiRecommendation", enabled: false, size: "wide", order: 7 },
      { id: "energyWaste", enabled: false, size: "wide", order: 8 },
      { id: "complianceStatus", enabled: false, size: "wide", order: 9 },
      { id: "siteHealthChart", enabled: false, size: "wide", order: 10 },
      { id: "failedHvacsChart", enabled: false, size: "wide", order: 11 },
      { id: "temperatureChart", enabled: false, size: "wide", order: 12 },
      { id: "riskDistributionChart", enabled: false, size: "wide", order: 13 },
      { id: "tenantComparisonChart", enabled: false, size: "wide", order: 14 },
    ];
  }

  if (role === "BMS_ADMIN") {
    return [
      { id: "openRepairs", enabled: true, size: "small", order: 1 },
      { id: "sitePriorityList", enabled: true, size: "wide", order: 2 },
      { id: "offlineHvacs", enabled: true, size: "small", order: 3 },
      { id: "activeAlarms", enabled: true, size: "small", order: 4 },
      { id: "recentActivity", enabled: true, size: "wide", order: 5 },
      { id: "criticalSites", enabled: false, size: "small", order: 6 },
      { id: "aiRecommendation", enabled: false, size: "wide", order: 7 },
      { id: "energyWaste", enabled: false, size: "wide", order: 8 },
      { id: "complianceStatus", enabled: false, size: "wide", order: 9 },
      { id: "siteHealthChart", enabled: false, size: "wide", order: 10 },
      { id: "failedHvacsChart", enabled: false, size: "wide", order: 11 },
      { id: "temperatureChart", enabled: false, size: "wide", order: 12 },
      { id: "riskDistributionChart", enabled: false, size: "wide", order: 13 },
      { id: "tenantComparisonChart", enabled: false, size: "wide", order: 14 },
    ];
  }

  return [
    { id: "criticalSites", enabled: true, size: "small", order: 1 },
    { id: "offlineHvacs", enabled: true, size: "small", order: 2 },
    { id: "openRepairs", enabled: true, size: "small", order: 3 },
    { id: "activeAlarms", enabled: true, size: "small", order: 4 },
    { id: "aiRecommendation", enabled: true, size: "wide", order: 5 },
    { id: "sitePriorityList", enabled: true, size: "wide", order: 6 },
    { id: "energyWaste", enabled: true, size: "wide", order: 7 },
    { id: "complianceStatus", enabled: true, size: "wide", order: 8 },
    { id: "recentActivity", enabled: false, size: "wide", order: 9 },
    { id: "siteHealthChart", enabled: false, size: "wide", order: 10 },
    { id: "failedHvacsChart", enabled: false, size: "wide", order: 11 },
    { id: "temperatureChart", enabled: false, size: "wide", order: 12 },
    { id: "riskDistributionChart", enabled: false, size: "wide", order: 13 },
    { id: "tenantComparisonChart", enabled: false, size: "wide", order: 14 },
  ];
}

function normalizeLayout(
  rawLayout: WidgetLayoutItem[],
  role: DashboardRole | string
): WidgetLayoutItem[] {
  const fallback = defaultLayoutForRole(role);
  const knownIds = new Set(WIDGET_DEFINITIONS.map((item) => item.id));
  const fallbackById = new Map(fallback.map((item) => [item.id, item]));

  const cleaned = rawLayout
    .filter((item) => knownIds.has(item.id))
    .map((item) => ({
      id: item.id,
      enabled: Boolean(item.enabled),
      //size: item.size ?? fallbackById.get(item.id)?.size ?? "small",
      size: getDefinition(item.id).size ?? fallbackById.get(item.id)?.size ?? item.size ?? "small",
      order: Number.isFinite(item.order) ? item.order : 999,
    }));

  const existingIds = new Set(cleaned.map((item) => item.id));

  for (const fallbackItem of fallback) {
    if (!existingIds.has(fallbackItem.id)) {
      cleaned.push(fallbackItem);
    }
  }

  return cleaned
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((item, index) => ({
      ...item,
      order: index + 1,
    }));
}

function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat().format(value);
}

function formatTemp(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${value.toFixed(1)}°C`;
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";

  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function roleTitle(role: DashboardRole | string): string {
  if (role === "BMS_ADMIN") return "BMS Command Center";
  if (role === "SITE_MANAGER") return "Site Operations";
  if (role === "TECHNICIAN") return "Technician Actions";
  return "Operations Dashboard";
}

function displayOperatorName(data: DashboardOverviewResponse): string {
  if (data.role === "BMS_ADMIN") return "Admin";
  if (data.role === "SITE_MANAGER") return "Site Manager";
  if (data.role === "TECHNICIAN") return "Technician";

  return "Operator";
}

function getTimeTheme() {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

function greetingForTheme(theme: string) {
  if (theme === "morning") return "Good morning";
  if (theme === "afternoon") return "Good afternoon";
  if (theme === "evening") return "Good evening";
  return "Good night";
}

function TimeThemeIcon({ theme }: { theme: string }) {
  if (theme === "night") return <Moon className="h-4 w-4" />;
  return <Sun className="h-4 w-4" />;
}

function timeThemeClass(theme: string) {
  if (theme === "morning") {
    return "bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.22),transparent_34%),radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.16),transparent_32%),linear-gradient(135deg,#06111f,#0f172a)]";
  }

  if (theme === "afternoon") {
    return "bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_34%),radial-gradient(circle_at_80%_20%,rgba(139,92,246,0.18),transparent_32%),linear-gradient(135deg,#08111f,#111827)]";
  }

  if (theme === "evening") {
    return "bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.20),transparent_34%),radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.16),transparent_32%),linear-gradient(135deg,#0b1020,#17122b)]";
  }

  return "bg-[radial-gradient(circle_at_top_left,rgba(79,70,229,0.16),transparent_34%),radial-gradient(circle_at_80%_20%,rgba(8,145,178,0.12),transparent_32%),linear-gradient(135deg,#020617,#0b1120)]";
}

function riskBadgeClass(riskLevel: string) {
  if (riskLevel === "CRITICAL") {
    return "border-rose-300/45 bg-rose-500/15 text-rose-100";
  }

  if (riskLevel === "WARNING") {
    return "border-amber-300/45 bg-amber-500/15 text-amber-100";
  }

  return "border-emerald-300/40 bg-emerald-500/15 text-emerald-100";
}

function healthBarClass(score: number) {
  if (score < 50) return "bg-rose-400";
  if (score < 75) return "bg-amber-300";
  return "bg-emerald-300";
}

function widgetGridClass(size: WidgetSize) {
  if (size === "wide") return "lg:col-span-2 xl:col-span-3";
  if (size === "medium") return "lg:col-span-1 xl:col-span-1";
  return "lg:col-span-1 xl:col-span-1";
}

function getBestAiInsight(
  insights: DashboardAiInsightDto[]
): DashboardAiInsightDto | null {
  if (insights.length === 0) return null;

  const severityRank: Record<string, number> = {
    CRITICAL: 3,
    WARNING: 2,
    INFO: 1,
  };

  return insights
    .slice()
    .sort(
      (a, b) =>
        (severityRank[b.severity] ?? 0) - (severityRank[a.severity] ?? 0)
    )[0];
}

function getPrioritySites(data: DashboardOverviewResponse): DashboardSiteCardDto[] {
  return (data.sites ?? [])
    .slice()
    .sort((a, b) => {
      const riskRank: Record<string, number> = {
        CRITICAL: 3,
        WARNING: 2,
        HEALTHY: 1,
      };

      const riskDiff =
        (riskRank[b.riskLevel] ?? 0) - (riskRank[a.riskLevel] ?? 0);

      if (riskDiff !== 0) return riskDiff;

      return a.healthScore - b.healthScore;
    })
    .slice(0, 6);
}

function getCriticalRiskSites(
  data: DashboardOverviewResponse
): DashboardRiskSiteDto[] {
  return (data.riskSites ?? [])
    .filter((site) => site.riskLevel === "CRITICAL")
    .slice(0, 6);
}

function buildLayoutPayload(layout: WidgetLayoutItem[]): DashboardLayoutPayload {
  return {
    widgets: layout.map((item, index) => ({
      ...item,
      order: index + 1,
    })),
  };
}

function isWidgetId(value: unknown): value is WidgetId {
  return (
    typeof value === "string" &&
    WIDGET_DEFINITIONS.some((definition) => definition.id === value)
  );
}

function isReleasedAtDrawerDropZone(event: DragEndEvent): boolean {
  const translatedRect = event.active.rect.current.translated;

  if (!translatedRect) {
    return false;
  }

  const drawerLeftBoundary = window.innerWidth - DRAWER_WIDTH_PX;
  const drawerDropBoundary = drawerLeftBoundary + DRAWER_DROP_MIN_OVERLAP_PX;

  /*
   * Dashboard widgets only need to overlap the drawer edge.
   * They should not be dragged deep into the drawer/right side.
   */
  return translatedRect.right >= drawerDropBoundary;
}

function DashboardLoading() {
  return (
    <div className="min-h-screen bg-slate-950 px-5 py-8 text-slate-100">
      <div className="flex min-h-[65vh] items-center justify-center">
        <BmsCard variant="section" className="p-8 text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-cyan-200" />
          <p className="mt-4 text-sm text-slate-300">
            Loading production dashboard...
          </p>
        </BmsCard>
      </div>
    </div>
  );
}

function DashboardError({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-slate-950 px-5 py-8 text-slate-100">
      <BmsCard
        variant="section"
        className="mx-auto max-w-3xl border-rose-300/30 bg-rose-500/10 p-6 text-rose-100 shadow-2xl shadow-rose-500/10"
      >
        <h2 className="text-lg font-semibold">Dashboard unavailable</h2>
        <p className="mt-2 text-sm text-rose-100/80">{message}</p>
      </BmsCard>
    </div>
  );
}

function DashboardHeader({
  data,
  theme,
  saving,
  onCustomize,
  onReset,
}: {
  data: DashboardOverviewResponse;
  theme: string;
  saving: boolean;
  onCustomize: () => void;
  onReset: () => void;
}) {
  const criticalCount =
    data.kpis.highRiskSites ??
    (data.riskSites ?? []).filter((site) => site.riskLevel === "CRITICAL")
      .length;

  return (
    <BmsCard variant="section" className="relative z-9000 p-5 md:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.28em] text-cyan-100/75">
            <LayoutDashboard className="h-4 w-4" />
            <span>{roleTitle(data.role)}</span>
          </div>

          <h1 className="mt-3 text-2xl font-bold text-white md:text-4xl">
            {greetingForTheme(theme)}, {displayOperatorName(data)}
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300 md:text-base">
            {criticalCount > 0
                ? `${formatNumber(
                    criticalCount
                    )} site(s) need attention today. Start with the priority list and check offline HVACs first.`
                : "All assigned sites look stable. Continue monitoring alarms, repairs, and telemetry."}
          </p>

          <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
              <TimeThemeIcon theme={theme} />
              Time-aware glass theme: {theme}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
              Generated: {formatDateTime(data.generatedAt)}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* <DashboardNotificationIcons /> */}

          <BmsButton type="button" variant="primary" onClick={onCustomize}>
            <Settings2 className="h-4 w-4" />
            Customize
          </BmsButton>

          <BmsButton type="button" variant="secondary" onClick={onReset}>
            <RefreshCcw className="h-4 w-4" />
            Reset
          </BmsButton>

          <div className="min-w-[88px] text-xs text-slate-400">
            {saving ? "Saving..." : "Saved"}
          </div>
        </div>
      </div>
    </BmsCard>
  );
}

function SummaryStrip({ data }: { data: DashboardOverviewResponse }) {
  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <MiniStatusCard
        label="Critical Sites"
        value={formatNumber(data.kpis.highRiskSites)}
        tone={data.kpis.highRiskSites > 0 ? "critical" : "healthy"}
        icon={<Building2 className="h-5 w-5" />}
      />

      <MiniStatusCard
        label="Offline HVACs"
        value={formatNumber(data.kpis.offlineHvacs)}
        tone={data.kpis.offlineHvacs > 0 ? "warning" : "healthy"}
        icon={<Cpu className="h-5 w-5" />}
      />

      <MiniStatusCard
        label="Open Repairs"
        value={formatNumber(data.kpis.maintenanceDue)}
        tone={data.kpis.maintenanceDue > 0 ? "warning" : "healthy"}
        icon={<Wrench className="h-5 w-5" />}
      />

      <MiniStatusCard
        label="Active Alarms"
        value={formatNumber(data.kpis.openAlerts)}
        tone={data.kpis.openAlerts > 0 ? "critical" : "healthy"}
        icon={<BellRing className="h-5 w-5" />}
      />
    </section>
  );
}

function MiniStatusCard({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: string;
  tone: "critical" | "warning" | "healthy";
  icon: ReactNode;
}) {
  const toneClass =
    tone === "critical"
      ? "border-rose-300/35 bg-rose-500/12 text-rose-50"
      : tone === "warning"
      ? "border-amber-300/35 bg-amber-500/12 text-amber-50"
      : "border-emerald-300/30 bg-emerald-500/10 text-emerald-50";

  return (
    <div
      className={`rounded-3xl border p-4 shadow-2xl backdrop-blur-2xl ${toneClass}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] opacity-75">
            {label}
          </p>
          <p className="mt-2 text-3xl font-bold">{value}</p>
        </div>
        <div className="rounded-2xl border border-white/15 bg-white/10 p-3">
          {icon}
        </div>
      </div>
    </div>
  );
}

function SortableWidgetShell({
  item,
  title,
  children,
  onHide,
}: {
  item: WidgetLayoutItem;
  title: string;
  children: ReactNode;
  onHide: (id: WidgetId) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <section
      ref={setNodeRef}
      style={style}
      className={`${widgetGridClass(item.size)} ${
        isDragging ? "z-30 scale-[1.01] opacity-90" : ""
      }`}
    >
      <BmsDashboardWidgetCard
        title={title}
        size={item.size}
        dragLabel={`Drag ${title}`}
        hideLabel={`Hide ${title}`}
        dragAttributes={attributes}
        dragListeners={listeners}
        onHide={() => onHide(item.id)}
        className={isDragging ? "border-cyan-300/40 shadow-cyan-500/20" : ""}
      >
         {children}
      </BmsDashboardWidgetCard>
    </section>
  );
}

function DecisionMetricWidget({
  label,
  value,
  hint,
  icon,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  icon: ReactNode;
  tone: "critical" | "warning" | "healthy" | "info";
}) {
  const toneClass =
    tone === "critical"
      ? "border-rose-300/40 bg-rose-500/[0.13] shadow-[0_20px_60px_rgba(244,63,94,0.16)]"
      : tone === "warning"
      ? "border-amber-300/40 bg-amber-500/[0.13] shadow-[0_20px_60px_rgba(245,158,11,0.13)]"
      : tone === "healthy"
      ? "border-emerald-300/35 bg-emerald-500/[0.11] shadow-[0_20px_60px_rgba(16,185,129,0.10)]"
      : "border-cyan-200/25 bg-cyan-500/[0.09] shadow-[0_20px_60px_rgba(6,182,212,0.10)]";

  return (
    <div className={`rounded-3xl border p-5 ${toneClass}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-200/70">
            {label}
          </p>
          <p className="mt-3 text-4xl font-bold text-white">{value}</p>
        </div>

        <div className="rounded-2xl border border-white/15 bg-white/10 p-3 text-white">
          {icon}
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-200/80">{hint}</p>
    </div>
  );
}

function AiRecommendationWidget({
  data,
}: {
  data: DashboardOverviewResponse;
}) {
  const insight = getBestAiInsight(data.aiInsights ?? []);

  if (!insight) {
    return (
      <div className="rounded-3xl border border-emerald-300/25 bg-emerald-500/10 p-5">
        <div className="flex items-center gap-3">
          <Sparkles className="h-6 w-6 text-emerald-100" />
          <div>
            <h3 className="text-lg font-semibold text-white">
              No urgent AI recommendation
            </h3>
            <p className="mt-1 text-sm text-emerald-50/75">
              No critical dashboard insight was generated for this view.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const severityClass =
    insight.severity === "CRITICAL"
      ? "border-rose-300/40 bg-rose-500/12 text-rose-50"
      : insight.severity === "WARNING"
      ? "border-amber-300/40 bg-amber-500/12 text-amber-50"
      : "border-cyan-300/35 bg-cyan-500/10 text-cyan-50";

  return (
    <div className={`rounded-3xl border p-5 ${severityClass}`}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex gap-3">
          <div className="rounded-2xl border border-white/15 bg-white/10 p-3">
            <Sparkles className="h-6 w-6" />
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.25em] opacity-75">
              AI decision support
            </p>
            <h3 className="mt-2 text-xl font-bold text-white">
              {insight.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-100/85">
              {insight.message}
            </p>
          </div>
        </div>

        <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold">
          {insight.severity}
        </span>
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/30 p-4">
        <p className="text-xs uppercase tracking-[0.22em] text-slate-300/80">
          Recommended action
        </p>
        <p className="mt-2 text-sm leading-6 text-white">
          {insight.recommendedAction}
        </p>
      </div>
    </div>
  );
}

function SitePriorityListWidget({
  data,
}: {
  data: DashboardOverviewResponse;
}) {
  const navigate = useNavigate();
  const sites = getPrioritySites(data);

  if (sites.length === 0) {
    return (
      <EmptyState
        icon={<CheckCircle2 className="h-6 w-6" />}
        title="No sites found"
        message="No site data is currently available for this role."
      />
    );
  }

  return (
    <div className="space-y-3">
      {sites.map((site, index) => (
        <div
          key={site.siteId}
          className="rounded-3xl border border-white/12 bg-slate-950/35 p-4"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/8 text-xs font-bold text-white">
                  {index + 1}
                </span>
                <h3 className="text-base font-semibold text-white">
                  {site.siteName}
                </h3>
                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-bold ${riskBadgeClass(
                    site.riskLevel
                  )}`}
                >
                  {site.riskLevel}
                </span>
              </div>

              <p className="mt-2 text-sm text-slate-400">{site.tenantName}</p>
              <p className="mt-2 text-sm leading-6 text-slate-200">
                {site.riskReason || "Review site health and recent telemetry."}
              </p>

              <div className="mt-3 grid gap-2 text-xs text-slate-300 sm:grid-cols-4">
                <span>HVACs: {formatNumber(site.totalHvacs)}</span>
                <span>Failed: {formatNumber(site.failedHvacs)}</span>
                <span>Offline: {formatNumber(site.offlineHvacs)}</span>
                <span>Repairs: {formatNumber(site.maintenanceDue)}</span>
              </div>
            </div>

            <BmsButton
              type="button"
              variant="primary"
              onClick={() =>
                navigate(
                  `/user/tenants/${site.tenantId}/sites/${site.siteId}/hvacs`,
                  {
                    state: {
                      tenantName: site.tenantName,
                      siteName: site.siteName,
                    },
                  }
                )
              }
              className="shrink-0 justify-center"
            >
              Open site
              <ChevronRight className="h-4 w-4" />
            </BmsButton>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full ${healthBarClass(
                site.healthScore
              )}`}
              style={{
                width: `${Math.max(0, Math.min(site.healthScore, 100))}%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function RecentActivityWidget({
  data,
}: {
  data: DashboardOverviewResponse;
}) {
  const items = [
    ...(data.aiInsights ?? []).slice(0, 3).map((item) => ({
      title: item.title,
      message: item.message,
      severity: item.severity,
    })),
    ...(data.riskSites ?? []).slice(0, 3).map((item) => ({
      title: item.siteName,
      message: item.reason,
      severity: item.riskLevel,
    })),
  ].slice(0, 5);

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Activity className="h-6 w-6" />}
        title="No recent activity"
        message="No recent dashboard activity is available."
      />
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div
          key={`${item.title}-${index}`}
          className="rounded-2xl border border-white/10 bg-slate-950/35 p-3"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-white">{item.title}</p>
            <span
              className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${riskBadgeClass(
                item.severity
              )}`}
            >
              {item.severity}
            </span>
          </div>
          <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-300">
            {item.message}
          </p>
        </div>
      ))}
    </div>
  );
}

function EnergyWasteWidget({ data }: { data: DashboardOverviewResponse }) {
  const failed = data.kpis.failedHvacs ?? 0;
  const offline = data.kpis.offlineHvacs ?? 0;
  const active = data.kpis.activeHvacs ?? 0;
  const total = data.kpis.totalHvacs ?? 0;

  const riskScore =
    total <= 0
      ? 0
      : Math.min(100, Math.round(((failed + offline) / total) * 100));

  const tone =
    riskScore >= 40 ? "critical" : riskScore >= 15 ? "warning" : "healthy";

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/30 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-300">
            Energy risk
          </p>
          <p className="mt-3 text-4xl font-bold text-white">{riskScore}%</p>
        </div>
        <Zap className="h-7 w-7 text-amber-200" />
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-300">
        Estimated operational waste risk based on failed/offline HVAC ratio.
        Connect detailed energy telemetry widgets when meter trends are ready.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <MetricPill label="Active HVACs" value={formatNumber(active)} />
        <MetricPill label="Total HVACs" value={formatNumber(total)} />
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className={
            tone === "critical"
              ? "h-full rounded-full bg-rose-400"
              : tone === "warning"
              ? "h-full rounded-full bg-amber-300"
              : "h-full rounded-full bg-emerald-300"
          }
          style={{ width: `${riskScore}%` }}
        />
      </div>
    </div>
  );
}

function ComplianceStatusWidget({
  data,
}: {
  data: DashboardOverviewResponse;
}) {
  const maintenanceDue = data.kpis.maintenanceDue ?? 0;
  const openAlerts = data.kpis.openAlerts ?? 0;
  const failedHvacs = data.kpis.failedHvacs ?? 0;

  const status =
    maintenanceDue + openAlerts + failedHvacs > 0
      ? "Action required"
      : "Ready";

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/30 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-300">
            Compliance readiness
          </p>
          <p className="mt-3 text-2xl font-bold text-white">{status}</p>
        </div>
        <ShieldCheck className="h-7 w-7 text-violet-200" />
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-300">
        Maintenance, alarms, and failed equipment should be reviewed before
        generating compliance evidence.
      </p>

      <div className="mt-4 grid gap-3 text-sm">
        <MetricPill label="Open repairs" value={formatNumber(maintenanceDue)} />
        <MetricPill label="Active alarms" value={formatNumber(openAlerts)} />
        <MetricPill label="Failed HVACs" value={formatNumber(failedHvacs)} />
      </div>
    </div>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  message,
}: {
  icon: ReactNode;
  title: string;
  message: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/30 p-5 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-200">
        {icon}
      </div>
      <h3 className="mt-4 text-base font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">{message}</p>
    </div>
  );
}

function SortableDrawerWidgetRow({
  definition,
  item,
  onToggle,
}: {
  definition: WidgetDefinition;
  item: WidgetLayoutItem;
  onToggle: (id: WidgetId) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const enabled = item.enabled;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-3xl border border-white/10 bg-white/5 p-4 transition ${
        isDragging ? "z-50 scale-[1.01] border-cyan-200/40 bg-cyan-500/10" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          aria-label={`Drag ${definition.title}`}
          className="mt-1 cursor-grab rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold text-white">{definition.title}</h3>

              <p className="mt-1 text-sm leading-6 text-slate-400">
                {definition.description}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300">
                  Size: {item.size}
                </span>

                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300">
                  Order: {item.order}
                </span>

                {definition.requiredForDecision && (
                  <span className="rounded-full border border-cyan-200/20 bg-cyan-500/10 px-2.5 py-1 text-xs font-semibold text-cyan-100">
                    Decision widget
                  </span>
                )}
              </div>
            </div>

            <BmsButton
              type="button"
              variant={enabled ? "success" : "ghost"}
              size="sm"
              onClick={() => onToggle(definition.id)}
              className="shrink-0 rounded-full px-3 py-1.5 text-xs"
            >
              {enabled ? "Shown" : "Hidden"}
            </BmsButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function WidgetPickerDrawer({
  open,
  layout,
  sensors,
  onClose,
  onToggle,
  onReorder,
  onEnableFromDrawer,
}: {
  open: boolean;
  layout: WidgetLayoutItem[];
  sensors: ReturnType<typeof useSensors>;
  onClose: () => void;
  onToggle: (id: WidgetId) => void;
  onReorder: (activeId: WidgetId, overId: WidgetId) => void;
  onEnableFromDrawer: (id: WidgetId) => void;
}) {
  const [exitArmed, setExitArmed] = useState(false);

//   useEffect(() => {
//     if (!open) {
//       setExitArmed(false);
//     }
//   }, [open]);

  if (!open) return null;

  const sortedLayout = layout.slice().sort((a, b) => a.order - b.order);
  const sortedIds = sortedLayout.map((item) => item.id);

  const definitionById = new Map(
    WIDGET_DEFINITIONS.map((definition) => [definition.id, definition])
  );

  function handleDrawerDragMove(event: DragMoveEvent) {
    const translatedRect = event.active.rect.current.translated;

    if (!translatedRect) return;

    const drawerLeftBoundary = window.innerWidth - DRAWER_WIDTH_PX;
    const draggedOutOfDrawer = translatedRect.left < drawerLeftBoundary - 40;

    setExitArmed(draggedOutOfDrawer);
  }

  function handleDrawerDragEnd(event: DragEndEvent) {
  const { active, over } = event;

  if (!isWidgetId(active.id)) {
    return;
  }

  /*
   * Production behavior:
   * If user drags a widget out of the drawer, show it back on dashboard.
   */
  if (exitArmed) {
    setExitArmed(false);
    onEnableFromDrawer(active.id);
    onClose();
    return;
  }

  if (!over || active.id === over.id) return;

  onReorder(active.id, over.id as WidgetId);
}

 return (
  <div className="fixed inset-0 z-9999">
    <BmsButton
      type="button"
      variant="ghost"
      aria-label="Close customize dashboard"
      className="absolute inset-0 h-full w-full rounded-none border-0 bg-slate-950/70 p-0 backdrop-blur-sm hover:bg-slate-950/70"
      onClick={onClose}
    >
      <span className="sr-only">Close customize dashboard</span>
    </BmsButton>

    <aside className="absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto border-l border-white/10 bg-slate-950/95 px-5 pb-5 text-slate-100 shadow-2xl shadow-black/40">
      {/* Real spacer to push drawer heading below the app topbar */}
      <div style={{ height: 40 }} />

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-200/75">
            Customize
          </p>

          <h2 className="mt-2 text-2xl font-bold text-white">
            Dashboard widgets
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            Drag widgets to change order. Drag hidden widgets out of this drawer
            to show them on the dashboard.
          </p>
        </div>

        <BmsButton
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="shrink-0 rounded-2xl p-2"
          aria-label="Close drawer"
        >
          <X className="h-5 w-5" />
        </BmsButton>
      </div>

      {exitArmed && (
        <div className="mt-4 rounded-2xl border border-amber-300/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Release outside the drawer to close customize panel.
        </div>
      )}

      <div className="mt-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictDashboardDragToViewport]}
          onDragMove={handleDrawerDragMove}
          onDragEnd={handleDrawerDragEnd}
        >
          <SortableContext
            items={sortedIds}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {sortedLayout.map((item) => {
                const definition = definitionById.get(item.id);

                if (!definition) return null;

                return (
                  <SortableDrawerWidgetRow
                    key={item.id}
                    definition={definition}
                    item={item}
                    onToggle={onToggle}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </aside>
  </div>
);
}

export default function RoleBasedDashboardPage() {
  const navigate = useNavigate();

  const [data, setData] = useState<DashboardOverviewResponse | null>(null);
  const [layout, setLayout] = useState<WidgetLayoutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customizeOpen, setCustomizeOpen] = useState(false);

  const drawerOpenedByDragRef = useRef(false);

  const theme = useMemo(() => getTimeTheme(), []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const dashboardDragModifier = useMemo<Modifier>(() => {
    return ({ transform, draggingNodeRect }) => {
      if (!draggingNodeRect) {
        return transform;
      }

      const leftBoundary = DASHBOARD_DRAG_MARGIN_PX;
      const drawerLeftBoundary = window.innerWidth - DRAWER_WIDTH_PX;

      /*
       * When the drawer is open, stop the active dashboard widget near
       * the drawer edge. It only needs to enter a small drop zone.
       */
      const rightBoundary = customizeOpen
        ? drawerLeftBoundary + DRAWER_DROP_ZONE_PX
        : window.innerWidth - DASHBOARD_DRAG_MARGIN_PX;

      const minX = leftBoundary - draggingNodeRect.left;
      const rawMaxX = rightBoundary - draggingNodeRect.right;
      const maxX = Math.max(minX, rawMaxX);

      const minY = DASHBOARD_DRAG_MARGIN_PX - draggingNodeRect.top;
      const rawMaxY =
        window.innerHeight - DASHBOARD_DRAG_MARGIN_PX - draggingNodeRect.bottom;
      const maxY = Math.max(minY, rawMaxY);

      return {
        ...transform,
        x: Math.min(Math.max(transform.x, minX), maxX),
        y: Math.min(Math.max(transform.y, minY), maxY),
      };
    };
  }, [customizeOpen]);

  const enabledLayout = useMemo(
    () =>
      layout
        .filter((item) => item.enabled)
        .slice()
        .sort((a, b) => a.order - b.order),
    [layout]
  );

  const enabledIds = useMemo(
    () => enabledLayout.map((item) => item.id),
    [enabledLayout]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError(null);

        const [overviewResponse, preferenceResponse] = await Promise.all([
          BmsApi.getDashboardOverview(),
          (BmsApi as unknown as DashboardPreferenceApi).getDashboardPreference(
            DASHBOARD_KEY
          ),
        ]);

        if (cancelled) return;

        const preferenceLayout = JSON.parse(
          preferenceResponse.layoutJson
        ) as DashboardLayoutPayload;

        setData(overviewResponse);
        setLayout(
          normalizeLayout(preferenceLayout.widgets ?? [], overviewResponse.role)
        );
      } catch (loadError) {
        console.error("Failed to load role-based dashboard:", loadError);

        if (!cancelled) {
          setError(
            "Cannot load dashboard. Please check backend dashboard preference API, overview API, and role permissions."
          );
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

  async function saveLayout(nextLayout: WidgetLayoutItem[]) {
    const normalized = nextLayout.map((item, index) => ({
      ...item,
      order: index + 1,
    }));

    setLayout(normalized);
    setSaving(true);

    try {
      await (BmsApi as unknown as DashboardPreferenceApi).saveDashboardPreference(
        DASHBOARD_KEY,
        {
          layoutJson: JSON.stringify(buildLayoutPayload(normalized)),
        }
      );
    } catch (saveError) {
      console.error("Failed to save dashboard layout:", saveError);
      setError("Dashboard layout could not be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleDashboardDragMove(event: DragMoveEvent) {
    const translatedRect = event.active.rect.current.translated;

    if (!translatedRect) return;

    const draggedRightEnough =
      event.delta.x >= RIGHT_EDGE_OPEN_DRAG_DISTANCE_PX;

    const nearRightEdge =
      translatedRect.right >= window.innerWidth - RIGHT_EDGE_OPEN_PX;

    /*
     * Open the drawer only once during the active drag.
     * After it opens, dashboardDragModifier clamps the widget near the edge.
     */
    if (
      nearRightEdge &&
      draggedRightEnough &&
      !customizeOpen &&
      !drawerOpenedByDragRef.current
    ) {
      drawerOpenedByDragRef.current = true;
      setCustomizeOpen(true);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    drawerOpenedByDragRef.current = false;

    const { active, over } = event;

    if (
      customizeOpen &&
      isWidgetId(active.id) &&
      isReleasedAtDrawerDropZone(event)
    ) {
      const nextLayout = layout.map((item) =>
        item.id === active.id ? { ...item, enabled: false } : item
      );

      void saveLayout(nextLayout);
      setCustomizeOpen(false);
      return;
    }

    if (!over || active.id === over.id) return;

    const oldIndex = enabledLayout.findIndex((item) => item.id === active.id);
    const newIndex = enabledLayout.findIndex((item) => item.id === over.id);

    if (oldIndex < 0 || newIndex < 0) return;

    const reorderedEnabled = arrayMove(enabledLayout, oldIndex, newIndex);
    const disabledItems = layout.filter((item) => !item.enabled);

    saveLayout([...reorderedEnabled, ...disabledItems]);
  }

  function handleToggleWidget(id: WidgetId) {
    const nextLayout = layout.map((item) =>
      item.id === id ? { ...item, enabled: !item.enabled } : item
    );

    saveLayout(nextLayout);
  }

  function handleHideWidget(id: WidgetId) {
    const nextLayout = layout.map((item) =>
      item.id === id ? { ...item, enabled: false } : item
    );

    saveLayout(nextLayout);
  }

  function handleEnableFromDrawer(id: WidgetId) {
    const sortedLayout = layout.slice().sort((a, b) => a.order - b.order);

    const nextLayout = sortedLayout.map((item) =>
      item.id === id ? { ...item, enabled: true } : item
    );

    saveLayout(nextLayout);
  }

  function handleDrawerReorder(activeId: WidgetId, overId: WidgetId) {
    const sortedLayout = layout.slice().sort((a, b) => a.order - b.order);

    const oldIndex = sortedLayout.findIndex((item) => item.id === activeId);
    const newIndex = sortedLayout.findIndex((item) => item.id === overId);

    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(sortedLayout, oldIndex, newIndex).map(
      (item, index) => ({
        ...item,
        order: index + 1,
      })
    );

    saveLayout(reordered);
  }

  function handleResetLayout() {
    if (!data) return;

    const resetLayout = defaultLayoutForRole(data.role);
    saveLayout(resetLayout);
  }

  function renderWidget(item: WidgetLayoutItem) {
    if (!data) return null;

    if (item.id === "criticalSites") {
      const criticalSites = getCriticalRiskSites(data);

      return (
        <DecisionMetricWidget
          label="Critical Sites"
          value={formatNumber(data.kpis.highRiskSites)}
          hint={
            criticalSites.length > 0
              ? `${criticalSites[0].siteName}: ${criticalSites[0].reason}`
              : "No critical site detected right now."
          }
          icon={<Building2 className="h-6 w-6" />}
          tone={data.kpis.highRiskSites > 0 ? "critical" : "healthy"}
        />
      );
    }

    if (item.id === "offlineHvacs") {
      return (
        <DecisionMetricWidget
          label="Offline HVACs"
          value={formatNumber(data.kpis.offlineHvacs)}
          hint="Check stale telemetry, edge controller connection, and mapped device health."
          icon={<Cpu className="h-6 w-6" />}
          tone={data.kpis.offlineHvacs > 0 ? "warning" : "healthy"}
        />
      );
    }

    if (item.id === "openRepairs") {
      return (
        <DecisionMetricWidget
          label="Open Repairs"
          value={formatNumber(data.kpis.maintenanceDue)}
          hint="Maintenance items requiring technician or manager action."
          icon={<Wrench className="h-6 w-6" />}
          tone={data.kpis.maintenanceDue > 0 ? "warning" : "healthy"}
        />
      );
    }

    if (item.id === "activeAlarms") {
      return (
        <DecisionMetricWidget
          label="Active Alarms"
          value={formatNumber(data.kpis.openAlerts)}
          hint="Open alarms should be reviewed before normal monitoring work."
          icon={<AlertTriangle className="h-6 w-6" />}
          tone={data.kpis.openAlerts > 0 ? "critical" : "healthy"}
        />
      );
    }

    if (item.id === "aiRecommendation") {
      return <AiRecommendationWidget data={data} />;
    }

    if (item.id === "sitePriorityList") {
      return <SitePriorityListWidget data={data} />;
    }

    if (item.id === "recentActivity") {
      return <RecentActivityWidget data={data} />;
    }

    if (item.id === "energyWaste") {
      return <EnergyWasteWidget data={data} />;
    }

        if (item.id === "complianceStatus") {
      return <ComplianceStatusWidget data={data} />;
    }

    if (item.id === "siteHealthChart") {
      return <SiteHealthBarChart sites={data.sites ?? []} />;
    }

    if (item.id === "failedHvacsChart") {
      return <FailedHvacsBarChart sites={data.sites ?? []} />;
    }

    if (item.id === "temperatureChart") {
      return <TemperatureBySiteChart sites={data.sites ?? []} />;
    }

    if (item.id === "riskDistributionChart") {
      return <RiskDistributionChart sites={data.sites ?? []} />;
    }

    if (item.id === "tenantComparisonChart") {
      if (data.role !== "BMS_ADMIN") {
        return (
          <EmptyState
            icon={<BarChart3 className="h-6 w-6" />}
            title="Admin chart"
            message="Tenant comparison is available only for BMS Admin users."
          />
        );
      }

      return <TenantComparisonChart tenants={data.tenants ?? []} />;
    }

    return null;
  }

  if (loading) {
    return <DashboardLoading />;
  }

  if (error || !data) {
    return <DashboardError message={error ?? "Dashboard data is unavailable."} />;
  }

  return (
    <div
      className={`min-h-screen overflow-x-hidden text-slate-100 ${timeThemeClass(
        theme
      )}`}
    >
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-8%] top-[-8%] h-96 w-96 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="absolute right-[-10%] top-[18%] h-112 w-md rounded-full bg-violet-500/16 blur-3xl" />
        <div className="absolute bottom-[-12%] left-[28%] h-120 w-120 rounded-full bg-emerald-500/8 blur-3xl" />
      </div>

      <main className="relative z-10 mx-auto max-w-450 px-5 py-6 pb-12 md:px-8 lg:px-10">
        <DashboardHeader
          data={data}
          theme={theme}
          saving={saving}
          onCustomize={() => {
            drawerOpenedByDragRef.current = false;
            setCustomizeOpen(true);
          }}
          onReset={handleResetLayout}
        />

        <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_320px]">
          <SummaryStrip data={data} />

          <DashboardWeatherCard
            latitude={-36.8485}
            longitude={174.7633}
            locationLabel="Auckland outdoor"
          />
        </div>
        <div className="mt-6 grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[dashboardDragModifier]}
            onDragMove={handleDashboardDragMove}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={enabledIds} strategy={rectSortingStrategy}>
              {enabledLayout.map((item) => {
                const definition = getDefinition(item.id);

                return (
                  <SortableWidgetShell
                    key={item.id}
                    item={item}
                    title={definition.title}
                    onHide={handleHideWidget}
                  >
                    {renderWidget(item)}
                  </SortableWidgetShell>
                );
              })}
            </SortableContext>
          </DndContext>
        </div>

        {enabledLayout.length === 0 && (
          <div className="mt-6">
            <EmptyState
              icon={<BarChart3 className="h-6 w-6" />}
              title="No widgets selected"
              message="Open Customize and enable at least one dashboard widget."
            />
          </div>
        )}

        <BmsCard variant="section" className="mt-6 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                Quick system facts
              </p>
              <p className="mt-1 text-sm text-slate-300">
                Tenants/sites:{" "}
                {data.role === "BMS_ADMIN"
                  ? `${formatNumber(data.kpis.totalTenants)} / ${formatNumber(
                      data.kpis.totalSites
                    )}`
                  : formatNumber(data.kpis.totalSites)}
                {" · "}
                Total HVACs: {formatNumber(data.kpis.totalHvacs)}
                {" · "}
                Active: {formatNumber(data.kpis.activeHvacs)}
                {" · "}
                Avg temp: {formatTemp(data.kpis.averageTemperature)}
              </p>
            </div>

            <BmsButton
              type="button"
              variant="secondary"
              onClick={() => {
                const firstSite = getPrioritySites(data)[0];

                if (!firstSite) return;

                navigate(
                  `/user/tenants/${firstSite.tenantId}/sites/${firstSite.siteId}/hvacs`,
                  {
                    state: {
                      tenantName: firstSite.tenantName,
                      siteName: firstSite.siteName,
                    },
                  }
                );
              }}
            >
              Open top priority site
              <ChevronRight className="h-4 w-4" />
            </BmsButton>
          </div>
        </BmsCard>
      </main>

      <WidgetPickerDrawer
        open={customizeOpen}
        layout={layout}
        sensors={sensors}
        onClose={() => {
          drawerOpenedByDragRef.current = false;
          setCustomizeOpen(false);
        }}
        onToggle={handleToggleWidget}
        onReorder={handleDrawerReorder}
        onEnableFromDrawer={handleEnableFromDrawer}
      />    
    </div>
  );
}