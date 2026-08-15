import type {
  ContinuousCommissioningSeverity,
  ContinuousCommissioningStatus,
} from "@/api/continuousCommissioning";

import {
  commissioningSeverityClasses,
  commissioningStatusClasses,
  commissioningStatusLabel,
  humanizeCommissioningValue,
} from "./commissioningUi";


// ============= Continuous Commissioning Status Badge =============

type CommissioningStatusBadgeProps = {
  status: ContinuousCommissioningStatus;
  className?: string;
};

export function CommissioningStatusBadge({
  status,
  className = "",
}: CommissioningStatusBadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2.5 py-1",
        "text-xs font-bold",
        commissioningStatusClasses(status),
        className,
      ].join(" ")}
    >
      {commissioningStatusLabel(status)}
    </span>
  );
}


// ============= Continuous Commissioning Severity Badge =============

type CommissioningSeverityBadgeProps = {
  severity: ContinuousCommissioningSeverity;
  className?: string;
};

export function CommissioningSeverityBadge({
  severity,
  className = "",
}: CommissioningSeverityBadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2.5 py-1",
        "text-xs font-bold",
        commissioningSeverityClasses(severity),
        className,
      ].join(" ")}
    >
      {humanizeCommissioningValue(severity)}
    </span>
  );
}