import type { Key } from "react";
import { api }  from "./http";

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

export type SiteDto = {
    siteId: string;
    siteName: string;
    addressLine1?: string;
    city?: string;
    postcode?: string;
    timezone?: string;

};

export type HvacDto = {
    hvacId: string;
    id?: string;              // optional
    hvacName?: string;
    deviceId?: string;
    protocol?: string;
    unitType?: string;
    name?: string;
    model?: string;
    status?: string;
    lastSeenAt?: string;
    temperature?: number;

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
    protocol: "BACNET" | "MODBUS" | "SIMULATED";
    unitType: "AHU" | "VRF" | "FCU" | "CHILLER" | "OTHER";
};

export const BmsApi = {

    getMyTenants: async () => await api<TenantDto[]>("/api/tenants/search"),
    getSitesByTenant: async (tenantId: string) => await api<SiteDto[]>(`/api/tenants/query/${tenantId}/sites`),
    getHvacsByTenantSite: async (tenantId: string, siteId: string) => await api<HvacDto[]>(`/api/hvacs/query/${tenantId}/sites/${siteId}/hvacs`),
    
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
};