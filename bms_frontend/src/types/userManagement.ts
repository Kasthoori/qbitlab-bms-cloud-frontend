export type UserRole =
  | "ADMIN"
  | "BMS_ADMIN"
  | "TECHNICIAN"
  | "FACILITY_MANAGER";

export interface CreateBmsUserRequest {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  role: UserRole;
  tenantId?: string | null;
  siteIds?: string[];
  notificationEnabled: boolean;
  enabled: boolean;
}

export interface BmsUserResponse {
  id: string;
  keycloakUserId: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  role: UserRole;
  tenantId?: string | null;
  siteIds?: string[];
  notificationEnabled: boolean;
  enabled: boolean;
  createdAt: string;
}