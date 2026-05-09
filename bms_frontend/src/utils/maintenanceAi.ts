import type {
  CreateHvacMaintenanceNoteRequest,
  HvacMaintenanceNoteType,
} from "../types/maintenance";

interface GenerateMaintenanceAiTextParams {
  noteType: HvacMaintenanceNoteType;
  unitName?: string;
  externalDeviceId: string;
  temperature?: number | string | null;
  setpoint?: number | string | null;
  fanSpeed?: string | null;
  flowRate?: number | string | null;
  fault?: boolean | null;
}

export function generateMaintenanceAiDraft(
  params: GenerateMaintenanceAiTextParams
): Partial<CreateHvacMaintenanceNoteRequest> {
  const {
    noteType,
    unitName,
    externalDeviceId,
    temperature,
    setpoint,
    fanSpeed,
    flowRate,
    fault,
  } = params;

  const hvacLabel = unitName || externalDeviceId;

  if (noteType === "SCHEDULED_MAINTENANCE") {
    return {
      workDone:
        `Scheduled maintenance completed for ${hvacLabel}. ` +
        `Checked unit operation, inspected filter condition, verified airflow, reviewed temperature and setpoint readings, and confirmed fan operation. ` +
        `No critical fault was observed during the maintenance check.`,
      filterChanged: false,
      serviceDone: true,
    };
  }

  return {
    failureCause:
      `Failure investigation completed for ${hvacLabel}. ` +
      `Current readings were reviewed. Temperature: ${temperature ?? "N/A"}, ` +
      `Setpoint: ${setpoint ?? "N/A"}, Fan Speed: ${fanSpeed ?? "N/A"}, ` +
      `Flow Rate: ${flowRate ?? "N/A"}, Fault State: ${fault ? "Fault detected" : "No active fault"}.`,
    correctiveAction:
      `Technician inspected the HVAC unit, checked airflow, filter condition, electrical status, and operating state. ` +
      `Corrective actions were applied based on the identified root cause. Unit should be monitored after restart.`,
    workDone:
      `Failure repair note created for ${hvacLabel}. Technician inspected the unit, identified the likely cause, performed corrective action, and prepared the machine for normal operation.`,
    serviceDone: true,
  };
}