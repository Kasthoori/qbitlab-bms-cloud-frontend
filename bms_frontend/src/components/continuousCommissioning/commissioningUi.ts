import type {
  ContinuousCommissioningSeverity,
  ContinuousCommissioningStatus,
} from "@/api/continuousCommissioning";


// ============= Continuous Commissioning UI Helpers =============

export function humanizeCommissioningValue(
  value?: string | null
): string {
  if (!value) {
    return "—";
  }

  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}


export function formatCommissioningDateTime(
  value?: string | null
): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}


export function formatCommissioningValue(
  value?: string | number | boolean | null
): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (typeof value === "boolean") {
    return value ? "True" : "False";
  }

  return String(value);
}


export function formatCommissioningConfidence(
  confidence?: number | null
): string {
  if (confidence === null || confidence === undefined) {
    return "—";
  }

  /*
   * Backend may return confidence as:
   *
   * 0.85  -> 85%
   * 85    -> 85%
   */
  const percentage =
    confidence >= 0 && confidence <= 1
      ? confidence * 100
      : confidence;

  return `${percentage.toFixed(0)}%`;
}


// ============= Status Labels =============

export function commissioningStatusLabel(
  status: ContinuousCommissioningStatus
): string {
  switch (status) {
    case "DETECTED":
      return "Detected";

    case "APPROVAL_PENDING":
      return "Approval Pending";

    case "APPROVED":
      return "Approved";

    case "IN_PROGRESS":
      return "In Progress";

    case "FIX_REPORTED":
      return "Fix Reported";

    case "VERIFIED":
      return "Verified";

    case "CLOSED":
      return "Closed";

    default:
      return humanizeCommissioningValue(status);
  }
}


// ============= Status UI Classes =============

export function commissioningStatusClasses(
  status: ContinuousCommissioningStatus
): string {
  switch (status) {
    case "DETECTED":
      return [
        "border-amber-400/30",
        "bg-amber-500/10",
        "text-amber-100",
      ].join(" ");

    case "APPROVAL_PENDING":
      return [
        "border-violet-400/30",
        "bg-violet-500/10",
        "text-violet-100",
      ].join(" ");

    case "APPROVED":
      return [
        "border-blue-400/30",
        "bg-blue-500/10",
        "text-blue-100",
      ].join(" ");

    case "IN_PROGRESS":
      return [
        "border-cyan-400/30",
        "bg-cyan-500/10",
        "text-cyan-100",
      ].join(" ");

    case "FIX_REPORTED":
      return [
        "border-indigo-400/30",
        "bg-indigo-500/10",
        "text-indigo-100",
      ].join(" ");

    case "VERIFIED":
      return [
        "border-emerald-400/30",
        "bg-emerald-500/10",
        "text-emerald-100",
      ].join(" ");

    case "CLOSED":
      return [
        "border-slate-400/20",
        "bg-slate-500/10",
        "text-slate-300",
      ].join(" ");

    default:
      return [
        "border-white/10",
        "bg-white/5",
        "text-slate-300",
      ].join(" ");
  }
}


// ============= Severity UI Classes =============

export function commissioningSeverityClasses(
  severity: ContinuousCommissioningSeverity
): string {
  switch (severity) {
    case "CRITICAL":
      return [
        "border-rose-400/30",
        "bg-rose-500/10",
        "text-rose-100",
      ].join(" ");

    case "WARNING":
      return [
        "border-amber-400/30",
        "bg-amber-500/10",
        "text-amber-100",
      ].join(" ");

    case "INFO":
      return [
        "border-cyan-400/30",
        "bg-cyan-500/10",
        "text-cyan-100",
      ].join(" ");

    default:
      return [
        "border-white/10",
        "bg-white/5",
        "text-slate-300",
      ].join(" ");
  }
}


// ============= Lifecycle Helpers =============

export function isCommissioningFindingOpen(
  status: ContinuousCommissioningStatus
): boolean {
  return status !== "CLOSED";
}


export function canRequestCommissioningApproval(
  status: ContinuousCommissioningStatus
): boolean {
  return status === "DETECTED";
}


export function canApproveCommissioningFinding(
  status: ContinuousCommissioningStatus
): boolean {
  return status === "APPROVAL_PENDING";
}


export function canStartCommissioningWork(
  status: ContinuousCommissioningStatus
): boolean {
  return status === "APPROVED";
}


export function canReportCommissioningFix(
  status: ContinuousCommissioningStatus
): boolean {
  return status === "IN_PROGRESS";
}


export function canVerifyCommissioningFinding(
  status: ContinuousCommissioningStatus
): boolean {
  return status === "FIX_REPORTED";
}


export function canCloseCommissioningFinding(
  status: ContinuousCommissioningStatus
): boolean {
  return status === "VERIFIED";
}


// ============= Lifecycle Action Labels =============

export function commissioningLifecycleActionLabel(
  status: ContinuousCommissioningStatus
): string | null {
  switch (status) {
    case "DETECTED":
      return "Request Approval";

    case "APPROVAL_PENDING":
      return "Approve";

    case "APPROVED":
      return "Start Work";

    case "IN_PROGRESS":
      return "Report Fix";

    case "FIX_REPORTED":
      return "Verify";

    case "VERIFIED":
      return "Close";

    case "CLOSED":
      return null;

    default:
      return null;
  }
}


// ============= Error Helper =============

export function commissioningErrorMessage(
  error: unknown
): string {
  if (!error) {
    return "An unexpected error occurred.";
  }

  if (typeof error === "string") {
    return error;
  }

  if (
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }

  return "An unexpected error occurred.";
}