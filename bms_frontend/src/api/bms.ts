import { api }  from "./http";

export type TenantDto = {
    tenantName: string;
    id: Key | null | undefined;
    createdAt: any;
    tenantId: string;
    name: string;
    // tenantName?: string;
    // name?: string;
    // createdAt?: string;
}

export type SiteDto = {
    id: string;
    siteName: string;
    addressLine1?: string;
    city?: string;
    postcode?: string;
    timezone?: string;

}

export type HvacDto = {
    id: string;
    hvacName?: string;
    name?: string;
    model?: string;
    status?: string;
    lastSeenAt?: string;
    temperature?: number;

}

export type Page<T> = {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number; // Page index
    size: number;

}

export const BmsApi = {

    getMyTenants: () => api<TenantDto[]>("/api/tenants/search"),

};