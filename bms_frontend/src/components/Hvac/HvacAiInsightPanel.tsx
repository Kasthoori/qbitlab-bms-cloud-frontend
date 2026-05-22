import { useEffect, useMemo, useState, type JSX } from "react";
import {
  Activity,
  AlertTriangle,
  Bot,
  BrainCircuit,
  CheckCircle2,
  Gauge,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Thermometer,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

import {
  BmsApi,
  type HvacConditionLabel,
  type HvacInsightResponse,
  type OpenAiHvacInsightResponse,
} from "@/api/bms";

type HvacAiInsightPanelProps = {
  tenantId: string;
  siteId: string;
  hvacId: string;
  className?: string;
};

type ConditionStyle = {
  label: string;
  badgeClass: string;
  ringClass: string;
  glowClass: string;
  icon: JSX.Element;
};

const conditionStyles: Record<HvacConditionLabel, ConditionStyle> = {
  GOOD: {
    label: "Good",
    badgeClass: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
    ringClass: "ring-emerald-400/30",
    glowClass: "shadow-emerald-500/20",
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  WATCH: {
    label: "Watch",
    badgeClass: "border-cyan-400/40 bg-cyan-400/10 text-cyan-200",
    ringClass: "ring-cyan-400/30",
    glowClass: "shadow-cyan-500/20",
    icon: <Activity className="h-4 w-4" />,
  },
  WARNING: {
    label: "Warning",
    badgeClass: "border-amber-400/40 bg-amber-400/10 text-amber-200",
    ringClass: "ring-amber-400/30",
    glowClass: "shadow-amber-500/20",
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  CRITICAL: {
    label: "Critical",
    badgeClass: "border-red-400/40 bg-red-400/10 text-red-200",
    ringClass: "ring-red-400/30",
    glowClass: "shadow-red-500/20",
    icon: <ShieldAlert className="h-4 w-4" />,
  },
  NO_DATA: {
    label: "No Data",
    badgeClass: "border-slate-400/40 bg-slate-400/10 text-slate-200",
    ringClass: "ring-slate-400/20",
    glowClass: "shadow-slate-500/10",
    icon: <Gauge className="h-4 w-4" />,
  },
};

export default function HvacAiInsightPanel({
  tenantId,
  siteId,
  hvacId,
  className = "",
}: HvacAiInsightPanelProps) {
  const [rangeHours, setRangeHours] = useState(24);
  const [insight, setInsight] = useState<HvacInsightResponse | null>(null);
  const [openAi, setOpenAi] = useState<OpenAiHvacInsightResponse | null>(null);

  const [loadingInsight, setLoadingInsight] = useState(false);
  const [loadingOpenAi, setLoadingOpenAi] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { ref, inView } = useInView({
    threshold: 0.2,
    triggerOnce: false,
  });

  const condition = useMemo<ConditionStyle>(() => {
    return conditionStyles[insight?.conditionLabel ?? "NO_DATA"];
  }, [insight?.conditionLabel]);

  useEffect(() => {
    if (!inView) return;
    if (!tenantId || !siteId || !hvacId) return;

    loadRuleBasedInsight();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, tenantId, siteId, hvacId, rangeHours]);

  async function loadRuleBasedInsight() {
    try {
      setLoadingInsight(true);
      setError(null);
      setOpenAi(null);

      const data = await BmsApi.getHvacRuleBasedInsight(
        tenantId,
        siteId,
        hvacId,
        rangeHours
      );

      setInsight(data);
      setHasLoadedOnce(true);
    } catch (err) {
      console.error("Failed to load HVAC AI insight", err);
      setError("Failed to load HVAC AI insight.");
      setHasLoadedOnce(true);
    } finally {
      setLoadingInsight(false);
    }
  }

  async function handleOpenAiAssistance() {
    try {
      setLoadingOpenAi(true);
      setError(null);

      const data = await BmsApi.getHvacOpenAiAssistance(
        tenantId,
        siteId,
        hvacId,
        rangeHours
      );

      setOpenAi(data);
    } catch (err) {
      console.error("Failed to get OpenAI assistance", err);
      setError("Failed to get OpenAI assistance.");
    } finally {
      setLoadingOpenAi(false);
    }
  }

  const isInitialIdle = !hasLoadedOnce && !loadingInsight;

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 28, scale: 0.98 }}
      animate={
        inView
          ? { opacity: 1, y: 0, scale: 1 }
          : { opacity: 0, y: 28, scale: 0.98 }
      }
      transition={{ duration: 0.45, ease: "easeOut" }}
      className={[
        "relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/50 p-5 shadow-2xl backdrop-blur-2xl",
        "ring-1",
        condition.ringClass,
        condition.glowClass,
        className,
      ].join(" ")}
    >
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.10),transparent_35%)]" />

      <div className="relative z-10">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <div className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 p-2.5 text-cyan-200 shadow-lg shadow-cyan-500/10">
                <BrainCircuit className="h-5 w-5" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-white">
                    HVAC-Level AI Insight
                  </h2>

                  <span
                    className={[
                      "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium",
                      condition.badgeClass,
                    ].join(" ")}
                  >
                    {condition.icon}
                    {condition.label}
                  </span>
                </div>

                <p className="mt-1 text-sm text-slate-300">
                  Rule-based telemetry diagnostics with optional OpenAI
                  assistance.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-xs text-slate-400">
              {insight?.unitName && (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                  Unit:{" "}
                  <span className="text-slate-200">{insight.unitName}</span>
                </span>
              )}

              {insight?.deviceId && (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                  Device:{" "}
                  <span className="text-slate-200">{insight.deviceId}</span>
                </span>
              )}

              {insight?.lastTelemetryTime && (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                  Last telemetry:{" "}
                  <span className="text-slate-200">
                    {formatDateTime(insight.lastTelemetryTime)}
                  </span>
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={rangeHours}
              onChange={(e) => setRangeHours(Number(e.target.value))}
              className="rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none backdrop-blur-xl transition hover:border-cyan-400/40"
            >
              <option value={24}>Last 24 hours</option>
              <option value={168}>Last 7 days</option>
              <option value={720}>Last 30 days</option>
            </select>

            <button
              type="button"
              onClick={loadRuleBasedInsight}
              disabled={loadingInsight}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-cyan-400/40 hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingInsight ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </button>

            <button
              type="button"
              onClick={handleOpenAiAssistance}
              disabled={loadingOpenAi || loadingInsight || !insight}
              className="inline-flex items-center gap-2 rounded-2xl border border-violet-400/30 bg-violet-400/10 px-4 py-2 text-sm font-medium text-violet-100 shadow-lg shadow-violet-500/10 transition hover:bg-violet-400/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loadingOpenAi ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Bot className="h-4 w-4" />
              )}
              Ask OpenAI
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {isInitialIdle && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
            Scroll this panel into view to load HVAC AI insight.
          </div>
        )}

        {loadingInsight && (
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-300">
            <Loader2 className="h-5 w-5 animate-spin text-cyan-300" />
            Analyzing HVAC telemetry from hvac_telemetry...
          </div>
        )}

        {!loadingInsight && insight && (
          <div className="space-y-5">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                icon={<Gauge className="h-4 w-4" />}
                label="Risk Score"
                value={`${insight.riskScore ?? 0}/100`}
              />

              <MetricCard
                icon={<Zap className="h-4 w-4" />}
                label="Energy Risk"
                value={`${numberOrDash(
                  insight.estimatedEnergyRiskPercent
                )}%`}
              />

              <MetricCard
                icon={<Activity className="h-4 w-4" />}
                label="Fault Rate"
                value={`${numberOrDash(insight.faultRatePercent)}%`}
              />

              <MetricCard
                icon={<Thermometer className="h-4 w-4" />}
                label="Temp Drift"
                value={`${numberOrDash(insight.temperatureDeviation)}°C`}
              />
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
                <Sparkles className="h-4 w-4 text-cyan-300" />
                Rule-Based AI Summary
              </div>

              <p className="text-sm leading-6 text-slate-300">
                {insight.summary}
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
              <SmallStat
                label="Avg Temp"
                value={`${numberOrDash(insight.avgTemperature)}°C`}
              />
              <SmallStat
                label="Setpoint"
                value={`${numberOrDash(insight.avgSetpoint)}°C`}
              />
              <SmallStat
                label="Max Temp"
                value={`${numberOrDash(insight.maxTemperature)}°C`}
              />
              <SmallStat
                label="Min Temp"
                value={`${numberOrDash(insight.minTemperature)}°C`}
              />
              <SmallStat
                label="Fan Speed"
                value={`${numberOrDash(insight.avgFanSpeed)}%`}
              />
              <SmallStat
                label="Flow Rate"
                value={numberOrDash(insight.avgFlowRate)}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <InfoList
                title="Rule Findings"
                items={insight.ruleFindings ?? []}
                emptyText="No rule findings available."
              />

              <InfoList
                title="Recommended Actions"
                items={insight.recommendations ?? []}
                emptyText="No recommendations available."
              />
            </div>

            {openAi && (
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="rounded-3xl border border-violet-400/20 bg-violet-400/10 p-5 shadow-xl shadow-violet-500/10"
              >
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-violet-100">
                  <Bot className="h-5 w-5" />
                  OpenAI Assistance
                </div>

                <div className="space-y-4 text-sm leading-6 text-slate-200">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="mb-1 font-medium text-violet-100">
                      AI Summary
                    </p>
                    <p className="whitespace-pre-line text-slate-300">
                      {openAi.aiSummary}
                    </p>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <AdviceCard
                      title="Technician Advice"
                      text={openAi.technicianAdvice}
                    />
                    <AdviceCard
                      title="Manager Advice"
                      text={openAi.managerAdvice}
                    />
                  </div>

                  <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-amber-100">
                    <p className="mb-1 font-medium">Safety Note</p>
                    <p>{openAi.safetyNote}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </motion.section>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: JSX.Element;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-lg backdrop-blur-xl">
      <div className="mb-2 flex items-center gap-2 text-xs text-slate-400">
        <span className="text-cyan-300">{icon}</span>
        {label}
      </div>
      <div className="text-xl font-semibold text-white">{value}</div>
    </div>
  );
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-base font-semibold text-slate-100">{value}</p>
    </div>
  );
}

function InfoList({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: string[];
  emptyText: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
      <h3 className="mb-3 text-sm font-semibold text-white">{title}</h3>

      {items.length === 0 ? (
        <p className="text-sm text-slate-400">{emptyText}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li
              key={`${title}-${index}`}
              className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm leading-5 text-slate-300"
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AdviceCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="mb-1 font-medium text-cyan-100">{title}</p>
      <p className="text-slate-300">{text}</p>
    </div>
  );
}

function numberOrDash(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-";
  }

  return String(Math.round(value * 10) / 10);
}

function formatDateTime(value: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}