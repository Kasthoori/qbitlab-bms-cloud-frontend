import { api } from "@/api/http";
import type { HvacSiteDetailsDto } from "../types/hvac";

export async function fetchSiteHvacs(
  tenantId: string,
  siteId: string
): Promise<HvacSiteDetailsDto[]> {
  const data = await api<HvacSiteDetailsDto[]>(
    `/api/tenants/${tenantId}/sites/${siteId}/hvacs/details`
  );

  return Array.isArray(data) ? data : [];
}