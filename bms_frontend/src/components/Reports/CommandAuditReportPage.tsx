import { useEffect, useMemo, useState } from "react";
import { Download, Printer, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { useParams } from "react-router-dom";

import {
  BmsApi,
  type CommandAuditReportQuery,
  type CommandAuditReportResponse,
  type CommandAuditRowResponse,
} from "@/api/bms";

import { BmsButton, BmsCard, BmsInput, BmsSelect } from "@/components/UI";

type StatusFilter =
  | "ALL"
  | "PENDING"
  | "PICKED_UP"
  | "COMPLETED"
  | "FAILED"
  | "REJECTED"
  | "EXPIRED";

type RoleFilter = "ALL" | "BMS_ADMIN" | "SITE_MANAGER" | "TECHNICIAN";

const defaultReport: CommandAuditReportResponse = {
  summary: {
    totalCommands: 0,
    completedCommands: 0,
    pendingCommands: 0,
    pickedUpCommands: 0,
    rejectedCommands: 0,
    failedCommands: 0,
    expiredCommands: 0,
  },
  rows: [],
  page: 0,
  size: 50,
  totalElements: 0,
  totalPages: 0,
};

function toIsoDateTime(date: string, endOfDay = false) {
  if (!date) return undefined;
  return `${date}T${endOfDay ? "23:59:59" : "00:00:00"}`;
}

export default function CommandAuditReportPage() {
  const params = useParams<{ tenantId?: string; siteId?: string }>();

  const [tenantId, setTenantId] = useState(params.tenantId ?? "");
  const [siteId, setSiteId] = useState(params.siteId ?? "");

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [requestedByRole, setRequestedByRole] = useState<RoleFilter>("ALL");
  const [commandType, setCommandType] = useState("ALL");
  const [requestedByEmail, setRequestedByEmail] = useState("");
  const [externalDeviceId, setExternalDeviceId] = useState("");

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(50);

  const [report, setReport] =
    useState<CommandAuditReportResponse>(defaultReport);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canLoad = tenantId.trim() !== "" && siteId.trim() !== "";

  const queryParams = useMemo<CommandAuditReportQuery>(() => {
    return {
      from: toIsoDateTime(fromDate, false),
      to: toIsoDateTime(toDate, true),
      status,
      requestedByRole,
      commandType,
      requestedByEmail: requestedByEmail.trim() || undefined,
      externalDeviceId: externalDeviceId.trim() || undefined,
      page,
      size,
    };
  }, [
    fromDate,
    toDate,
    status,
    requestedByRole,
    commandType,
    requestedByEmail,
    externalDeviceId,
    page,
    size,
  ]);

  async function loadReport(customPage = page) {
    if (!canLoad) {
      setError(
        "Tenant ID and Site ID are required to load command audit report."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data = await BmsApi.getCommandAuditReport(
        tenantId.trim(),
        siteId.trim(),
        {
          ...queryParams,
          page: customPage,
          size,
        }
      );

      setReport(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load command audit report."
      );
      setReport(defaultReport);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (params.tenantId && params.siteId) {
      void loadReport(page);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.tenantId, params.siteId, page, size]);

  function handleSearch() {
    setPage(0);
    void loadReport(0);
  }

  async function handleDownloadPdf() {
    if (!canLoad) {
      setError("Tenant ID and Site ID are required to download PDF.");
      return;
    }

    try {
      setError("");

      await BmsApi.downloadCommandAuditPdf(
        tenantId.trim(),
        siteId.trim(),
        queryParams
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to download command audit PDF."
      );
    }
  }

  async function handleExportCsv() {
    if (!canLoad) {
      setError("Tenant ID and Site ID are required to export CSV.");
      return;
    }

    try {
      setError("");

      await BmsApi.downloadCommandAuditCsv(
        tenantId.trim(),
        siteId.trim(),
        queryParams
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to export command audit CSV."
      );
    }
  }

  const activeCommands =
    report.summary.pendingCommands + report.summary.pickedUpCommands;

  const failedOrExpired =
    report.summary.failedCommands + report.summary.expiredCommands;

  return (
    <div className="bms-dashboard-bg min-h-screen w-full min-w-0 overflow-x-hidden px-3 py-4 text-slate-100 sm:px-5">
      <style>
        {`
          @media print {
            @page {
              size: A4 landscape;
              margin: 8mm;
            }

            html,
            body {
              width: 100% !important;
              height: auto !important;
              overflow: visible !important;
              background: white !important;
              color: black !important;
            }

            .no-print {
              display: none !important;
            }

            .print-area {
              width: 100% !important;
              max-width: none !important;
              overflow: visible !important;
              background: white !important;
              color: black !important;
              box-shadow: none !important;
              border: none !important;
            }

            .print-card {
              width: 100% !important;
              max-width: none !important;
              overflow: visible !important;
              border: 1px solid #d1d5db !important;
              background: white !important;
              color: black !important;
              box-shadow: none !important;
              page-break-inside: avoid;
              break-inside: avoid;
            }

            .print-title,
            .print-title * {
              color: black !important;
            }

            .report-table-wrapper {
              max-height: none !important;
              height: auto !important;
              overflow: visible !important;
              border: 1px solid #d1d5db !important;
            }

            .report-table {
              width: 100% !important;
              min-width: 0 !important;
              table-layout: fixed !important;
              border-collapse: collapse !important;
              font-size: 8px !important;
              color: black !important;
            }

            .report-table th,
            .report-table td {
              border-bottom: 1px solid #e5e7eb !important;
              padding: 4px 5px !important;
              white-space: normal !important;
              word-break: break-word !important;
              overflow: visible !important;
              text-overflow: clip !important;
              color: black !important;
              background: white !important;
            }

            .report-table thead {
              display: table-header-group !important;
              background: #f3f4f6 !important;
              color: black !important;
            }

            .report-table thead th {
              background: #f3f4f6 !important;
              color: black !important;
              font-weight: 700 !important;
            }

            .report-table tbody {
              display: table-row-group !important;
            }

            .report-table tr {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }

            .report-table th:nth-child(4),
            .report-table td:nth-child(4),
            .report-table th:nth-child(8),
            .report-table td:nth-child(8),
            .report-table th:nth-child(9),
            .report-table td:nth-child(9) {
              display: none !important;
            }

            .print-muted,
            .print-muted * {
              color: #374151 !important;
            }

            * {
              box-shadow: none !important;
            }
          }
        `}
      </style>

      <div className="mx-auto w-full max-w-350 space-y-5 print-area">
        <BmsCard variant="section" className="p-5 print-card">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="print-title">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">
                <ShieldCheck className="h-4 w-4" />
                Reports / Audit
              </div>

              <h1 className="mt-2 text-2xl font-bold text-white">
                Command Audit Report
              </h1>

              <p className="mt-2 max-w-3xl text-sm text-slate-400 print-muted">
                Review commands issued by technicians, site managers, and admins.
                Shows who issued the command, when it happened, command status,
                safety decision, and edge lifecycle timestamps.
              </p>
            </div>

            <div className="no-print flex flex-wrap gap-2">
              <BmsButton
                type="button"
                variant="ghost"
                onClick={() => void loadReport(page)}
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </BmsButton>

              <BmsButton
                type="button"
                variant="success"
                onClick={() => void handleDownloadPdf()}
              >
                <Printer className="h-4 w-4" />
                Download PDF
              </BmsButton>

              <BmsButton
                type="button"
                variant="secondary"
                onClick={() => void handleExportCsv()}
              >
                <Download className="h-4 w-4" />
                Export CSV
              </BmsButton>
            </div>
          </div>
        </BmsCard>

        <BmsCard variant="section" className="no-print p-5">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <TextInput
              label="Tenant ID"
              value={tenantId}
              onChange={setTenantId}
              placeholder="Auto-filled from site route or paste tenant UUID"
            />

            <TextInput
              label="Site ID"
              value={siteId}
              onChange={setSiteId}
              placeholder="Auto-filled from site route or paste site UUID"
            />

            <TextInput
              label="From Date"
              type="date"
              value={fromDate}
              onChange={setFromDate}
            />

            <TextInput
              label="To Date"
              type="date"
              value={toDate}
              onChange={setToDate}
            />

            <SelectInput
              label="Status"
              value={status}
              onChange={(value) => setStatus(value as StatusFilter)}
              options={[
                "ALL",
                "PENDING",
                "PICKED_UP",
                "COMPLETED",
                "FAILED",
                "REJECTED",
                "EXPIRED",
              ]}
            />

            <SelectInput
              label="Requested Role"
              value={requestedByRole}
              onChange={(value) => setRequestedByRole(value as RoleFilter)}
              options={["ALL", "BMS_ADMIN", "SITE_MANAGER", "TECHNICIAN"]}
            />

            <SelectInput
              label="Command Type"
              value={commandType}
              onChange={setCommandType}
              options={[
                "ALL",
                "SET_SETPOINT",
                "SET_ON_OFF",
                "RESTART_HVAC",
                "ACKNOWLEDGE_ALERT",
                "SIMULATE_FAULT",
                "CLEAR_FAULT",
              ]}
            />

            <TextInput
              label="Requested By Email"
              value={requestedByEmail}
              onChange={setRequestedByEmail}
              placeholder="email search"
            />

            <TextInput
              label="External Device ID"
              value={externalDeviceId}
              onChange={setExternalDeviceId}
              placeholder="hvac-1"
            />

            <SelectInput
              label="Page Size"
              value={String(size)}
              onChange={(value) => {
                setSize(Number(value));
                setPage(0);
              }}
              options={["25", "50", "100", "200"]}
            />

            <div className="flex items-end">
              <BmsButton
                type="button"
                variant="primary"
                onClick={handleSearch}
                disabled={loading}
                className="w-full justify-center py-3"
              >
                <Search className="h-4 w-4" />
                Search Report
              </BmsButton>
            </div>
          </div>

          {error && (
            <BmsCard
              variant="glass"
              className="mt-4 border-red-300/20 bg-red-500/10 px-4 py-3 text-sm text-red-100"
            >
              {error}
            </BmsCard>
          )}
        </BmsCard>

        <div className="grid gap-3 md:grid-cols-5">
          <SummaryCard label="Total" value={report.summary.totalCommands} />
          <SummaryCard
            label="Completed"
            value={report.summary.completedCommands}
          />
          <SummaryCard label="Active" value={activeCommands} />
          <SummaryCard label="Rejected" value={report.summary.rejectedCommands} />
          <SummaryCard label="Failed / Expired" value={failedOrExpired} />
        </div>

        <BmsCard variant="section" className="p-4 print-card">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between print-title">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Command Audit Records
              </h2>

              <p className="text-xs text-slate-400 print-muted">
                Page {report.page + 1} of {Math.max(report.totalPages, 1)} ·{" "}
                {report.totalElements} records
              </p>
            </div>

            {loading && (
              <span className="text-sm text-cyan-200">Loading report...</span>
            )}
          </div>

          <div className="report-table-wrapper max-h-155 w-full overflow-auto rounded-2xl border border-white/10">
            <table className="report-table w-full min-w-7xl table-auto text-left text-sm">
              <thead className="sticky top-0 z-10 bg-slate-900 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-3 py-2">Command</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Device</th>
                  <th className="px-3 py-2">Payload</th>
                  <th className="px-3 py-2">Requested By</th>
                  <th className="px-3 py-2">Role</th>
                  <th className="px-3 py-2">Requested</th>
                  <th className="px-3 py-2">Picked Up</th>
                  <th className="px-3 py-2">Completed</th>
                  <th className="px-3 py-2">Safety / Reason</th>
                </tr>
              </thead>

              <tbody>
                {report.rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-3 py-8 text-center text-slate-500"
                    >
                      {loading
                        ? "Loading..."
                        : "No command audit records found."}
                    </td>
                  </tr>
                ) : (
                  report.rows.map((row) => (
                    <AuditRow key={row.commandId} row={row} />
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="no-print mt-4 flex items-center justify-between text-sm text-slate-300">
            <BmsButton
              type="button"
              variant="ghost"
              disabled={page <= 0 || loading}
              onClick={() => setPage((prev) => Math.max(0, prev - 1))}
            >
              Previous
            </BmsButton>

            <span>
              Page {report.page + 1} / {Math.max(report.totalPages, 1)}
            </span>

            <BmsButton
              type="button"
              variant="ghost"
              disabled={page + 1 >= report.totalPages || loading}
              onClick={() => setPage((prev) => prev + 1)}
            >
              Next
            </BmsButton>
          </div>
        </BmsCard>
      </div>
    </div>
  );
}

function AuditRow({ row }: { row: CommandAuditRowResponse }) {
  return (
    <tr className="border-t border-white/10 text-slate-300">
      <td className="whitespace-nowrap px-3 py-2 text-xs font-medium text-cyan-100">
        {row.commandType ?? "-"}
      </td>

      <td className="whitespace-nowrap px-3 py-2">
        <span
          className={`rounded-full border px-2 py-1 text-xs ${statusClass(
            row.status
          )}`}
        >
          {row.status ?? "-"}
        </span>
      </td>

      <td className="max-w-42.5 truncate px-3 py-2 text-xs">
        {row.externalDeviceId ?? "-"}
      </td>

      <td className="max-w-60 truncate px-3 py-2 text-xs text-slate-400">
        {formatPayload(row.payload)}
      </td>

      <td className="max-w-55 truncate px-3 py-2 text-xs">
        {row.requestedByEmail ?? "-"}
      </td>

      <td className="whitespace-nowrap px-3 py-2 text-xs">
        {row.requestedByRole ?? "-"}
      </td>

      <td className="whitespace-nowrap px-3 py-2 text-xs">
        {formatDate(row.requestedAt)}
      </td>

      <td className="whitespace-nowrap px-3 py-2 text-xs">
        {formatDate(row.pickedUpAt)}
      </td>

      <td className="whitespace-nowrap px-3 py-2 text-xs">
        {formatDate(row.completedAt)}
      </td>

      <td className="max-w-70 truncate px-3 py-2 text-xs text-slate-400">
        {row.rejectedReason ||
          row.errorMessage ||
          row.safetyCheckResult ||
          row.auditNote ||
          "-"}
      </td>
    </tr>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <BmsCard variant="section" className="p-4 print-card">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400 print-muted">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-white print-title">{value}</p>
    </BmsCard>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-400">
        {label}
      </span>
      <BmsInput
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="scheme-dark"
      />
    </label>
  );
}

function SelectInput({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-400">
        {label}
      </span>
      <BmsSelect
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </BmsSelect>
    </label>
  );
}

function statusClass(status?: string | null) {
  switch (status) {
    case "COMPLETED":
      return "border-emerald-300/20 bg-emerald-400/10 text-emerald-100";
    case "PENDING":
    case "PICKED_UP":
      return "border-cyan-300/20 bg-cyan-400/10 text-cyan-100";
    case "REJECTED":
    case "FAILED":
      return "border-red-300/20 bg-red-400/10 text-red-100";
    case "EXPIRED":
      return "border-amber-300/20 bg-amber-400/10 text-amber-100";
    default:
      return "border-slate-300/20 bg-slate-400/10 text-slate-300";
  }
}

function formatPayload(
  payload?: string | Record<string, unknown> | null
  ): string {
    if (!payload) {
      return "-";
    }

    if (typeof payload === "string") {
      return payload.trim().length > 0 ? payload : "-";
    }

    if (Object.keys(payload).length === 0) {
      return "-";
    }

    return JSON.stringify(payload);
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}