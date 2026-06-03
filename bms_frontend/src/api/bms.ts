import type { Key } from "react";
import { api }  from "./http";
import { BACKEND_URL as API_BASE_URL } from "@/utils/config";
import type { BmsUserResponse, CreateBmsUserRequest } from "@/types/userManagement";
import { keycloak } from "@/keycloak";

export type TenantDto = {
    tenantName?: string;
    id: Key | null | undefined;
    createdAt: string;
    tenantId: string;
    name: string;
    country: string;
    addressLine1: string;
    city: string;
    postcode: string;
    timezone: string;
    // tenantName?: string;
    // name?: string;
    // createdAt?: string;
};

export type HvacFloorPlanDetailsDto = {
  hvacId: string;
  tenantId?: string;
  siteId?: string;

  hvacName?: string;
  unitName?: string;
  unitType?: string;
  protocol?: string;

  externalDeviceId?: string;

  temperature?: number | null;
  setpoint?: number | null;
  onState?: boolean | null;
  fanSpeed?: number | null;
  flowRate?: number | null;
  fault?: boolean | null;

  online?: boolean | null;
  telemetryTime?: string;
  lastSeenAt?: string;

  manufacturer?: string;
  model?: string;

  status?: string;
};

export type SiteDto = {
    siteId: string;
    siteName: string;
    addressLine1?: string;
    city?: string;
    postcode?: string;
    timezone?: string;

};

export type FloorPlanPlacementDto = {
    itemId: string;
    itemType: "HVAC",
    itemName: string;
    x: number;
    y: number;
    locked: boolean;
}

export type DiscoveredHvacDeviceDto = {
  discoveredDeviceId?: string;
  externalDeviceId: string;

  tenantId: string;
  siteId: string;

  protocol?: string;
  deviceIdentifier?: string;
  deviceName?: string;
  model?: string;
  manufacturer?: string;

  lastSeenAt?: string;
  online?: boolean;

  powerState?: string;
  mode?: string;
  ambientTemperature?: number | null;
  setpointTemperature?: number | null;
};

export type HvacDeviceMappingDto = {
  mappingId: string;
  tenantId: string;
  siteId: string;
  hvacId: string;
  hvacName: string;
  externalDeviceId: string;
  unitName: string;
  mappedAt: string;
};

export type CreateHvacDeviceMappingRequest = {
  hvacId: string;
  externalDeviceId: string;
};

export type HvacDto = {
  hvacId: string;
  tenantId?: string;
  siteId?: string;

  hvacName?: string;
  name?: string;
  unitName?: string;
  unitType?: string;
  zone?: string;

  externalDeviceId?: string;
  deviceId?: string;

  mapped?: boolean;
  protocol?: string;
  manufacturer?: string;
  model?: string;

  temperature?: number | null;
  setpoint?: number | null;
  onState?: boolean | null;
  fanSpeed?: number | null;
  flowRate?: number | null;
  fault?: boolean | null;

  telemetryTime?: string;
  online?: boolean | null;
  lastSeenAt?: string;

  status?: string;
};

export type Page<T> = {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number; // Page index
    size: number;

};

export type CreateTenantRequest = {
    name: string;
    country: string;
    addressLine1: string;
    city: string;
    postcode: string;
    timezone: string;
};

export type CreateSiteRequest = {
    siteName: string;
    addressLine1: string;
    city: string;
    postcode: string;
    timezone: string;
};

export type CreateHvacRequest = {
    hvacName: string;
    deviceId: string;
    protocol: "BACNET" | "MODBUS" | "SIMULATOR";
    unitType: "AHU" | "VRF" | "FCU" | "CHILLER" | "OTHER";
};

export type CurrentUserDto = {
  keycloakUserId: string;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  roles: string[];
};


export type FloorPlanDto = {
    floorPlanId?: string;
    id?: string;
    name: string;
    siteId?: string;
    storagePath?: string;
    contentType?: string;
    originalFileName?: string;
    createdAt?: string;
};

export type FloorPlanUploadResponse = {
    floorPlanId?: string;
    id?: string;
    name: string;
    siteId?: string;
    storagePath?: string;
    contentType?: string;
    originalFileName?: string;
    createdAt?: string;
};

export type UpdateFloorPlanRequest = {
    name: string;
};

export type UpsertFloorPlanPlacementRequest = {
  itemId: string;
  itemType: "HVAC";
  itemName: string;
  x: number;
  y: number;
  locked: boolean;
};

export type CreateTechnicianRequest = {
  keycloakUserId: string;
  email: string;
  displayName: string;
  tenantIds: string[];
  sites: TechnicianSiteAccessRequest[];
};

export type TechnicianSiteAccessRequest = {
  tenantId: string;
  siteId: string;
};

export type TechnicianAccessRequest = {
  tenantIds: string[];
  sites: TechnicianSiteAccessRequest[];
};

// Maintenance Note Types and Interfaces

export type HvacMaintenanceNoteType =
  | "SCHEDULED_MAINTENANCE"
  | "FAILURE_REPAIR";

export type HvacMaintenanceNoteStatus =
  | "SUBMITTED"
  | "REVIEWED";

export type HvacMaintenanceNoteDto = {
  noteId: string;
  tenantId: string;
  siteId: string;
  externalDeviceId: string;

  noteType: HvacMaintenanceNoteType;
  status: HvacMaintenanceNoteStatus;

  workDone?: string | null;
  filterChanged?: boolean;
  serviceDone?: boolean;

  failureCause?: string | null;
  correctiveAction?: string | null;
  sparePartsAdded?: string | null;
  machineRestartedAt?: string | null;

  technicianName?: string | null;
  technicianUserId?: string | null;

  reviewedByUserId?: string | null;
  reviewedAt?: string | null;

  createdAt: string;
  updatedAt: string;

  workflow?: HvacMaintenanceWorkflowDto | null;
};

export type CreateHvacMaintenanceNoteRequest = {
  noteType: HvacMaintenanceNoteType;

  workDone?: string;
  filterChanged?: boolean;
  serviceDone?: boolean;

  failureCause?: string;
  correctiveAction?: string;
  sparePartsAdded?: string;
  machineRestartedAt?: string;

  technicianName?: string;
};


export type HvacMaintenanceWorkflowStatus =
  | "SUBMITTED"
  | "NEEDS_CLARIFICATION"
  | "RESUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | "CLOSED";

export type HvacMaintenanceMessageType =
  | "COMMENT"
  | "CLARIFICATION_REQUEST"
  | "TECHNICIAN_REPLY"
  | "MANAGER_REVIEW"
  | "SYSTEM_EVENT";

export type HvacMaintenanceWorkflowDto = {
  workflowId: string;
  noteId: string;
  workflowStatus: HvacMaintenanceWorkflowStatus;

  reviewComment?: string | null;
  rejectedReason?: string | null;

  submittedAt?: string | null;
  resubmittedAt?: string | null;
  clarificationRequestedAt?: string | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  closedAt?: string | null;

  lastActionByUserId?: string | null;
  lastActionByEmail?: string | null;
  lastActionByRole?: string | null;
  lastActionAt?: string | null;

  createdAt?: string | null;
  updatedAt?: string | null;
};

export type HvacMaintenanceMessageAttachmentDto = {
  attachmentId: string;
  messageId: string;
  noteId: string;
  originalFileName: string;
  contentType: string;
  fileSizeBytes: number;
  downloadUrl: string;
  uploadedAt: string;
};

export type HvacMaintenanceNoteMessageDto = {
  messageId: string;
  noteId: string;

  senderUserId?: string | null;
  senderEmail?: string | null;
  senderRole?: string | null;
  senderDisplayName?: string | null;

  messageType: HvacMaintenanceMessageType;
  message: string;
  createdAt: string;

  attachments?: HvacMaintenanceMessageAttachmentDto[];
};

export type HvacMaintenanceNoteThreadDto = {
  note: HvacMaintenanceNoteDto;
  workflow?: HvacMaintenanceWorkflowDto | null;
  messages: HvacMaintenanceNoteMessageDto[];
};

export type CreateMaintenanceNoteMessageRequest = {
  message: string;
};

export type RequestMaintenanceClarificationRequest = {
  message: string;
};


// ============= Simulator HVAC Types =============

export type SimulatorHvacProtocol = "SIMULATOR" | "BACNET" | "MODBUS";

export type SimulatorHvacDto = {
  id: string;

  tenantId: string;
  siteId: string;

  hvacId?: string | null;
  edgeControllerId?: string | null;

  externalDeviceId: string;
  unitName: string;
  unitType?: string | null;
  zone?: string | null;

  protocol: SimulatorHvacProtocol | string;

  temperature?: number | null;
  setpoint?: number | null;
  onState?: boolean | null;
  fanSpeed?: number | null;
  flowRate?: number | null;
  fault?: boolean | null;
  enabled?: boolean | null;

  createdAt?: string | null;
  updatedAt?: string | null;
};

export type CreateSimulatorHvacRequest = {
  hvacId?: string | null;
  edgeControllerId?: string | null;

  externalDeviceId: string;
  unitName: string;
  unitType?: string;
  zone?: string;
  protocol?: SimulatorHvacProtocol | string;

  temperature?: number;
  setpoint?: number;
  onState?: boolean;
  fanSpeed?: number;
  flowRate?: number;
  fault?: boolean;
  enabled?: boolean;
};

export type UpdateSimulatorHvacRequest = {
  hvacId?: string | null;
  edgeControllerId?: string | null;

  unitName: string;
  unitType?: string;
  zone?: string;
  protocol?: SimulatorHvacProtocol | string;

  temperature?: number;
  setpoint?: number;
  onState?: boolean;
  fanSpeed?: number;
  flowRate?: number;
  fault?: boolean;
  enabled?: boolean;
};


// ============= HVAC Command Types =============

//export type UserRole = "ADMIN" | "BMS_ADMIN" | "SITE_MANAGER" | "TECHNICIAN";
export type UserRole =
  | "ADMIN"
  | "BMS_ADMIN"
  | "SITE_MANAGER"
  | "FACILITY_MANAGER"
  | "TECHNICIAN"
  | string;




export function normalizeRole(role: string): string {
  return role.startsWith("ROLE_") ? role.replace("ROLE_", "") : role;
}

export function normalizeRoles(roles: string[] | undefined): string[] {
  return (roles ?? []).map(normalizeRole);
}

export function hasBmsRole(
  roles: string[] | undefined,
  role: string
): boolean {
  return normalizeRoles(roles).includes(role);
}

export function canAuditCommands(roles: string[] | undefined): boolean {
  const normalized = normalizeRoles(roles);

  return (
    normalized.includes("ADMIN") ||
    normalized.includes("BMS_ADMIN") ||
    normalized.includes("SITE_MANAGER")
  );
}

export function canViewFullMaintenanceHistory(
  roles: string[] | undefined
): boolean {
  const normalized = normalizeRoles(roles);

  return (
    normalized.includes("ADMIN") ||
    normalized.includes("BMS_ADMIN") ||
    normalized.includes("SITE_MANAGER")
  );
}

export function canReviewMaintenanceNotes(
  roles: string[] | undefined
): boolean {
  const normalized = normalizeRoles(roles);

  return (
    normalized.includes("ADMIN") ||
    normalized.includes("BMS_ADMIN") ||
    normalized.includes("SITE_MANAGER")
  );
}

export function isTechnicianOnly(roles: string[] | undefined): boolean {
  const normalized = normalizeRoles(roles);

  return (
    normalized.includes("TECHNICIAN") &&
    !normalized.includes("ADMIN") &&
    !normalized.includes("BMS_ADMIN") &&
    !normalized.includes("SITE_MANAGER")
  );
}



export type HvacProtocol = "SIMULATOR" | "BACNET" | "MODBUS" | string;

export type HvacCommandType =
  | "SET_SETPOINT"
  | "SET_ON_OFF"
  | "RESTART_HVAC"
  | "ACKNOWLEDGE_ALERT"
  | "ADD_MAINTENANCE_NOTE"
  | "SIMULATE_FAULT"
  | "CLEAR_FAULT"
  | "FORCE_TEMPERATURE"
  | "FORCE_FLOW_RATE";

export type HvacCommandStatus =
  | "PENDING"
  | "PICKED_UP"
  | "COMPLETED"
  | "FAILED"
  | "REJECTED"
  | "EXPIRED"
  | "CANCELLED"
  | string;

export type CreateHvacCommandRequest = {
  edgeControllerId: string;
  hvacId: string;
  externalDeviceId: string;
  protocol: HvacProtocol;
  commandType: HvacCommandType;
  payload?: Record<string, unknown>;
  note?: string;
};

export type EdgeCommandResponse = {
  commandId: string;

  tenantId: string;
  siteId: string;
  hvacId: string;

  edgeControllerId?: string;
  externalDeviceId: string;
  protocol: HvacProtocol;

  commandType: HvacCommandType | string;
  payload?: Record<string, unknown>;

  status?: HvacCommandStatus;

  requestedByEmail?: string | null;
  requestedByRole?: string | null;

  rejectedReason?: string | null;
  safetyCheckResult?: string | null;
  errorMessage?: string | null;

  requestedAt?: string | null;
  pickedUpAt?: string | null;
  completedAt?: string | null;
  failedAt?: string | null;
  expiresAt?: string | null;
};

export type HvacCommandPermissions = {
  canSetSetpoint: boolean;
  canSetOnOff: boolean;
  canRestart: boolean;
  canSimulateFault: boolean;
  canClearFault: boolean;
  canForceTelemetry: boolean;
};
// export type EdgeCommandResponse = {
//   commandId: string;
//   tenantId: string;
//   siteId: string;
//   edgeControllerId?: string;
//   hvacId: string;
//   externalDeviceId: string;
//   protocol: string;
//   commandType: HvacCommandType | string;
//   payload: Record<string, unknown>;

//   status?: string;
//   createdAt?: string;
//   deliveredAt?: string | null;
//   executedAt?: string | null;
//   errorMessage?: string | null;
// };

export type SiteEdgeAssignmentResponse = {
  assignmentId: string;
  edgeControllerId: string;
  edgeKey: string;
  edgeName: string;
  status: string;
  tenantId: string;
  siteId: string;
};

// ============= Edge Controller Registration Types =============

export type EdgeRegisterRequest = {
  name: string;
  networkId?: string | null;
  ipAddress?: string | null;
  notes?: string | null;
};

export type EdgeRegisterResponse = {
  edgeControllerId: string;
  tenantId: string;
  siteId: string;

  edgeKey: string;

  /**
   * Plain secret is returned only once during register/rotate.
   * Do not store this in localStorage.
   */
  edgeSecret: string;

  name: string;
  networkId?: string | null;
  ipAddress?: string | null;
  status: string;

  registeredAt?: string | null;
  configYaml: string;
};

export type EdgeControllerViewResponse = {
  edgeControllerId: string;
  assignmentId: string;

  tenantId: string;
  siteId: string;

  edgeKey: string;
  name: string;
  networkId?: string | null;
  ipAddress?: string | null;
  status: string;
  notes?: string | null;

  active: boolean;

  lastSeenAt?: string | null;
  registeredAt?: string | null;
  revokedAt?: string | null;
  assignedAt?: string | null;
  updatedAt?: string | null;
};

export type EdgeRotateSecretResponse = {
  edgeControllerId: string;
  edgeKey: string;

  /**
   * Plain secret is returned only once after rotation.
   */
  edgeSecret: string;

  configYaml: string;
};


// ============= Dashboard Types =============

export type DashboardRole = "BMS_ADMIN" | "SITE_MANAGER" | "TECHNICIAN";

export type RiskLevel = "HEALTHY" | "WARNING" | "CRITICAL";

export type DashboardKpiDto = {
  totalTenants: number;
  totalSites: number;
  totalHvacs: number;

  activeHvacs: number;
  failedHvacs: number;
  offlineHvacs: number;

  openAlerts: number;
  maintenanceDue: number;
  highRiskSites: number;

  averageTemperature: number | null;
};

export type DashboardTenantSummaryDto = {
  tenantId: string;
  tenantName: string;

  totalSites: number;
  totalHvacs: number;
  failedHvacs: number;
  openAlerts: number;

  averageTemperature: number | null;
};

export type DashboardSiteCardDto = {
  tenantId: string;
  tenantName: string;

  siteId: string;
  siteName: string;
  address: string | null;

  totalHvacs: number;
  activeHvacs: number;
  failedHvacs: number;
  offlineHvacs: number;
  openAlerts: number;
  maintenanceDue: number;

  averageTemperature: number | null;
  averageSetpoint: number | null;

  healthScore: number;
  riskLevel: RiskLevel;
  riskReason: string;

  latestTelemetryTime: string | null;
};

export type DashboardRiskSiteDto = {
  tenantId: string;
  tenantName: string;

  siteId: string;
  siteName: string;

  riskScore: number;
  riskLevel: RiskLevel;
  reason: string;

  failedHvacs: number;
  openAlerts: number;
  offlineHvacs: number;
  maintenanceDue: number;
};

export type DashboardAiInsightDto = {
  title: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  message: string;
  recommendedAction: string;
};

export type DashboardOverviewResponse = {
  role: DashboardRole;
  userEmail: string;
  generatedAt: string;

  kpis: DashboardKpiDto;

  tenants: DashboardTenantSummaryDto[];
  sites: DashboardSiteCardDto[];
  riskSites: DashboardRiskSiteDto[];
  aiInsights: DashboardAiInsightDto[];
};


// ============= HVAC AI Insight Types =============

export type HvacConditionLabel =
  | "GOOD"
  | "WATCH"
  | "WARNING"
  | "CRITICAL"
  | "NO_DATA";

export type HvacInsightResponse = {
  tenantId: string;
  siteId: string;
  hvacId: string;

  deviceId?: string | null;
  unitName?: string | null;

  conditionLabel: HvacConditionLabel;
  riskScore: number;
  summary: string;

  avgTemperature?: number | null;
  avgSetpoint?: number | null;
  maxTemperature?: number | null;
  minTemperature?: number | null;

  avgFanSpeed?: number | null;
  avgFlowRate?: number | null;

  totalSamples?: number | null;
  faultSamples?: number | null;
  faultRatePercent?: number | null;

  temperatureDeviation?: number | null;
  estimatedRuntimeHours?: number | null;
  estimatedEnergyRiskPercent?: number | null;

  firstTelemetryTime?: string | null;
  lastTelemetryTime?: string | null;

  ruleFindings: string[];
  recommendations: string[];
};

export type OpenAiHvacInsightResponse = {
  aiSummary: string;
  technicianAdvice: string;
  managerAdvice: string;
  safetyNote: string;
};


// ============= HVAC Point Mapping Types =============

export type HvacPointMappingProtocol = "SIMULATOR" | "BACNET" | "MODBUS" | string;

export type HvacPointMappingRequest = {
  edgeControllerId?: string | null;

  protocol: HvacPointMappingProtocol;

  externalDeviceId: string;
  unitName?: string | null;

  temperaturePoint?: string | null;
  setpointPoint?: string | null;
  onoffPoint?: string | null;
  fanSpeedPoint?: string | null;
  flowRatePoint?: string | null;
  faultPoint?: string | null;
  ambientTempPoint?: string | null;

  writableSetpoint?: boolean;
  writableOnoff?: boolean;
  writableFanSpeed?: boolean;
  writableFlowRate?: boolean;
  writableRestart?: boolean;

  minSetpoint?: number | null;
  maxSetpoint?: number | null;

  enabled?: boolean;
};

export type HvacPointMappingResponse = {
  id: string;

  tenantId: string;
  siteId: string;
  hvacId: string;
  edgeControllerId?: string | null;

  protocol: HvacPointMappingProtocol;
  externalDeviceId: string;
  unitName?: string | null;

  temperaturePoint?: string | null;
  setpointPoint?: string | null;
  onoffPoint?: string | null;
  fanSpeedPoint?: string | null;
  flowRatePoint?: string | null;
  faultPoint?: string | null;
  ambientTempPoint?: string | null;

  writableSetpoint?: boolean;
  writableOnoff?: boolean;
  writableFanSpeed?: boolean;
  writableFlowRate?: boolean;
  writableRestart?: boolean;

  minSetpoint?: number | null;
  maxSetpoint?: number | null;

  enabled?: boolean;
  configVersion?: number;

  points?: Record<string, string>;

  createdAt?: string;
  updatedAt?: string;
};


// ============= Command Audit Report Types =============

export type CommandAuditStatus =
  | "PENDING"
  | "PICKED_UP"
  | "COMPLETED"
  | "FAILED"
  | "REJECTED"
  | "EXPIRED"
  | "CANCELLED"
  | string;

export type CommandAuditRowResponse = {
  commandId: string;
  tenantId: string;
  siteId: string;
  hvacId?: string | null;
  edgeControllerId?: string | null;

  externalDeviceId?: string | null;
  protocol?: string | null;
  commandType?: string | null;
  payload?: string | null;
  status?: CommandAuditStatus | null;

  requestedByUserId?: string | null;
  requestedByEmail?: string | null;
  requestedByRole?: string | null;
  requestedByDisplayName?: string | null;

  sourceScreen?: string | null;
  sourceIp?: string | null;
  userAgent?: string | null;

  safetyCheckResult?: string | null;
  rejectedReason?: string | null;
  errorMessage?: string | null;
  auditNote?: string | null;

  requestedAt?: string | null;
  expiresAt?: string | null;
  pickedUpAt?: string | null;
  completedAt?: string | null;
  failedAt?: string | null;

  auditCreatedAt?: string | null;
};

export type CommandAuditSummaryResponse = {
  totalCommands: number;
  completedCommands: number;
  pendingCommands: number;
  pickedUpCommands: number;
  rejectedCommands: number;
  failedCommands: number;
  expiredCommands: number;
};

export type CommandAuditReportResponse = {
  summary: CommandAuditSummaryResponse;
  rows: CommandAuditRowResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type CommandAuditReportQuery = {
  from?: string;
  to?: string;
  status?: string;
  commandType?: string;
  requestedByEmail?: string;
  requestedByRole?: string;
  externalDeviceId?: string;
  page?: number;
  size?: number;
};

function buildCommandAuditQuery(
  params?: CommandAuditReportQuery,
  includePagination = true
): string {
  if (!params) return "";

  const query = new URLSearchParams();

  if (params.from) query.set("from", params.from);
  if (params.to) query.set("to", params.to);
  if (params.status && params.status !== "ALL") query.set("status", params.status);
  if (params.commandType && params.commandType !== "ALL") {
    query.set("commandType", params.commandType);
  }
  if (params.requestedByEmail) {
    query.set("requestedByEmail", params.requestedByEmail);
  }
  if (params.requestedByRole && params.requestedByRole !== "ALL") {
    query.set("requestedByRole", params.requestedByRole);
  }
  if (params.externalDeviceId) {
    query.set("externalDeviceId", params.externalDeviceId);
  }

  if (includePagination) {
    query.set("page", String(params.page ?? 0));
    query.set("size", String(params.size ?? 50));
  }

  const value = query.toString();
  return value ? `?${value}` : "";
}


// ======================== Dashboard Types ========================

export type DashboardNotificationType = "ALARM" | "MESSAGE" | string;

export type DashboardNotificationSeverity =
  | "INFO"
  | "WARNING"
  | "CRITICAL"
  | "HEALTHY"
  | string;

export type DashboardNotificationItemDto = {
  id: string;
  type: DashboardNotificationType;
  severity: DashboardNotificationSeverity;
  title: string;
  message: string;

  tenantId?: string | null;
  tenantName?: string | null;

  siteId?: string | null;
  siteName?: string | null;

  hvacId?: string | null;
  externalDeviceId?: string | null;

  link: string;
  createdAt?: string | null;
};

export type DashboardNotificationSummaryDto = {
  alarmCount: number;
  messageCount: number;
  alarms: DashboardNotificationItemDto[];
  messages: DashboardNotificationItemDto[];
};


export const BmsApi = {

    //getMyTenants: async () => await api<Page<TenantDto>>("/api/tenants/search"),
//    getMyTenants: async (page = 0, size = 50) =>
//         await api<Page<TenantDto>>(`/api/tenants/search?page=${page}&size=${size}`),

        getMyTenants: async (page = 0, size = 50) =>
        await api<Page<TenantDto>>(`/api/me/tenants?page=${page}&size=${size}`),

//    getSitesByTenant: async (tenantId: string) =>
//     await api<SiteDto[]>(`/api/tenants/query/${tenantId}/sites`, {
//         method: "GET",
//         handle403Redirect: false,
//     }),

    getSitesByTenant: async (
        tenantId: string,
        page = 0,
        size = 50
        ) =>
        await api<Page<SiteDto>>(
            `/api/tenants/query/${tenantId}/sites?page=${page}&size=${size}`
        ),

    // Read only endpoint for HVACs under a Site - for TECHNICIAN / SITE_MANAGER / FACILITY_MANAGER
    getReadableSiteEdgeAssignment: async (
            tenantId: string,
            siteId: string
        ): Promise<SiteEdgeAssignmentResponse> =>
            await api<SiteEdgeAssignmentResponse>(
                `/api/tenants/${tenantId}/sites/${siteId}/edge-assignment`,
                {
                    method: "GET",
                    handle403Redirect: false,
                }
        ),

    getHvacsByTenantSite: async (tenantId: string, siteId: string) => await api<HvacDto[]>(`/api/hvacs/query/${tenantId}/sites/${siteId}/hvacs`),

    getCurrentUser: async () => await api<CurrentUserDto>("/api/me"),

    // ============= Dashboard APIs =============

    getDashboardOverview: async (): Promise<DashboardOverviewResponse> =>
        await api<DashboardOverviewResponse>("/api/dashboard/overview", {
            method: "GET",
        }),
        

    getDashboardNotifications: async (): Promise<DashboardNotificationSummaryDto> =>
    await api<DashboardNotificationSummaryDto>("/api/dashboard/notifications", {
        method: "GET",
        handle403Redirect: false,
    }),

    markDashboardNotificationAsRead: async (
        notificationId: string
        ): Promise<void> =>
        await api<void>(`/api/dashboard/notifications/${notificationId}/read`, {
            method: "PUT",
            handle403Redirect: false,
        }),

        dismissDashboardNotification: async (
        notificationId: string
        ): Promise<void> =>
        await api<void>(`/api/dashboard/notifications/${notificationId}/dismiss`, {
            method: "PUT",
            handle403Redirect: false,
    }),


    // ============= Tenant / Site / HVAC Management APIs =============

    getHvacSiteDetails: async (tenantId: string, siteId: string) =>
        await api<HvacDto[]>(
            `/api/tenants/${tenantId}/sites/${siteId}/hvacs/details`
        ),

    getHvacFloorPlanDetails: async (tenantId: string, siteId: string) =>
    await api<HvacFloorPlanDetailsDto[]>(
        `/api/tenants/${tenantId}/sites/${siteId}/hvacs/floor-plan-details`
    ),
    
    getTenantById: async (tenantId: string) => await api<TenantDto>(`/api/tenants/${tenantId}`),
    
    deleteSite: async (tenantId: string, siteId: string) =>
        await api<void>(`/api/tenants/deleteSite/${tenantId}/sites/${siteId}`, {method: "DELETE"}),

    deleteHvac: async (tenantId: string, siteId: string, hvacId: string) =>
        await api<void>(`/api/tenants/deleteHvac/${tenantId}/sites/${siteId}/hvacs/${hvacId}`, {method: "DELETE"}),

    deleteTenant: async (tenantId: string) => 
       await api<void>(`/api/tenants/delete/${tenantId}`, {method: "DELETE"}),

    // Add Site to existing Tenant
    addSiteToExistingTenant: async (tenantId: string, req: CreateSiteRequest) =>
            await api<SiteDto>(`/api/tenants/update/${tenantId}/sites`, {
                method: "POST",
                body: JSON.stringify(req),
                headers: {"Content-Type": "application/json"},
            }),

    // Add HVAC to existing Site
    addHvacToExistingSite: async (tenantId: string, siteId: string, req: CreateHvacRequest) =>
            await api<HvacDto>(`/api/hvacs/${tenantId}/sites/${siteId}/hvacs`, {
                method: "POST",
                body: JSON.stringify(req),
                headers: {"Content-Type": "application/json"},
            }),

    // Update Tenant Details
    updateTenantInfo: async (tenantId: string, req: CreateTenantRequest) =>
            await api<TenantDto>(`/api/update-tenant/${tenantId}`, {
                method: "PUT",
                body: JSON.stringify(req),
                headers: {"Content-Type": "application/json"},
            }),

    // Update Site Details /api/update-site/{tenantId}/sites/{siteId}
    updateSite: async (tenantId: string, siteId: string, req: CreateSiteRequest) =>
            await api<SiteDto>(`/api/update-site/${tenantId}/sites/${siteId}`, {
                method: "PUT",
                body: JSON.stringify(req),
                headers: {"Content-Type": "application/json"},
            }),

    updateHvac: async (tenantId: string, siteId: string, hvacId: string, req: CreateHvacRequest) =>
            await api<HvacDto>(`/api/update-hvac/${tenantId}/sites/${siteId}/hvacs/${hvacId}`, {
                method: "PUT",
                body: JSON.stringify(req),
                headers: {"Content-Type": "application/json"},
            }),


    // ============= Floor Plan APIs =============

    UploadFloorPlan: async (
        tenantId: string,
        siteId: string,
        file: File,
        name: string
    ) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("name", name);

        return await api<FloorPlanUploadResponse>(
            `/api/tenants/${tenantId}/sites/${siteId}/floor-plans`,
            {
                method: "POST",
                body: formData,
            }
        );
    },

    getFloorPlansByTenantSite: async (tenantId: string, siteId: string) => {
        return await api<FloorPlanDto[]>(
            `/api/tenants/${tenantId}/sites/${siteId}/floor-plans`
        );
    },

    getFloorPlanById: async (
        tenantId: string,
        siteId: string,
        floorPlanId: string
    ) => {
        return await api<FloorPlanDto>(
            `/api/tenants/${tenantId}/sites/${siteId}/floor-plans/${floorPlanId}`
        );
    },

    updateFloorPlanMetaData: async (
        tenantId: string,
        siteId: string,
        floorPlanId: string,
        req: UpdateFloorPlanRequest
    ) => {
        return await api<FloorPlanDto>(
            `/api/tenants/${tenantId}/sites/${siteId}/floor-plans/${floorPlanId}`,
            {
                method: "PUT",
                body: JSON.stringify(req),
                headers: { "Content-Type": "application/json" },
            }
        );
    },

     deleteFloorPlan: async (
        tenantId: string,
        siteId: string,
        floorPlanId: string
    ) =>
        await api<void>(
            `/api/tenants/${tenantId}/sites/${siteId}/floor-plans/${floorPlanId}`,
            {
                method: "DELETE",
            }
        ),

    getFloorPlanFileUrl: (
        tenantId: string,
        siteId: string,
        floorPlanId: string
    ) =>
        `${API_BASE_URL}/api/tenants/${tenantId}/sites/${siteId}/floor-plans/${floorPlanId}/file`,


    getFloorPlanPlacements: async (
        tenantId: string,
        siteId: string,
        floorPlanId: string

    ) => {
        return await api<FloorPlanPlacementDto[]>(
            `/api/tenants/${tenantId}/sites/${siteId}/floor-plans/${floorPlanId}/placements`
        );
    },

    // saveFloorPlanPlacements: async (
    //         tenantId: string,
    //         siteId: string,
    //         floorPlanId: string,
    //         placements: FloorPlanPlacementDto[]
    //     ) => {
    //         return await api<FloorPlanPlacementDto[]>(
    //             `/api/tenants/${tenantId}/sites/${siteId}/floor-plans/${floorPlanId}/placements`,
    //             {
    //                 method: "PUT",
    //                 body: JSON.stringify(placements),
    //                 headers: { "Content-Type": "application/json" },
    //             }
    //         );
    //     },
    
   saveFloorPlanPlacements: async (
        tenantId: string,
        siteId: string,
        floorPlanId: string,
        placement: FloorPlanPlacementDto[]
    ) => {
        return await api<FloorPlanPlacementDto>(
            `/api/tenants/${tenantId}/sites/${siteId}/floor-plans/${floorPlanId}/placements`,
            {
                method: "PUT",
                body: JSON.stringify(placement),
                headers: { "Content-Type": "application/json" },
            }

        );
    },

    
    deleteFloorPlanPlacement: async (
            tenantId: string,
            siteId: string,
            floorPlanId: string,
            itemId: string,
            itemType: string
    ) => {
        const query = new URLSearchParams({ itemType }).toString();

        return await api<void>(
        `/api/tenants/${tenantId}/sites/${siteId}/floor-plans/${floorPlanId}/placements/${itemId}?${query}`,
        {
            method: "DELETE",
        }
        );
    },


    //======= Mapping End Points ==============

    getDiscoveredDevices: async (
        tenantId: string,
        siteId: string
    ): Promise<DiscoveredHvacDeviceDto[]> => {
        return await api<DiscoveredHvacDeviceDto[]> (
            `/api/admin/tenants/${tenantId}/sites/${siteId}/hvac-device-mapping/discovered-devices`,
            {
                method: "GET"
            }
        );
    },

    getHvacMappings: async (
        tenantId: string,
        siteId: string
    ): Promise<HvacDeviceMappingDto[]> => {
        return await api<HvacDeviceMappingDto[]>(
            `/api/admin/tenants/${tenantId}/sites/${siteId}/hvac-device-mapping`,
            {
                method: "GET"
            }
        );
    },

    createHvacMapping: async (
        tenantId: string,
        siteId: string,
        body: CreateHvacDeviceMappingRequest
    ): Promise<HvacDeviceMappingDto> => {
        return await api<HvacDeviceMappingDto>(
            `/api/admin/tenants/${tenantId}/sites/${siteId}/hvac-device-mapping`,
            {
                method: "POST",
                body: JSON.stringify(body),
                headers: {
                    "Content-Type": "application/json"
                },
            }
        );
    },

     unmapByMappingId: async (
        tenantId: string,
        siteId: string,
        mappingId: string
    ): Promise<void> => {
        await api<void>(
        `/api/admin/tenants/${tenantId}/sites/${siteId}/hvac-device-mapping/${mappingId}`,
        { method: "DELETE" }
        );
    },

    unmapByHvacId: async (
        tenantId: string,
        siteId: string,
        hvacId: string
    ): Promise<void> => {
        await api<void>(
        `/api/admin/tenants/${tenantId}/sites/${siteId}/hvac-device-mapping/hvac/${hvacId}`,
        { method: "DELETE" }
        );
    },

   createTechnician: async (req: CreateTechnicianRequest): Promise<void> =>
    await api<void>("/api/technicians", {
        method: "POST",
        body: JSON.stringify(req),
        headers: {
            "Content-Type": "application/json",
        },
    }),


    // ============= User Management APIs =============

  createBmsUser: async (req: CreateBmsUserRequest): Promise<BmsUserResponse> =>
    await api<BmsUserResponse>("/api/admin/users", {
      method: "POST",
      body: JSON.stringify(req),
      headers: {
        "Content-Type": "application/json",
      },
    }),


    getBmsUsers: async (
            page = 0,
            size = 20
            ): Promise<Page<BmsUserResponse>> =>
            await api<Page<BmsUserResponse>>(
                `/api/admin/users?page=${page}&size=${size}`
            ),

    getBmsUserById: async (userId: string): Promise<BmsUserResponse> =>
    await api<BmsUserResponse>(`/api/admin/users/${userId}`),

    updateBmsUser: async (
    userId: string,
    req: CreateBmsUserRequest
    ): Promise<BmsUserResponse> =>
    await api<BmsUserResponse>(`/api/admin/users/${userId}`, {
        method: "PUT",
        body: JSON.stringify(req),
        headers: {
        "Content-Type": "application/json",
        },
    }),

    deleteBmsUser: async (userId: string): Promise<void> =>
    await api<void>(`/api/admin/users/${userId}`, {
        method: "DELETE",
    }),


  // ============= HVAC Maintenance Notes APIs =============

    createHvacMaintenanceNote: async (
        tenantId: string,
        siteId: string,
        externalDeviceId: string,
        req: CreateHvacMaintenanceNoteRequest
    ): Promise<HvacMaintenanceNoteDto> => {
        if (!externalDeviceId || externalDeviceId.trim() === "") {
            throw new Error("externalDeviceId is missing in createHvacMaintenanceNote");
        }

        return await api<HvacMaintenanceNoteDto>(
            `/api/tenants/${tenantId}/sites/${siteId}/hvacs/${externalDeviceId}/maintenance-notes`,
            {
                method: "POST",
                body: JSON.stringify(req),
                headers: {
                    "Content-Type": "application/json",
                },
                handle403Redirect: false,
            }
        );
    },

    getHvacMaintenanceNotes: async (
        tenantId: string,
        siteId: string,
        externalDeviceId: string,
        noteType?: HvacMaintenanceNoteType | "ALL"
    ): Promise<HvacMaintenanceNoteDto[]> => {
        if (!externalDeviceId || externalDeviceId.trim() === "") {
            throw new Error("externalDeviceId is missing in getHvacMaintenanceNotes");
        }

        const query =
            noteType && noteType !== "ALL"
                ? `?noteType=${encodeURIComponent(noteType)}`
                : "";

        return await api<HvacMaintenanceNoteDto[]>(
            `/api/tenants/${tenantId}/sites/${siteId}/hvacs/${externalDeviceId}/maintenance-notes${query}`,
            {
                method: "GET",
                handle403Redirect: false,
            }
        );
    },

    reviewHvacMaintenanceNote: async (
        tenantId: string,
        siteId: string,
        externalDeviceId: string,
        noteId: string
    ): Promise<HvacMaintenanceNoteDto> => {
        if (!externalDeviceId || externalDeviceId.trim() === "") {
            throw new Error("externalDeviceId is missing in reviewHvacMaintenanceNote");
        }

        return await api<HvacMaintenanceNoteDto>(
            `/api/tenants/${tenantId}/sites/${siteId}/hvacs/${externalDeviceId}/maintenance-notes/${noteId}/review`,
            {
                method: "PUT",
                handle403Redirect: false,
            }
        );
    },


    getHvacMaintenanceNoteThread: async (
    tenantId: string,
    siteId: string,
    externalDeviceId: string,
    noteId: string
    ): Promise<HvacMaintenanceNoteThreadDto> => {
    if (!externalDeviceId || externalDeviceId.trim() === "") {
        throw new Error("externalDeviceId is missing in getHvacMaintenanceNoteThread");
    }

    return await api<HvacMaintenanceNoteThreadDto>(
        `/api/tenants/${tenantId}/sites/${siteId}/hvacs/${encodeURIComponent(
        externalDeviceId
        )}/maintenance-notes/${noteId}/thread`,
        {
        method: "GET",
        handle403Redirect: false,
        }
    );
    },

    requestHvacMaintenanceClarification: async (
    tenantId: string,
    siteId: string,
    externalDeviceId: string,
    noteId: string,
    req: RequestMaintenanceClarificationRequest
    ): Promise<HvacMaintenanceNoteThreadDto> => {
    if (!externalDeviceId || externalDeviceId.trim() === "") {
        throw new Error("externalDeviceId is missing in requestHvacMaintenanceClarification");
    }

    return await api<HvacMaintenanceNoteThreadDto>(
        `/api/tenants/${tenantId}/sites/${siteId}/hvacs/${encodeURIComponent(
        externalDeviceId
        )}/maintenance-notes/${noteId}/request-clarification`,
        {
        method: "POST",
        body: JSON.stringify(req),
        headers: {
            "Content-Type": "application/json",
        },
        handle403Redirect: false,
        }
    );
    },

    replyToHvacMaintenanceThread: async (
    tenantId: string,
    siteId: string,
    externalDeviceId: string,
    noteId: string,
    req: CreateMaintenanceNoteMessageRequest
    ): Promise<HvacMaintenanceNoteThreadDto> => {
    if (!externalDeviceId || externalDeviceId.trim() === "") {
        throw new Error("externalDeviceId is missing in replyToHvacMaintenanceThread");
    }

    return await api<HvacMaintenanceNoteThreadDto>(
        `/api/tenants/${tenantId}/sites/${siteId}/hvacs/${encodeURIComponent(
        externalDeviceId
        )}/maintenance-notes/${noteId}/reply`,
        {
        method: "POST",
        body: JSON.stringify(req),
        headers: {
            "Content-Type": "application/json",
        },
        handle403Redirect: false,
        }
    );
    },

    replyToHvacMaintenanceThreadWithAttachments: async (
    tenantId: string,
    siteId: string,
    externalDeviceId: string,
    noteId: string,
    message: string,
    files: File[]
    ): Promise<HvacMaintenanceNoteThreadDto> => {
    if (!externalDeviceId || externalDeviceId.trim() === "") {
        throw new Error(
        "externalDeviceId is missing in replyToHvacMaintenanceThreadWithAttachments"
        );
    }

    const formData = new FormData();
    formData.append("message", message);

    files.forEach((file) => {
        formData.append("files", file);
    });

    /*
    * Do NOT set Content-Type manually for FormData.
    * Browser must set multipart boundary automatically.
    */
    return await api<HvacMaintenanceNoteThreadDto>(
        `/api/tenants/${tenantId}/sites/${siteId}/hvacs/${encodeURIComponent(
        externalDeviceId
        )}/maintenance-notes/${noteId}/reply-with-attachments`,
        {
        method: "POST",
        body: formData,
        handle403Redirect: false,
        }
    );
    },

    // this is helper method to load maintenance attachment image with proper authentication, since the downloadUrl is a pre-signed URL that requires the same auth token in the header to access the file.

    getMaintenanceAttachmentObjectUrl: async (
    downloadUrl: string
    ): Promise<string> => {
    const normalizedUrl = downloadUrl.startsWith("http")
        ? downloadUrl
        : `${API_BASE_URL}${downloadUrl}`;

    await keycloak.updateToken(30);

    const response = await fetch(normalizedUrl, {
        method: "GET",
        headers: {
        Authorization: `Bearer ${keycloak.token}`,
        },
    });

    if (!response.ok) {
        throw new Error("Failed to load maintenance attachment image.");
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
    },


    //========= End Hvac Maintenance Note APIs =============
    
    markHvacFailureGone: async (
        tenantId: string,
        siteId: string,
        externalDeviceId: string
        ): Promise<void> =>
        await api<void>(
            `/api/tenants/${tenantId}/sites/${siteId}/hvacs/${externalDeviceId}/mark-failure-gone`,
            {
            method: "PUT",
            }
        ),




    // ============= Simulator HVAC APIs =============

    getSimulatorHvacs: async (
        tenantId: string,
        siteId: string
    ): Promise<SimulatorHvacDto[]> =>
        await api<SimulatorHvacDto[]>(
            `/api/admin/tenants/${tenantId}/sites/${siteId}/simulator-hvacs`,
            {
                method: "GET",
            }
        ),

    getEnabledSimulatorHvacs: async (
        tenantId: string,
        siteId: string
    ): Promise<SimulatorHvacDto[]> =>
        await api<SimulatorHvacDto[]>(
            `/api/admin/tenants/${tenantId}/sites/${siteId}/simulator-hvacs/enabled`,
            {
                method: "GET",
            }
        ),

    createSimulatorHvac: async (
        tenantId: string,
        siteId: string,
        req: CreateSimulatorHvacRequest
    ): Promise<SimulatorHvacDto> =>
        await api<SimulatorHvacDto>(
            `/api/admin/tenants/${tenantId}/sites/${siteId}/simulator-hvacs`,
            {
                method: "POST",
                body: JSON.stringify(req),
                headers: {
                    "Content-Type": "application/json",
                },
            }
        ),

    updateSimulatorHvac: async (
        tenantId: string,
        siteId: string,
        simulatorHvacId: string,
        req: UpdateSimulatorHvacRequest
    ): Promise<SimulatorHvacDto> =>
        await api<SimulatorHvacDto>(
            `/api/admin/tenants/${tenantId}/sites/${siteId}/simulator-hvacs/${simulatorHvacId}`,
            {
                method: "PUT",
                body: JSON.stringify(req),
                headers: {
                    "Content-Type": "application/json",
                },
            }
        ),

    deleteSimulatorHvac: async (
        tenantId: string,
        siteId: string,
        simulatorHvacId: string
    ): Promise<void> =>
        await api<void>(
            `/api/admin/tenants/${tenantId}/sites/${siteId}/simulator-hvacs/${simulatorHvacId}`,
            {
                method: "DELETE",
            }
        ),


    // ============= HVAC Command APIs =============

    createHvacCommand: async (
        tenantId: string,
        siteId: string,
        req: CreateHvacCommandRequest
    ): Promise<EdgeCommandResponse> =>
        await api<EdgeCommandResponse>(
            `/api/admin/tenants/${tenantId}/sites/${siteId}/hvac-commands`,
            {
                method: "POST",
                body: JSON.stringify(req),
                headers: {
                    "Content-Type": "application/json",
                },
                handle403Redirect: false,
            }
        ),

    // listHvacCommands: async (
    //     tenantId: string,
    //     siteId: string
    // ): Promise<EdgeCommandResponse[]> =>
    //     await api<EdgeCommandResponse[]>(
    //         `/api/admin/tenants/${tenantId}/sites/${siteId}/hvac-commands`,
    //         {
    //             method: "GET",
    //         }
    //     ),

    listHvacCommands: async (
         tenantId: string,
         siteId: string
        ): Promise<EdgeCommandResponse[]> =>
            await api<EdgeCommandResponse[]>(
                `/api/admin/tenants/${tenantId}/sites/${siteId}/hvac-commands`,
                {
                    method: "GET",
                    handle403Redirect: false,
                }
            ),

    getSiteEdgeAssignment: async (
        tenantId: string,
        siteId: string
    ): Promise<SiteEdgeAssignmentResponse> =>
        await api<SiteEdgeAssignmentResponse>(
            `/api/admin/tenants/${tenantId}/sites/${siteId}/edge-assignment`,
            {
                method: "GET",
            }
    ),



    listReadableHvacCommands: async (
        tenantId: string,
        siteId: string
    ): Promise<EdgeCommandResponse[]> =>
        await api<EdgeCommandResponse[]>(
            `/api/tenants/${tenantId}/sites/${siteId}/hvac-commands`,
            {
                method: "GET",
                handle403Redirect: false,
            }
        ),

    createReadableHvacCommand: async (
        tenantId: string,
        siteId: string,
        hvacId: string,
        req: CreateHvacCommandRequest
    ): Promise<EdgeCommandResponse> =>
        await api<EdgeCommandResponse>(
            `/api/tenants/${tenantId}/sites/${siteId}/hvacs/${hvacId}/commands`,
            {
                method: "POST",
                body: JSON.stringify(req),
                headers: {
                    "Content-Type": "application/json",
                },
                handle403Redirect: false,
            }
        ),


    // ============= HVAC AI Insight APIs =============

    getHvacRuleBasedInsight: async (
        tenantId: string,
        siteId: string,
        hvacId: string,
        rangeHours = 24
    ): Promise<HvacInsightResponse> =>
        await api<HvacInsightResponse>(
            `/api/tenants/${tenantId}/sites/${siteId}/hvacs/${hvacId}/insights/rule-based?rangeHours=${rangeHours}`,
            {
                method: "GET",
                handle403Redirect: false,
            }
        ),

    getHvacOpenAiAssistance: async (
        tenantId: string,
        siteId: string,
        hvacId: string,
        rangeHours = 24
    ): Promise<OpenAiHvacInsightResponse> =>
        await api<OpenAiHvacInsightResponse>(
            `/api/tenants/${tenantId}/sites/${siteId}/hvacs/${hvacId}/insights/openai-assistance?rangeHours=${rangeHours}`,
            {
                method: "POST",
                handle403Redirect: false,
            }
        ),


        // ============= HVAC Point Mapping APIs =============

    getHvacPointMapping: async (
    tenantId: string,
    siteId: string,
    hvacId: string
    ): Promise<HvacPointMappingResponse | null> => {
        const response = await api<HvacPointMappingResponse | null>(
            `/api/admin/tenants/${tenantId}/sites/${siteId}/hvacs/${hvacId}/point-mapping`,
            {
                method: "GET",
                handle403Redirect: false,
            }
        );

        return response ?? null;
    },
    
    upsertHvacPointMapping: async (
        tenantId: string,
        siteId: string,
        hvacId: string,
        req: HvacPointMappingRequest
    ): Promise<HvacPointMappingResponse> =>
        await api<HvacPointMappingResponse>(
            `/api/admin/tenants/${tenantId}/sites/${siteId}/hvacs/${hvacId}/point-mapping`,
            {
                method: "PUT",
                body: JSON.stringify(req),
                headers: {
                    "Content-Type": "application/json",
                },
            }
        ),

    createSimulatorPointMappingDefaults: async (
        tenantId: string,
        siteId: string,
        hvacId: string,
        params: {
            edgeControllerId: string;
            externalDeviceId: string;
            unitName: string;
        }
    ): Promise<HvacPointMappingResponse> => {
        const query = new URLSearchParams({
            edgeControllerId: params.edgeControllerId,
            externalDeviceId: params.externalDeviceId,
            unitName: params.unitName,
        }).toString();

        return await api<HvacPointMappingResponse>(
            `/api/admin/tenants/${tenantId}/sites/${siteId}/hvacs/${hvacId}/point-mapping/simulator-defaults?${query}`,
            {
                method: "POST",
            }
        );
    },

    deleteHvacPointMapping: async (
        tenantId: string,
        siteId: string,
        hvacId: string
    ): Promise<void> =>
        await api<void>(
            `/api/admin/tenants/${tenantId}/sites/${siteId}/hvacs/${hvacId}/point-mapping`,
            {
                method: "DELETE",
            }
        ),


    // ============= Edge Controller Registration APIs =============

    getSiteEdgeController: async (
        tenantId: string,
        siteId: string
    ): Promise<EdgeControllerViewResponse> =>
        await api<EdgeControllerViewResponse>(
            `/api/admin/tenants/${tenantId}/sites/${siteId}/edge-controller`,
            {
                method: "GET",
                handle403Redirect: false,
            }
        ),

    registerSiteEdgeController: async (
        tenantId: string,
        siteId: string,
        req: EdgeRegisterRequest
    ): Promise<EdgeRegisterResponse> =>
        await api<EdgeRegisterResponse>(
            `/api/admin/tenants/${tenantId}/sites/${siteId}/edge-controller/register`,
            {
                method: "POST",
                body: JSON.stringify(req),
                headers: {
                    "Content-Type": "application/json",
                },
                handle403Redirect: false,
            }
        ),

    rotateSiteEdgeSecret: async (
        tenantId: string,
        siteId: string
    ): Promise<EdgeRotateSecretResponse> =>
        await api<EdgeRotateSecretResponse>(
            `/api/admin/tenants/${tenantId}/sites/${siteId}/edge-controller/rotate-secret`,
            {
                method: "POST",
                handle403Redirect: false,
            }
        ),

    revokeSiteEdgeController: async (
        tenantId: string,
        siteId: string
    ): Promise<EdgeControllerViewResponse> =>
        await api<EdgeControllerViewResponse>(
            `/api/admin/tenants/${tenantId}/sites/${siteId}/edge-controller/revoke`,
            {
                method: "POST",
                handle403Redirect: false,
            }
        ),


    // ============= Command Audit Report APIs =============

    getCommandAuditReport: async (
        tenantId: string,
        siteId: string,
        params?: CommandAuditReportQuery
    ): Promise<CommandAuditReportResponse> => {
        const query = buildCommandAuditQuery(params, true);

        return await api<CommandAuditReportResponse>(
            `/api/admin/tenants/${tenantId}/sites/${siteId}/reports/command-audit${query}`,
            {
                method: "GET",
                handle403Redirect: false,
            }
        );
    },

    getCommandAuditCsvUrl: (
        tenantId: string,
        siteId: string,
        params?: Omit<CommandAuditReportQuery, "page" | "size">
    ): string => {
        const query = buildCommandAuditQuery(params, false);

        return `${API_BASE_URL}/api/admin/tenants/${tenantId}/sites/${siteId}/reports/command-audit/csv${query}`;
    },

  downloadCommandAuditCsv: async (
        tenantId: string,
        siteId: string,
        params?: Omit<CommandAuditReportQuery, "page" | "size">
    ): Promise<void> => {
        const query = buildCommandAuditQuery(params, false);

        if (!keycloak) {
            throw new Error("Keycloak not initialized. Please log in again.");
        }

        try {
            await keycloak.updateToken(30);
        } catch (error) {
            await keycloak.login();
            throw error;
        }

        if (!keycloak.token) {
            throw new Error("No access token. Please log in again.");
        }

        const response = await fetch(
            `${API_BASE_URL}/api/admin/tenants/${tenantId}/sites/${siteId}/reports/command-audit/csv${query}`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${keycloak.token}`,
                },
            }
        );

        // if (response.status === 401) {
        //     await keycloak.login();
        //     throw new Error("Unauthorized. Please log in again.");
        // }

        if (response.status === 401) {
            console.error("Backend returned 401. Not redirecting to Keycloak again to avoid login loop.");
            throw new Error("Unauthorized");
        }

        if (response.status === 403) {
            throw new Error("Forbidden. You do not have permission to export this report.");
        }

        if (!response.ok) {
            throw new Error(`CSV export failed: HTTP ${response.status}`);
        }

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = `command-audit-${siteId}.csv`;

        document.body.appendChild(link);
        link.click();
        link.remove();

        window.URL.revokeObjectURL(downloadUrl);
    },



    downloadCommandAuditPdf: async (
        tenantId: string,
        siteId: string,
        params?: Omit<CommandAuditReportQuery, "page" | "size">
    ): Promise<void> => {
        const query = buildCommandAuditQuery(params, false);

        if (!keycloak) {
            throw new Error("Keycloak not initialized. Please log in again.");
        }

        try {
            await keycloak.updateToken(30);
        } catch (error) {
            await keycloak.login();
            throw error;
        }

        if (!keycloak.token) {
            throw new Error("No access token. Please log in again.");
        }

        const response = await fetch(
            `${API_BASE_URL}/api/admin/tenants/${tenantId}/sites/${siteId}/reports/command-audit/pdf${query}`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${keycloak.token}`,
                },
            }
        );

        if (response.status === 401) {
            await keycloak.login();
            throw new Error("Unauthorized. Please log in again.");
        }

        if (response.status === 403) {
            throw new Error("Forbidden. You do not have permission to export this report.");
        }

        if (!response.ok) {
            throw new Error(`PDF export failed: HTTP ${response.status}`);
        }

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = `command-audit-${siteId}.pdf`;

        document.body.appendChild(link);
        link.click();
        link.remove();

        window.URL.revokeObjectURL(downloadUrl);
    },


    
};
