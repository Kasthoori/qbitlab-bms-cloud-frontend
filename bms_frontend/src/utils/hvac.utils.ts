import type { HvacDto } from "@/api/bms";

export function isFailedHvac(hvac?: HvacDto | null) {
  if (!hvac) return false;

  const status = (hvac.status ?? "").toUpperCase();

  const fault =
    hvac.fault === true ||
    String(hvac.fault ?? "").toLowerCase() === "true";

  // 🔥 THIS IS YOUR NEW LINE
  const offline = hvac.online === false;

  return (
    fault ||
    offline ||
    status === "OFFLINE" ||
    status === "FAILED" ||
    status === "FAULT"
  );
}