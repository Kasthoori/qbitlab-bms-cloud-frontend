export type HvacMaintenanceNoteType =
  | "SCHEDULED_MAINTENANCE"
  | "FAILURE_REPAIR";

export type HvacMaintenanceNoteStatus =
  | "SUBMITTED"
  | "REVIEWED";

export interface HvacMaintenanceNote {
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
}

export interface CreateHvacMaintenanceNoteRequest {
  noteType: HvacMaintenanceNoteType;

  workDone?: string;
  filterChanged?: boolean;
  serviceDone?: boolean;

  failureCause?: string;
  correctiveAction?: string;
  sparePartsAdded?: string;
  machineRestartedAt?: string;

  technicianName?: string;
}