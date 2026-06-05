import { api } from "./http";

export type EnergyTrendPointDto = {
  date: string;
  energyKwh: number;
  averagePowerKw: number;
  averageEfficiencyScore: number;
  estimatedCost: number;
};

export type EnergyOverviewResponse = {
  currentPowerKw: number;
  todayEnergyKwh: number;
  estimatedTodayCost: number;
  estimatedTodayCo2Kg: number;
  averageEfficiencyScore: number;
  onlineMeters: number;
  offlineMeters: number;
  trend: EnergyTrendPointDto[];
};

export type EnergyMeterSummaryDto = {
  energyMeterId: string;
  siteId: string;
  edgeControllerId?: string | null;
  externalDeviceId: string;
  meterName: string;
  protocol: string;
  location?: string | null;

  activePowerKw?: number | null;
  totalEnergyKwh?: number | null;
  voltage?: number | null;
  currentAmp?: number | null;
  powerFactor?: number | null;
  frequencyHz?: number | null;

  efficiencyScore?: number | null;
  estimatedCost?: number | null;
  estimatedCo2Kg?: number | null;

  status: "ONLINE" | "OFFLINE" | string;
  telemetryTime?: string | null;
};

export type EnergyTelemetryPointDto = {
  activePowerKw: number;
  totalEnergyKwh: number;
  voltage?: number | null;
  currentAmp?: number | null;
  powerFactor?: number | null;
  frequencyHz?: number | null;
  efficiencyScore: number;
  estimatedCost: number;
  estimatedCo2Kg: number;
  source: string;
  telemetryTime: string;
};

export type EnergyPointMappingDto = {
  mappingId: string;
  energyMeterId: string;
  pointType: string;
  pointName: string;

  bacnetObjectType?: string | null;
  bacnetInstance?: number | null;

  modbusRegister?: number | null;
  modbusDataType?: string | null;
  modbusScaleFactor?: number | null;

  unit?: string | null;
  writable: boolean;
  enabled: boolean;

  createdAt?: string | null;
  updatedAt?: string | null;
};

export type EnergyMeterDetailDto = {
  energyMeterId: string;
  tenantId: string;
  siteId: string;
  edgeControllerId?: string | null;

  externalDeviceId: string;
  meterName: string;
  protocol: string;
  location?: string | null;

  baselinePowerKw?: number | null;
  ratedPowerKw?: number | null;
  costPerKwh: number;
  co2KgPerKwh: number;
  active: boolean;

  currentState?: EnergyMeterSummaryDto | null;
  pointMappings: EnergyPointMappingDto[];

  createdAt?: string | null;
  updatedAt?: string | null;
};

export type EnergyMeterCreateRequest = {
  siteId: string;
  edgeControllerId?: string | null;

  externalDeviceId: string;
  meterName: string;
  protocol: string;
  location?: string | null;

  baselinePowerKw?: number | null;
  ratedPowerKw?: number | null;
  costPerKwh?: number | null;
  co2KgPerKwh?: number | null;
  active?: boolean;
};

export type EnergyMeterUpdateRequest = {
  edgeControllerId?: string | null;

  meterName: string;
  protocol: string;
  location?: string | null;

  baselinePowerKw?: number | null;
  ratedPowerKw?: number | null;
  costPerKwh?: number | null;
  co2KgPerKwh?: number | null;
  active?: boolean;
};

export type EnergyPointMappingRequest = {
  energyMeterId: string;

  pointType: string;
  pointName: string;

  bacnetObjectType?: string | null;
  bacnetInstance?: number | null;

  modbusRegister?: number | null;
  modbusDataType?: string | null;
  modbusScaleFactor?: number | null;

  unit?: string | null;
  writable?: boolean;
  enabled?: boolean;
};

export const EnergyApi = {
  getEnergyOverview: async (
    siteId: string,
    days = 7
  ): Promise<EnergyOverviewResponse> =>
    await api<EnergyOverviewResponse>(
      `/api/energy/sites/${siteId}/overview?days=${days}`,
      {
        method: "GET",
        handle403Redirect: false,
      }
    ),

  getEnergyMeters: async (
    siteId: string
  ): Promise<EnergyMeterSummaryDto[]> =>
    await api<EnergyMeterSummaryDto[]>(
      `/api/energy/sites/${siteId}/meters`,
      {
        method: "GET",
        handle403Redirect: false,
      }
    ),

  getEnergyTrend: async (
    siteId: string,
    days = 7
  ): Promise<EnergyTrendPointDto[]> =>
    await api<EnergyTrendPointDto[]>(
      `/api/energy/sites/${siteId}/trend?days=${days}`,
      {
        method: "GET",
        handle403Redirect: false,
      }
    ),

  getEnergyMeterTelemetry: async (
    siteId: string,
    energyMeterId: string,
    limit = 200
  ): Promise<EnergyTelemetryPointDto[]> =>
    await api<EnergyTelemetryPointDto[]>(
      `/api/energy/sites/${siteId}/meters/${energyMeterId}/telemetry?limit=${limit}`,
      {
        method: "GET",
        handle403Redirect: false,
      }
    ),

  createEnergyMeter: async (
    siteId: string,
    req: EnergyMeterCreateRequest
  ): Promise<EnergyMeterDetailDto> =>
    await api<EnergyMeterDetailDto>(
      `/api/energy/sites/${siteId}/meters`,
      {
        method: "POST",
        body: JSON.stringify({
          ...req,
          siteId,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        handle403Redirect: false,
      }
    ),

  getEnergyMeterDetail: async (
    siteId: string,
    energyMeterId: string
  ): Promise<EnergyMeterDetailDto> =>
    await api<EnergyMeterDetailDto>(
      `/api/energy/sites/${siteId}/meters/${energyMeterId}`,
      {
        method: "GET",
        handle403Redirect: false,
      }
    ),

  updateEnergyMeter: async (
    siteId: string,
    energyMeterId: string,
    req: EnergyMeterUpdateRequest
  ): Promise<EnergyMeterDetailDto> =>
    await api<EnergyMeterDetailDto>(
      `/api/energy/sites/${siteId}/meters/${energyMeterId}`,
      {
        method: "PUT",
        body: JSON.stringify(req),
        headers: {
          "Content-Type": "application/json",
        },
        handle403Redirect: false,
      }
    ),

  deactivateEnergyMeter: async (
    siteId: string,
    energyMeterId: string
  ): Promise<void> =>
    await api<void>(
      `/api/energy/sites/${siteId}/meters/${energyMeterId}`,
      {
        method: "DELETE",
        handle403Redirect: false,
      }
    ),

  upsertEnergyPointMapping: async (
    siteId: string,
    energyMeterId: string,
    req: EnergyPointMappingRequest
  ): Promise<EnergyPointMappingDto> =>
    await api<EnergyPointMappingDto>(
      `/api/energy/sites/${siteId}/meters/${energyMeterId}/point-mappings`,
      {
        method: "POST",
        body: JSON.stringify({
          ...req,
          energyMeterId,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        handle403Redirect: false,
      }
    ),

  getEnergyPointMappings: async (
    siteId: string,
    energyMeterId: string
  ): Promise<EnergyPointMappingDto[]> =>
    await api<EnergyPointMappingDto[]>(
      `/api/energy/sites/${siteId}/meters/${energyMeterId}/point-mappings`,
      {
        method: "GET",
        handle403Redirect: false,
      }
    ),

  deleteEnergyPointMapping: async (
    siteId: string,
    energyMeterId: string,
    mappingId: string
  ): Promise<void> =>
    await api<void>(
      `/api/energy/sites/${siteId}/meters/${energyMeterId}/point-mappings/${mappingId}`,
      {
        method: "DELETE",
        handle403Redirect: false,
      }
    ),
};