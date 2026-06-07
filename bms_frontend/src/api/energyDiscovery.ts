import { api } from "./http";
import type { EnergyMeterDetailDto } from "./energy";

export type DiscoveredEnergyMeterDto = {
  discoveredMeterId: string;

  tenantId: string;
  siteId: string;
  edgeControllerId?: string | null;

  externalDeviceId: string;

  protocol: string;
  deviceIdentifier?: string | null;
  deviceName?: string | null;
  manufacturer?: string | null;
  model?: string | null;
  location?: string | null;

  totalEnergyKwh?: number | null;
  activePowerKw?: number | null;
  voltage?: number | null;
  currentAmp?: number | null;
  powerFactor?: number | null;
  frequencyHz?: number | null;

  online: boolean;
  mapped: boolean;

  lastSeenAt: string;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type MapDiscoveredEnergyMeterRequest = {
  discoveredMeterId: string;

  meterName?: string | null;
  location?: string | null;

  baselinePowerKw?: number | null;
  ratedPowerKw?: number | null;
  costPerKwh?: number | null;
  co2KgPerKwh?: number | null;
};

export const EnergyDiscoveryApi = {
  getDiscoveredMeters: async (
    tenantId: string,
    siteId: string
  ): Promise<DiscoveredEnergyMeterDto[]> =>
    await api<DiscoveredEnergyMeterDto[]>(
      `/api/admin/tenants/${tenantId}/sites/${siteId}/energy/discovered-meters`,
      {
        method: "GET",
        handle403Redirect: false,
      }
    ),

  getUnmappedDiscoveredMeters: async (
    tenantId: string,
    siteId: string
  ): Promise<DiscoveredEnergyMeterDto[]> =>
    await api<DiscoveredEnergyMeterDto[]>(
      `/api/admin/tenants/${tenantId}/sites/${siteId}/energy/discovered-meters/unmapped`,
      {
        method: "GET",
        handle403Redirect: false,
      }
    ),

  mapDiscoveredMeter: async (
    tenantId: string,
    siteId: string,
    req: MapDiscoveredEnergyMeterRequest
  ): Promise<EnergyMeterDetailDto> =>
    await api<EnergyMeterDetailDto>(
      `/api/admin/tenants/${tenantId}/sites/${siteId}/energy/discovered-meters/map`,
      {
        method: "POST",
        body: JSON.stringify(req),
        headers: {
          "Content-Type": "application/json",
        },
        handle403Redirect: false,
      }
    ),
};