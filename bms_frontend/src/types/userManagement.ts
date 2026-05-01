export type UserRole =
  | "ADMIN"
  | "BMS_ADMIN"
  | "TECHNICIAN"
  | "FACILITY_MANAGER"
  | "MANAGER"
  | "SITE_MANAGER";

export interface CreateBmsUserRequest {
  username: string;
  email: string;
  phoneNumber?: string;
  password: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  role: UserRole;
  tenantIds: string[];
  sites: {
    tenantId: string;
    siteId: string;
  }[];
  notificationEnabled: boolean;
  enabled: boolean;
}

export interface BmsUserResponse {
  id: string;
  keycloakUserId: string;
  username: string;
  email: string;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  role: UserRole;
  tenantIds: string[];
  sites: {
    tenantId: string;
    siteId: string;
  }[];
  notificationEnabled: boolean;
  enabled: boolean;
  createdAt: string;
}