// export interface HvacCurrentState {
//     id: number;
//     deviceId: number;
//     unitName: string;
//     temperature: number;
//     setpoint: number;
//     onState: boolean;
//     fanSpeed: number;
//     flowRate: number;
//     fault: boolean;
//     telemetryTime: string;
// }

export type HvacSiteDetailsDto = {
  hvacId: string;
  tenantId?: string | null;
  siteId: string;
  hvacName: string;
  unitName: string;
  unitType?: string | null;
  zone?: string | null;
  protocol?: string | null;
  externalDeviceId?: string | null;
  mapped?: boolean | null;
  temperature?: number | null;
  setpoint?: number | null;
  onState?: boolean | null;
  fanSpeed?: number | null;
  flowRate?: number | null;
  fault?: boolean | null;
  telemetryTime?: string | null;
  online?: boolean | null;
  lastSeenAt?: string | null;
  manufacturer?: string | null;
  model?: string | null;
};

export type HvacCurrentState = {
  id?: number;
  tenantId?: string;
  siteId?: string;
  deviceId?: string;
  unitName: string;
  temperature: number;
  setpoint: number;
  onState: boolean;
  fanSpeed: number;
  flowRate: number;
  fault: boolean;
  telemetryTime: string;
  source?: string;
};