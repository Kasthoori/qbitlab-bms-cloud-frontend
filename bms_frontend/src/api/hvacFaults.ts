import { api } from "./http";

export const HVAC_FAULT_PROTOCOLS = ["SIMULATOR", "BACNET", "MODBUS", "MODBUS_RTU"] as const;
export type HvacFaultProtocol = (typeof HVAC_FAULT_PROTOCOLS)[number];

export const HVAC_FAULT_COMPONENT_TYPES = [
  "UNIT", "FAN", "FILTER", "COMPRESSOR", "VALVE", "COIL", "SENSOR", "DAMPER",
  "PUMP", "VFD", "THERMOSTAT", "AIRFLOW", "PRESSURE", "TEMPERATURE",
  "COMMUNICATION", "POWER", "OTHER",
] as const;
export type HvacFaultComponentType = (typeof HVAC_FAULT_COMPONENT_TYPES)[number];

export const HVAC_FAULT_TYPES = [
  "GENERAL_UNIT_FAULT", "FAN_FAILURE", "FAN_TRIP", "FAN_FEEDBACK_MISMATCH",
  "FILTER_CLOGGED", "FILTER_DIFFERENTIAL_PRESSURE_HIGH", "COMPRESSOR_FAULT",
  "COMPRESSOR_LOCKOUT", "COOLING_VALVE_LEAKING", "HEATING_VALVE_LEAKING",
  "VALVE_STUCK_OPEN", "VALVE_STUCK_CLOSED", "LOW_AIR_FLOW", "HIGH_AIR_FLOW",
  "LOW_PRESSURE", "HIGH_PRESSURE", "SUPPLY_AIR_TEMP_FAULT", "RETURN_AIR_TEMP_FAULT",
  "ZONE_TEMP_SENSOR_FAULT", "SENSOR_FAILURE", "COMMUNICATION_LOST", "STALE_TELEMETRY",
  "POWER_FAILURE", "VFD_FAULT", "OTHER",
] as const;
export type HvacFaultType = (typeof HVAC_FAULT_TYPES)[number];

export const HVAC_FAULT_SEVERITIES = ["INFO", "WARNING", "CRITICAL"] as const;
export type HvacFaultSeverity = (typeof HVAC_FAULT_SEVERITIES)[number];
export type HvacFaultAlarmStatus = "OPEN" | "RESOLVED";

export type HvacFaultMappingDto = {
  id: string; tenantId: string; siteId: string; hvacId: string;
  externalDeviceId: string; protocol: HvacFaultProtocol; protocolRef: string;
  rawObjectName?: string | null; rawDescription?: string | null;
  componentType: HvacFaultComponentType; componentName: string;
  faultType: HvacFaultType; internalFaultCode: string; severity: HvacFaultSeverity;
  haystackTags?: string | null; activeValue: string; normalValue?: string | null;
  recommendation?: string | null; enabled: boolean;
};

export type CreateHvacFaultMappingRequest = Omit<HvacFaultMappingDto, "id" | "enabled"> & { enabled?: boolean };
export type UpdateHvacFaultMappingRequest = Pick<
  HvacFaultMappingDto,
  "componentType" | "componentName" | "faultType" | "internalFaultCode" | "severity" | "activeValue"
> & {
  rawObjectName?: string; rawDescription?: string; haystackTags?: string;
  normalValue?: string; recommendation?: string; enabled?: boolean;
};

export type HvacFaultAlarmDto = {
  id: string; tenantId: string; siteId: string; hvacId: string; faultMappingId: string;
  externalDeviceId: string; protocol: HvacFaultProtocol; protocolRef: string;
  rawObjectName?: string | null; rawValue?: string | null; rawEventState?: string | null;
  rawReliability?: string | null; componentType: HvacFaultComponentType; componentName: string;
  faultType: HvacFaultType; internalFaultCode: string; severity: HvacFaultSeverity;
  title: string; message: string; recommendation?: string | null; status: HvacFaultAlarmStatus;
  firstSeenAt: string; lastSeenAt: string; resolvedAt?: string | null; occurrenceCount: number;
};

type ScopeParams = { tenantId: string; siteId: string; hvacId?: string };
type AlarmParams = ScopeParams & { status?: HvacFaultAlarmStatus | "ALL" };

function queryString(params: Record<string, string | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value?.trim()) query.set(key, value.trim());
  });
  return query.toString();
}

export const HvacFaultApi = {
  listFaultMappings: (params: ScopeParams) =>
    api<HvacFaultMappingDto[]>(`/api/hvac-fault-mappings?${queryString(params)}`, {
      method: "GET", handle403Redirect: false,
    }),

  createFaultMapping: (request: CreateHvacFaultMappingRequest) =>
    api<HvacFaultMappingDto>("/api/hvac-fault-mappings", {
      method: "POST", body: JSON.stringify(request),
      headers: { "Content-Type": "application/json" }, handle403Redirect: false,
    }),

  updateFaultMapping: (mappingId: string, request: UpdateHvacFaultMappingRequest) =>
    api<HvacFaultMappingDto>(`/api/hvac-fault-mappings/${encodeURIComponent(mappingId)}`, {
      method: "PUT", body: JSON.stringify(request),
      headers: { "Content-Type": "application/json" }, handle403Redirect: false,
    }),

  deleteFaultMapping: (mappingId: string) =>
    api<void>(`/api/hvac-fault-mappings/${encodeURIComponent(mappingId)}`, {
      method: "DELETE", handle403Redirect: false,
    }),

  listFaultAlarms: (params: AlarmParams) => {
    const { status, ...scope } = params;
    return api<HvacFaultAlarmDto[]>(
      `/api/hvac-fault-alarms?${queryString({ ...scope, status: status === "ALL" ? undefined : status })}`,
      { method: "GET", handle403Redirect: false },
    );
  },
};
