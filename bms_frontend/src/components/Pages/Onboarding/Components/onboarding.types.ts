import { z } from "zod";

type UUID = string;

export type TenantResponse = {
  tenantId: UUID;
  name: string;
};

export type SiteResponse = {
  siteId: UUID;
  tenantId: UUID;
  siteName: string;
};

export type HvacResponse = {
  hvacId: UUID;
  siteId: UUID;
  hvacName: string;
  deviceId: string;
};

export const tenantSchema = z.object({
  name: z.string().min(2, "Tenant name is required"),
  country: z.string().min(2, "Country is required"),
  addressLine1: z.string().min(2, "Address line 1 is required"),
  city: z.string().min(2, "City is required"),
  postcode: z.string().min(2, "Postcode is required"),
});

export type TenantFormValues = z.infer<typeof tenantSchema>;

export const siteSchema = z.object({
  siteName: z.string().min(2, "Site name is required"),
  addressLine1: z.string().min(2, "Address line 1 is required"),
  city: z.string().min(2, "City is required"),
  postcode: z.string().min(2, "Post code is required"),
  timezone: z.string().min(2, "Timezone is required"),
});

export type SiteFormValues = z.infer<typeof siteSchema>;

export const hvacSchema = z.object({
  hvacName: z.string().min(2, "HVAC name is required"),
  deviceId: z.string().min(2, "Device ID is required"),
  unitType: z.enum(["AHU", "SPLIT", "VRF", "FAN_COIL", "OTHER"]),
  protocol: z.enum(["BACNET", "MODBUS", "SIMULATOR"]),
  zone: z.string().optional(),
});

export type HvacFormValues = z.infer<typeof hvacSchema>;