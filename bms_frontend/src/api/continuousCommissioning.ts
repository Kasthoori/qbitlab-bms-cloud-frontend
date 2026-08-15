import { api } from "./http";

// ============= Continuous Commissioning Types =============

export type ContinuousCommissioningStatus =
  | "DETECTED"
  | "APPROVAL_PENDING"
  | "APPROVED"
  | "IN_PROGRESS"
  | "FIX_REPORTED"
  | "VERIFIED"
  | "CLOSED";

export type ContinuousCommissioningSeverity =
  | "INFO"
  | "WARNING"
  | "CRITICAL"
  | string;


/**
 * Common DTO used by the frontend.
 *
 * Important:
 * The list endpoint and detail endpoint do not currently return
 * exactly the same JSON shape.
 *
 * The API client below normalizes the detail response into this shape
 * so ContinuousCommissioningPage and CommissioningFindingDrawer can
 * use one consistent model.
 */
export type ContinuousCommissioningFindingDto = {
  findingId: string;

  tenantId: string;
  siteId: string;

  hvacId?: string | null;
  externalDeviceId?: string | null;

  findingType?: string | null;

  title?: string | null;
  summary?: string | null;
  description?: string | null;
  recommendation?: string | null;

  severity: ContinuousCommissioningSeverity;
  status: ContinuousCommissioningStatus;

  detectedValue?: string | null;
  expectedValue?: string | null;

  confidence?: number | null;
  evidence?: string | null;

  detectedAt?: string | null;
  lastDetectedAt?: string | null;

  occurrenceCount?: number | null;

  approvalRequestedAt?: string | null;
  approvedAt?: string | null;
  inProgressAt?: string | null;
  fixReportedAt?: string | null;
  verifiedAt?: string | null;
  closedAt?: string | null;

  approvalRequestedByUserId?: string | null;
  approvedByUserId?: string | null;
  inProgressByUserId?: string | null;
  fixReportedByUserId?: string | null;
  verifiedByUserId?: string | null;
  closedByUserId?: string | null;

  linkedMaintenanceNoteId?: string | null;

  rejectedAt?: string | null;
  rejectionReason?: string | null;

  fixNotes?: string | null;
  verificationSummary?: string | null;

  createdAt?: string | null;
  updatedAt?: string | null;
};


// ============= Backend Detail Response Types =============

/**
 * Exact finding structure returned inside:
 *
 * GET
 * /api/continuous-commissioning/tenants/{tenantId}/sites/{siteId}/findings/{findingId}
 *
 * Backend response:
 *
 * {
 *   "finding": { ... },
 *   "events": [ ... ]
 * }
 */
export type ContinuousCommissioningBackendFindingDto = {
  findingId: string;

  tenantId: string;
  siteId: string;

  hvacId?: string | null;
  externalDeviceId?: string | null;

  findingType?: string | null;

  severity: ContinuousCommissioningSeverity;
  status: ContinuousCommissioningStatus;

  title?: string | null;
  summary?: string | null;
  evidence?: string | null;
  recommendation?: string | null;

  detectionValue?: string | null;
  expectedValue?: string | null;

  confidenceScore?: number | null;

  firstDetectedAt?: string | null;
  lastDetectedAt?: string | null;

  occurrenceCount?: number | null;

  linkedMaintenanceNoteId?: string | null;

  approvedAt?: string | null;

  rejectedAt?: string | null;
  rejectionReason?: string | null;

  fixReportedAt?: string | null;
  fixNotes?: string | null;

  verifiedAt?: string | null;
  verificationSummary?: string | null;

  createdAt?: string | null;
  updatedAt?: string | null;
};


export type ContinuousCommissioningFindingEventDto = {
  eventId: string;

  findingId?: string | null;

  eventType?: string | null;

  fromStatus?: string | null;
  toStatus?: string | null;

  userId?: string | null;
  userEmail?: string | null;
  userRole?: string | null;

  note?: string | null;

  createdAt?: string | null;
};


export type ContinuousCommissioningFindingDetailResponse = {
  finding: ContinuousCommissioningBackendFindingDto;
  events?: ContinuousCommissioningFindingEventDto[];
};


// ============= Evaluation Types =============

export type ContinuousCommissioningEvaluationResponse = {
  evaluated?: number;

  findingsCreated?: number;
  findingsUpdated?: number;

  message?: string | null;

  findings?: ContinuousCommissioningFindingDto[];
};


// ============= Workflow Request Types =============

export type ContinuousCommissioningReportFixRequest = {
  fixNotes: string;
};

export type ContinuousCommissioningVerifyRequest = {
  verificationSummary: string;
};


// ============= Normalization Helpers =============

/**
 * Converts the backend detail finding into the common frontend DTO.
 *
 * Backend detail field names:
 *
 * detectionValue   -> detectedValue
 * confidenceScore  -> confidence
 * firstDetectedAt  -> detectedAt
 */
function normalizeBackendFinding(
  finding: ContinuousCommissioningBackendFindingDto
): ContinuousCommissioningFindingDto {
  return {
    findingId: finding.findingId,

    tenantId: finding.tenantId,
    siteId: finding.siteId,

    hvacId: finding.hvacId ?? null,
    externalDeviceId: finding.externalDeviceId ?? null,

    findingType: finding.findingType ?? null,

    title: finding.title ?? null,
    summary: finding.summary ?? null,
    recommendation: finding.recommendation ?? null,

    severity: finding.severity,
    status: finding.status,

    detectedValue: finding.detectionValue ?? null,
    expectedValue: finding.expectedValue ?? null,

    confidence: finding.confidenceScore ?? null,
    evidence: finding.evidence ?? null,

    detectedAt: finding.firstDetectedAt ?? null,
    lastDetectedAt: finding.lastDetectedAt ?? null,

    occurrenceCount: finding.occurrenceCount ?? null,

    linkedMaintenanceNoteId:
      finding.linkedMaintenanceNoteId ?? null,

    approvedAt: finding.approvedAt ?? null,

    rejectedAt: finding.rejectedAt ?? null,
    rejectionReason: finding.rejectionReason ?? null,

    fixReportedAt: finding.fixReportedAt ?? null,
    fixNotes: finding.fixNotes ?? null,

    verifiedAt: finding.verifiedAt ?? null,
    verificationSummary:
      finding.verificationSummary ?? null,

    createdAt: finding.createdAt ?? null,
    updatedAt: finding.updatedAt ?? null,
  };
}


/**
 * Some workflow endpoints may return the finding directly,
 * while others may return:
 *
 * {
 *   "finding": { ... }
 * }
 *
 * This helper safely supports both response structures.
 */
function normalizeWorkflowResponse(
  response:
    | ContinuousCommissioningFindingDto
    | ContinuousCommissioningFindingDetailResponse
    | ContinuousCommissioningBackendFindingDto
): ContinuousCommissioningFindingDto {

  if (
    response &&
    typeof response === "object" &&
    "finding" in response
  ) {
    return normalizeBackendFinding(
      response.finding
    );
  }

  const value = response as
    | ContinuousCommissioningFindingDto
    | ContinuousCommissioningBackendFindingDto;

  /**
   * Backend-detail format can be identified by detectionValue,
   * confidenceScore or firstDetectedAt.
   */
  if (
    "detectionValue" in value ||
    "confidenceScore" in value ||
    "firstDetectedAt" in value
  ) {
    return normalizeBackendFinding(
      value as ContinuousCommissioningBackendFindingDto
    );
  }

  return value as ContinuousCommissioningFindingDto;
}


// ============= Continuous Commissioning APIs =============

export const ContinuousCommissioningApi = {

  /**
   * Evaluate a complete site for Continuous Commissioning findings.
   *
   * POST
   * /api/continuous-commissioning/tenants/{tenantId}/sites/{siteId}/evaluate
   */
  evaluateSite: async (
    tenantId: string,
    siteId: string
  ): Promise<ContinuousCommissioningEvaluationResponse> =>
    await api<ContinuousCommissioningEvaluationResponse>(
      `/api/continuous-commissioning/tenants/${tenantId}/sites/${siteId}/evaluate`,
      {
        method: "POST",
        handle403Redirect: false,
      }
    ),


  /**
   * Get all Continuous Commissioning findings for a site.
   *
   * GET
   * /api/continuous-commissioning/tenants/{tenantId}/sites/{siteId}/findings
   */
  getFindings: async (
    tenantId: string,
    siteId: string
  ): Promise<ContinuousCommissioningFindingDto[]> =>
    await api<ContinuousCommissioningFindingDto[]>(
      `/api/continuous-commissioning/tenants/${tenantId}/sites/${siteId}/findings`,
      {
        method: "GET",
        handle403Redirect: false,
      }
    ),


  /**
   * Get one Continuous Commissioning finding.
   *
   * Actual backend response:
   *
   * {
   *   "finding": {
   *      ...
   *   },
   *   "events": [
   *      ...
   *   ]
   * }
   *
   * We return only the normalized finding here because the
   * existing drawer expects ContinuousCommissioningFindingDto.
   *
   * GET
   * /api/continuous-commissioning/tenants/{tenantId}/sites/{siteId}/findings/{findingId}
   */
  getFindingById: async (
    tenantId: string,
    siteId: string,
    findingId: string
  ): Promise<ContinuousCommissioningFindingDto> => {

    const response =
      await api<ContinuousCommissioningFindingDetailResponse>(
        `/api/continuous-commissioning/tenants/${tenantId}/sites/${siteId}/findings/${findingId}`,
        {
          method: "GET",
          handle403Redirect: false,
        }
      );

    return normalizeBackendFinding(
      response.finding
    );
  },


  /**
   * DETECTED -> APPROVAL_PENDING
   */
  requestApproval: async (
    tenantId: string,
    siteId: string,
    findingId: string
  ): Promise<ContinuousCommissioningFindingDto> => {

    const response = await api<
      | ContinuousCommissioningFindingDto
      | ContinuousCommissioningFindingDetailResponse
      | ContinuousCommissioningBackendFindingDto
    >(
      `/api/continuous-commissioning/tenants/${tenantId}/sites/${siteId}/findings/${findingId}/request-approval`,
      {
        method: "POST",
        handle403Redirect: false,
      }
    );

    return normalizeWorkflowResponse(
      response
    );
  },


  /**
   * APPROVAL_PENDING -> APPROVED
   */
  approveFinding: async (
    tenantId: string,
    siteId: string,
    findingId: string,
    currentUserId: string
  ): Promise<ContinuousCommissioningFindingDto> => {

    const response = await api<
      | ContinuousCommissioningFindingDto
      | ContinuousCommissioningFindingDetailResponse
      | ContinuousCommissioningBackendFindingDto
    >(
      `/api/continuous-commissioning/tenants/${tenantId}/sites/${siteId}/findings/${findingId}/approve?currentUserId=${encodeURIComponent(
        currentUserId
      )}`,
      {
        method: "POST",
        handle403Redirect: false,
      }
    );

    return normalizeWorkflowResponse(
      response
    );
  },


  /**
   * APPROVED -> IN_PROGRESS
   */
  markFindingInProgress: async (
    tenantId: string,
    siteId: string,
    findingId: string,
    currentUserId: string
  ): Promise<ContinuousCommissioningFindingDto> => {

    const response = await api<
      | ContinuousCommissioningFindingDto
      | ContinuousCommissioningFindingDetailResponse
      | ContinuousCommissioningBackendFindingDto
    >(
      `/api/continuous-commissioning/tenants/${tenantId}/sites/${siteId}/findings/${findingId}/in-progress?currentUserId=${encodeURIComponent(
        currentUserId
      )}`,
      {
        method: "POST",
        handle403Redirect: false,
      }
    );

    return normalizeWorkflowResponse(
      response
    );
  },


  /**
   * IN_PROGRESS -> FIX_REPORTED
   */
  reportFix: async (
    tenantId: string,
    siteId: string,
    findingId: string,
    currentUserId: string,
    req: ContinuousCommissioningReportFixRequest
  ): Promise<ContinuousCommissioningFindingDto> => {

    const response = await api<
      | ContinuousCommissioningFindingDto
      | ContinuousCommissioningFindingDetailResponse
      | ContinuousCommissioningBackendFindingDto
    >(
      `/api/continuous-commissioning/tenants/${tenantId}/sites/${siteId}/findings/${findingId}/report-fix?currentUserId=${encodeURIComponent(
        currentUserId
      )}`,
      {
        method: "POST",
        body: JSON.stringify(req),
        headers: {
          "Content-Type": "application/json",
        },
        handle403Redirect: false,
      }
    );

    return normalizeWorkflowResponse(
      response
    );
  },


  /**
   * FIX_REPORTED -> VERIFIED
   */
  verifyFinding: async (
    tenantId: string,
    siteId: string,
    findingId: string,
    currentUserId: string,
    req: ContinuousCommissioningVerifyRequest
  ): Promise<ContinuousCommissioningFindingDto> => {

    const response = await api<
      | ContinuousCommissioningFindingDto
      | ContinuousCommissioningFindingDetailResponse
      | ContinuousCommissioningBackendFindingDto
    >(
      `/api/continuous-commissioning/tenants/${tenantId}/sites/${siteId}/findings/${findingId}/verify?currentUserId=${encodeURIComponent(
        currentUserId
      )}`,
      {
        method: "POST",
        body: JSON.stringify(req),
        headers: {
          "Content-Type": "application/json",
        },
        handle403Redirect: false,
      }
    );

    return normalizeWorkflowResponse(
      response
    );
  },


  /**
   * VERIFIED -> CLOSED
   */
  closeFinding: async (
    tenantId: string,
    siteId: string,
    findingId: string,
    currentUserId: string
  ): Promise<ContinuousCommissioningFindingDto> => {

    const response = await api<
      | ContinuousCommissioningFindingDto
      | ContinuousCommissioningFindingDetailResponse
      | ContinuousCommissioningBackendFindingDto
    >(
      `/api/continuous-commissioning/tenants/${tenantId}/sites/${siteId}/findings/${findingId}/close?currentUserId=${encodeURIComponent(
        currentUserId
      )}`,
      {
        method: "POST",
        handle403Redirect: false,
      }
    );

    return normalizeWorkflowResponse(
      response
    );
  },
};