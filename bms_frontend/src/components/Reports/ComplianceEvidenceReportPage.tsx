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

import {
  BmsButton,
  BmsCard,
  BmsFormModal,
  BmsInput,
} from "@/components/UI";

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
    <div className="bms-dashboard-bg min-h-screen px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <BmsButton type="button" variant="ghost" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </BmsButton>
        </div>

        <BmsCard variant="section" className="overflow-hidden p-6 sm:p-8">
          <div className="relative">
            <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 left-10 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />

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

              <BmsCard
                variant="glass"
                className="border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-100 lg:max-w-sm"
              >
                <div className="mb-2 flex items-center gap-2 font-bold">
                  <AlertTriangle className="h-4 w-4" />
                  Compliance Notice
                </div>

                <p className="leading-6">
                  This report is evidence only. The IQP must review the records
                  and complete the official Form 12A separately.
                </p>
              </BmsCard>
            </div>
          </div>
        </BmsCard>

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

        <BmsFormModal
          open
          eyebrow="COMPLIANCE EVIDENCE"
          title="Report Information"
          subtitle="Enter the building and compliance schedule details the IQP will review."
          icon={<Building2 className="h-5 w-5" />}
          onClose={handleBack}
        >
          <form
            className="space-y-6"
            onSubmit={(event) => {
              event.preventDefault();
              void handleDownloadPdf();
            }}
          >
            <div className="grid gap-5 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-bold text-slate-200">
                  Tenant ID
                </span>

                <BmsInput
                  value={tenantId}
                  disabled={isSiteSpecificRoute}
                  onChange={(event) => setTenantId(event.target.value)}
                  placeholder="Paste Tenant UUID"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-bold text-slate-200">
                  Site ID
                </span>

                <BmsInput
                  value={siteId}
                  disabled={isSiteSpecificRoute}
                  onChange={(event) => setSiteId(event.target.value)}
                  placeholder="Paste Site UUID"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-bold text-slate-200">
                  Building Name
                </span>

                <BmsInput
                  value={buildingName}
                  onChange={(event) => setBuildingName(event.target.value)}
                  placeholder="Example: QbitLabs Demo Building"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-bold text-slate-200">
                  Compliance Schedule Reference
                </span>

                <BmsInput
                  value={complianceScheduleRef}
                  onChange={(event) =>
                    setComplianceScheduleRef(event.target.value)
                  }
                  placeholder="Example: CS-2026-001"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-bold text-slate-200">
                  System Identifier
                </span>

                <div className="relative">
                  <Fingerprint className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <BmsInput
                    value={systemIdentifier}
                    onChange={(event) =>
                      setSystemIdentifier(event.target.value)
                    }
                    placeholder="Example: HVAC-01"
                    className="pl-11"
                  />
                </div>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-bold text-slate-200">
                  Report Type
                </span>

                <BmsInput
                  value="IQP Compliance Evidence Report"
                  disabled
                  readOnly
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-bold text-slate-200">
                  Reporting From
                </span>

                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />

                  <BmsInput
                    type="datetime-local"
                    value={from}
                    onChange={(event) => setFrom(event.target.value)}
                    className="pl-11 scheme-dark"
                  />
                </div>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-bold text-slate-200">
                  Reporting To
                </span>

                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />

                  <BmsInput
                    type="datetime-local"
                    value={to}
                    onChange={(event) => setTo(event.target.value)}
                    className="pl-11 scheme-dark"
                  />
                </div>
              </label>
            </div>

            {error && (
              <BmsCard
                variant="glass"
                className="border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200"
              >
                {error}
              </BmsCard>
            )}

            <div className="flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-slate-400">
                The downloaded PDF is generated from immutable maintenance,
                telemetry, and fault records available for the selected
                reporting period.
              </p>

              <BmsButton
                type="submit"
                variant="primary"
                disabled={!canGenerate}
                className="justify-center px-6 py-3"
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
              </BmsButton>
            </div>
          </form>
        </BmsFormModal>
      </div>
    </div>
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
    <BmsCard variant="section" className="p-5">
      <div
        className={`mb-3 flex h-11 w-11 items-center justify-center rounded-2xl ${toneClass}`}
      >
        {icon}
      </div>

      <p className="text-sm font-bold text-white">{title}</p>

      <p className="mt-2 text-xs leading-5 text-slate-400">{description}</p>
    </BmsCard>
  );
}