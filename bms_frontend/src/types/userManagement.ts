export type UserRole =
  | "ADMIN"
  | "BMS_ADMIN"
  | "TECHNICIAN"
  | "FACILITY_MANAGER";

export type CreateBmsUserRequest = {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  role: UserRole;
  tenantId?: string | null;
  siteId?: string | null;
  notificationEnabled: boolean;
  enabled: boolean;
};

export type UpdateBmsUserRequest = {
  username: string;
  email: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  role: UserRole;
  tenantId?: string | null;
  siteId?: string | null;
  notificationEnabled: boolean;
  enabled: boolean;
};

export type BmsUserResponse = {
  id: string;
  keycloakUserId: string;
  username: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  role: UserRole;
  tenantId?: string | null;
  siteId?: string | null;
  notificationEnabled: boolean;
  enabled: boolean;
  createdAt: string;
};