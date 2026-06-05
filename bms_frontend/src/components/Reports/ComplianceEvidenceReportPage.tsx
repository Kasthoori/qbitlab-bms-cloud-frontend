import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Building2,
  CalendarDays,
  Download,
  FileCheck2,
  Fingerprint,
  Loader2,
  ShieldCheck,
} from "lucide-react";

import { BmsApi } from "../../api/bms";
import type { ComplianceEvidenceReportRequest } from "../../api/bms";

const glassButton =
  "inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 shadow-[0_8px_30px_rgba(0,0,0,0.18)] transition hover:bg-white/10 hover:text-white";

/**
 * IQP Compliance Evidence Report page.
 *
 * This page generates a PDF evidence report for Building Owner / IQP review.
 * It supports Form 12A preparation but does not replace legal Form 12A.
 */
export default function ComplianceEvidenceReportPage() {
  const navigate = useNavigate();

  const params = useParams<{
    tenantId?: string;
    siteId?: string;
  }>();

  /*
   * If user opens:
   * /admin/tenants/:tenantId/sites/:siteId/reports/compliance-evidence
   * then Tenant ID and Site ID are auto-filled from route params.
   *
   * If user opens:
   * /reports/compliance-evidence
   * then user can paste Tenant ID and Site ID manually.
   */
  const [tenantId, setTenantId] = useState(params.tenantId ?? "");
  const [siteId, setSiteId] = useState(params.siteId ?? "");

  const [buildingName, setBuildingName] = useState("");
  const [complianceScheduleRef, setComplianceScheduleRef] = useState("");
  const [systemIdentifier, setSystemIdentifier] = useState("HVAC-01");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSiteSpecificRoute = Boolean(params.tenantId && params.siteId);

  const canGenerate = useMemo(() => {
    return (
      !isGenerating &&
      tenantId.trim().length > 0 &&
      siteId.trim().length > 0 &&
      buildingName.trim().length > 0 &&
      complianceScheduleRef.trim().length > 0 &&
      systemIdentifier.trim().length > 0 &&
      from.trim().length > 0 &&
      to.trim().length > 0
    );
  }, [
    isGenerating,
    tenantId,
    siteId,
    buildingName,
    complianceScheduleRef,
    systemIdentifier,
    from,
    to,
  ]);

  function handleBack() {
    /*
     * Site-specific report goes back to the tenant's sites list.
     * Generic report goes back to command/report area.
     */
    if (params.tenantId) {
      navigate(`/user/tenants/${params.tenantId}/sites`);
      return;
    }

    navigate("/reports/command-audit");
  }

  async function handleDownloadPdf() {
    setError(null);

    if (!canGenerate) {
      setError("Please complete all required report fields.");
      return;
    }

    /*
     * Backend currently requires siteId for security and report filtering.
     * tenantId is kept in UI because it helps owner/admin identify the site context.
     */
    const request: ComplianceEvidenceReportRequest = {
      siteId: siteId.trim(),
      buildingName: buildingName.trim(),
      complianceScheduleRef: complianceScheduleRef.trim(),
      systemIdentifier: systemIdentifier.trim(),
      from,
      to,
    };

    try {
      setIsGenerating(true);
      await BmsApi.downloadComplianceEvidenceReportPdf(request);
    } catch (ex) {
      setError(
        ex instanceof Error
          ? ex.message
          : "Failed to generate compliance evidence PDF."
      );
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <button type="button" onClick={handleBack} className={glassButton}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>

        <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/6 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl">
          <div className="relative p-6 sm:p-8">
            <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />
            <div className="absolute bottom-0 left-10 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />

            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.25em] text-cyan-200">
                  <FileCheck2 className="h-4 w-4" />
                  Compliance Reports
                </div>

                <div>
                  <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                    IQP Compliance Evidence Report
                  </h1>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                    Generate a read-only PDF evidence pack for Building Owner or
                    IQP review. This supports Form 12A preparation but does not
                    replace the legal Form 12A certificate.
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-100 lg:max-w-sm">
                <div className="mb-2 flex items-center gap-2 font-bold">
                  <AlertTriangle className="h-4 w-4" />
                  Compliance Notice
                </div>
                <p className="leading-6">
                  This report is evidence only. The IQP must review the records
                  and complete the official Form 12A separately.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <InfoCard
            icon={<BadgeCheck className="h-5 w-5" />}
            title="Maintenance Evidence"
            description="Includes service records, technician names, dates, and workflow status."
            tone="emerald"
          />

          <InfoCard
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Performance Evidence"
            description="Includes telemetry summary such as temperature, setpoint, and flow rate."
            tone="cyan"
          />

          <InfoCard
            icon={<AlertTriangle className="h-5 w-5" />}
            title="Fault Audit Trail"
            description="Includes fault records, resolved status, and remedial action evidence."
            tone="rose"
          />
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/6 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">
                Report Information
              </h2>
              <p className="text-sm text-slate-400">
                Enter the building and compliance schedule details the IQP will
                review.
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Tenant ID">
              <input
                value={tenantId}
                disabled={isSiteSpecificRoute}
                onChange={(event) => setTenantId(event.target.value)}
                placeholder="Paste Tenant UUID"
                className={inputClassName(isSiteSpecificRoute)}
              />
            </Field>

            <Field label="Site ID">
              <input
                value={siteId}
                disabled={isSiteSpecificRoute}
                onChange={(event) => setSiteId(event.target.value)}
                placeholder="Paste Site UUID"
                className={inputClassName(isSiteSpecificRoute)}
              />
            </Field>

            <Field label="Building Name">
              <input
                value={buildingName}
                onChange={(event) => setBuildingName(event.target.value)}
                placeholder="Example: QbitLabs Demo Building"
                className={inputClassName(false)}
              />
            </Field>

            <Field label="Compliance Schedule Reference">
              <input
                value={complianceScheduleRef}
                onChange={(event) =>
                  setComplianceScheduleRef(event.target.value)
                }
                placeholder="Example: CS-2026-001"
                className={inputClassName(false)}
              />
            </Field>

            <Field label="System Identifier">
              <div className="relative">
                <Fingerprint className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={systemIdentifier}
                  onChange={(event) => setSystemIdentifier(event.target.value)}
                  placeholder="Example: HVAC-01"
                  className={`${inputClassName(false)} pl-11`}
                />
              </div>
            </Field>

            <Field label="Report Type">
              <input
                value="IQP Compliance Evidence Report"
                disabled
                className={inputClassName(true)}
              />
            </Field>

            <Field label="Reporting From">
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
                <input
                  type="datetime-local"
                  value={from}
                  onChange={(event) => setFrom(event.target.value)}
                  className={`${inputClassName(false)} pl-11 scheme-dark`}
                />
              </div>
            </Field>

            <Field label="Reporting To">
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
                <input
                  type="datetime-local"
                  value={to}
                  onChange={(event) => setTo(event.target.value)}
                  className={`${inputClassName(false)} pl-11 scheme-dark`}
                />
              </div>
            </Field>
          </div>

          {error && (
            <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">
              {error}
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-slate-400">
              The downloaded PDF is generated from immutable maintenance,
              telemetry, and fault records available for the selected reporting
              period.
            </p>

            <button
              type="button"
              disabled={!canGenerate}
              onClick={handleDownloadPdf}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-6 py-3 text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Download PDF Report
                </>
              )}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-bold text-slate-200">{label}</span>
      {children}
    </label>
  );
}

function InfoCard({
  icon,
  title,
  description,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  tone: "emerald" | "cyan" | "rose";
}) {
  const toneClass =
    tone === "emerald"
      ? "bg-emerald-400/10 text-emerald-300"
      : tone === "cyan"
      ? "bg-cyan-400/10 text-cyan-300"
      : "bg-rose-400/10 text-rose-300";

  return (
    <div className="rounded-3xl border border-white/10 bg-white/6 p-5 shadow-xl backdrop-blur-xl">
      <div
        className={`mb-3 flex h-11 w-11 items-center justify-center rounded-2xl ${toneClass}`}
      >
        {icon}
      </div>
      <p className="text-sm font-bold text-white">{title}</p>
      <p className="mt-2 text-xs leading-5 text-slate-400">{description}</p>
    </div>
  );
}

function inputClassName(disabled: boolean) {
  const base =
    "w-full rounded-2xl border px-4 py-3 text-sm outline-none transition";

  if (disabled) {
    return `${base} cursor-not-allowed border-white/10 bg-slate-900/40 text-slate-500`;
  }

  return `${base} border-white/10 bg-slate-900/80 text-white placeholder:text-slate-600 focus:border-cyan-300/50 focus:ring-4 focus:ring-cyan-400/20`;
}