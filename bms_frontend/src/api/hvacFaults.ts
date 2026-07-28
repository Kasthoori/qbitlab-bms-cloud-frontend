import { api } from "./http";

export type HvacFaultProtocol = "SIMULATOR" | "BACNET" | "MODBUS" | "MODBUS_RTU" | string;

export type HvacFaultComponentType =
  | "UNIT"
  | "FAN"
  | "FILTER"
  | "COMPRESSOR"
  | "VALVE"
  | "COIL"
  | "SENSOR"
  | "DAMPER"
  | "PUMP"
  | "VFD"
  | "THERMOSTAT"
  | "AIRFLOW"
  | "PRESSURE"
  | "TEMPERATURE"
  | "COMMUNICATION"
  | "POWER"
  | "OTHER";

export type HvacFaultType =
  | "GENERAL_UNIT_FAULT"
  | "FAN_FAILURE"
  | "FAN_TRIP"
  | "FAN_FEEDBACK_MISMATCH"
  | "FILTER_CLOGGED"
  | "FILTER_DIFFERENTIAL_PRESSURE_HIGH"
  | "COMPRESSOR_FAULT"
  | "COMPRESSOR_LOCKOUT"
  | "COOLING_VALVE_LEAKING"
  | "HEATING_VALVE_LEAKING"
  | "VALVE_STUCK_OPEN"
  | "VALVE_STUCK_CLOSED"
  | "LOW_AIR_FLOW"
  | "HIGH_AIR_FLOW"
  | "LOW_PRESSURE"
  | "HIGH_PRESSURE"
  | "SUPPLY_AIR_TEMP_FAULT"
  | "RETURN_AIR_TEMP_FAULT"
  | "ZONE_TEMP_SENSOR_FAULT"
  | "SENSOR_FAILURE"
  | "COMMUNICATION_LOST"
  | "STALE_TELEMETRY"
  | "POWER_FAILURE"
  | "VFD_FAULT"
  | "OTHER";

export type HvacFaultSeverity = "INFO" | "WARNING" | "CRITICAL";

export type HvacFaultAlarmStatus = "OPEN" | "RESOLVED";

export type HvacFaultMappingDto = {
  id: string;

  tenantId: string;
  siteId: string;
  hvacId: string;

  externalDeviceId: string;
  protocol: HvacFaultProtocol;
  protocolRef: string;

  rawObjectName?: string | null;
  rawDescription?: string | null;

  componentType: HvacFaultComponentType;
  componentName: string;

  faultType: HvacFaultType;
  internalFaultCode: string;
  severity: HvacFaultSeverity;

  haystackTags?: string | null;

  activeValue: string;
  normalValue?: string | null;

  recommendation?: string | null;

  enabled: boolean;
};

export type CreateHvacFaultMappingRequest = {
  tenantId: string;
  siteId: string;
  hvacId: string;

  externalDeviceId: string;
  protocol: HvacFaultProtocol;
  protocolRef: string;

  rawObjectName?: string;
  rawDescription?: string;

  componentType: HvacFaultComponentType;
  componentName: string;

  faultType: HvacFaultType;
  internalFaultCode: string;
  severity: HvacFaultSeverity;

  haystackTags?: string;

  activeValue: string;
  normalValue?: string;

  recommendation?: string;

  enabled?: boolean;
};

export type UpdateHvacFaultMappingRequest = {
  rawObjectName?: string;
  rawDescription?: string;

  componentType: HvacFaultComponentType;
  componentName: string;

  faultType: HvacFaultType;
  internalFaultCode: string;
  severity: HvacFaultSeverity;

  haystackTags?: string;

  activeValue: string;
  normalValue?: string;

  recommendation?: string;

  enabled?: boolean;
};

export type HvacFaultAlarmDto = {
  id: string;

  tenantId: string;
  siteId: string;
  hvacId: string;

  faultMappingId: string;

  externalDeviceId: string;
  protocol: HvacFaultProtocol;
  protocolRef: string;

  rawObjectName?: string | null;
  rawValue?: string | null;
  rawEventState?: string | null;
  rawReliability?: string | null;

  componentType: HvacFaultComponentType;
  componentName: string;

  faultType: HvacFaultType;
  internalFaultCode: string;
  severity: HvacFaultSeverity;

  title: string;
  message: string;
  recommendation?: string | null;

  status: HvacFaultAlarmStatus;

  firstSeenAt: string;
  lastSeenAt: string;
  resolvedAt?: string | null;

  occurrenceCount: number;
};

function buildFaultMappingQuery(params: {
  tenantId: string;
  siteId: string;
  hvacId?: string;
}) {
  const query = new URLSearchParams();

  query.set("tenantId", params.tenantId);
  query.set("siteId", params.siteId);

  if (params.hvacId && params.hvacId.trim() !== "") {
    query.set("hvacId", params.hvacId);
  }

  return query.toString();
}

function buildFaultAlarmQuery(params: {
  tenantId: string;
  siteId: string;
  hvacId?: string;
  status?: HvacFaultAlarmStatus | "ALL";
}) {
  const query = new URLSearchParams();

  query.set("tenantId", params.tenantId);
  query.set("siteId", params.siteId);

  if (params.hvacId && params.hvacId.trim() !== "") {
    query.set("hvacId", params.hvacId);
  }

  if (params.status && params.status !== "ALL") {
    query.set("status", params.status);
  }

  return query.toString();
}

export const HvacFaultApi = {
  listFaultMappings: async (params: {
    tenantId: string;
    siteId: string;
    hvacId?: string;
  }): Promise<HvacFaultMappingDto[]> => {
    const query = buildFaultMappingQuery(params);

    return await api<HvacFaultMappingDto[]>(
      `/api/hvac-fault-mappings?${query}`,
      {
        method: "GET",
        handle403Redirect: false,
      },
    );
  },

  createFaultMapping: async (
    req: CreateHvacFaultMappingRequest,
  ): Promise<HvacFaultMappingDto> => {
    return await api<HvacFaultMappingDto>("/api/hvac-fault-mappings", {
      method: "POST",
      body: JSON.stringify(req),
      headers: {
        "Content-Type": "application/json",
      },
      handle403Redirect: false,
    });
  },

  updateFaultMapping: async (
    mappingId: string,
    req: UpdateHvacFaultMappingRequest,
  ): Promise<HvacFaultMappingDto> => {
    return await api<HvacFaultMappingDto>(
      `/api/hvac-fault-mappings/${mappingId}`,
      {
        method: "PUT",
        body: JSON.stringify(req),
        headers: {
          "Content-Type": "application/json",
        },
        handle403Redirect: false,
      },
    );
  },

  deleteFaultMapping: async (mappingId: string): Promise<void> => {
    return await api<void>(`/api/hvac-fault-mappings/${mappingId}`, {
      method: "DELETE",
      handle403Redirect: false,
    });
  },

  listFaultAlarms: async (params: {
    tenantId: string;
    siteId: string;
    hvacId?: string;
    status?: HvacFaultAlarmStatus | "ALL";
  }): Promise<HvacFaultAlarmDto[]> => {
    const query = buildFaultAlarmQuery(params);

    return await api<HvacFaultAlarmDto[]>(`/api/hvac-fault-alarms?${query}`, {
      method: "GET",
      handle403Redirect: false,
    });
  },
};
