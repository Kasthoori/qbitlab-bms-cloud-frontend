import type { Key } from "react";
import { api }  from "./http";
import { BACKEND_URL as API_BASE_URL } from "@/utils/config";
import type { BmsUserResponse, CreateBmsUserRequest } from "@/types/userManagement";

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

export type HvacFloorPlanDetailsDto = {
  hvacId: string;
  tenantId?: string;
  siteId?: string;

  hvacName?: string;
  unitName?: string;
  unitType?: string;
  protocol?: string;

  externalDeviceId?: string;

  temperature?: number | null;
  setpoint?: number | null;
  onState?: boolean | null;
  fanSpeed?: number | null;
  flowRate?: number | null;
  fault?: boolean | null;

  online?: boolean | null;
  telemetryTime?: string;
  lastSeenAt?: string;

  manufacturer?: string;
  model?: string;

  status?: string;
};

export type SiteDto = {
    siteId: string;
    siteName: string;
    addressLine1?: string;
    city?: string;
    postcode?: string;
    timezone?: string;

};

export type FloorPlanPlacementDto = {
    itemId: string;
    itemType: "HVAC",
    itemName: string;
    x: number;
    y: number;
    locked: boolean;
}

export type DiscoveredHvacDeviceDto = {
  discoveredDeviceId?: string;
  externalDeviceId: string;

  tenantId: string;
  siteId: string;

  protocol?: string;
  deviceIdentifier?: string;
  deviceName?: string;
  model?: string;
  manufacturer?: string;

  lastSeenAt?: string;
  online?: boolean;

  powerState?: string;
  mode?: string;
  ambientTemperature?: number | null;
  setpointTemperature?: number | null;
};

export type HvacDeviceMappingDto = {
  mappingId: string;
  tenantId: string;
  siteId: string;
  hvacId: string;
  hvacName: string;
  externalDeviceId: string;
  unitName: string;
  mappedAt: string;
};

export type CreateHvacDeviceMappingRequest = {
  hvacId: string;
  externalDeviceId: string;
};

export type HvacDto = {
  hvacId: string;
  tenantId?: string;
  siteId?: string;

  hvacName?: string;
  name?: string;
  unitName?: string;
  unitType?: string;
  zone?: string;

  externalDeviceId?: string;
  deviceId?: string;

  mapped?: boolean;
  protocol?: string;
  manufacturer?: string;
  model?: string;

  temperature?: number | null;
  setpoint?: number | null;
  onState?: boolean | null;
  fanSpeed?: number | null;
  flowRate?: number | null;
  fault?: boolean | null;

  telemetryTime?: string;
  online?: boolean | null;
  lastSeenAt?: string;

  status?: string;
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
    protocol: "BACNET" | "MODBUS" | "SIMULATOR";
    unitType: "AHU" | "VRF" | "FCU" | "CHILLER" | "OTHER";
};

export type CurrentUserDto = {
  keycloakUserId: string;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  roles: string[];
};


export type FloorPlanDto = {
    floorPlanId?: string;
    id?: string;
    name: string;
    siteId?: string;
    storagePath?: string;
    contentType?: string;
    originalFileName?: string;
    createdAt?: string;
};

export type FloorPlanUploadResponse = {
    floorPlanId?: string;
    id?: string;
    name: string;
    siteId?: string;
    storagePath?: string;
    contentType?: string;
    originalFileName?: string;
    createdAt?: string;
};

export type UpdateFloorPlanRequest = {
    name: string;
};

export type UpsertFloorPlanPlacementRequest = {
  itemId: string;
  itemType: "HVAC";
  itemName: string;
  x: number;
  y: number;
  locked: boolean;
};

export type CreateTechnicianRequest = {
  keycloakUserId: string;
  email: string;
  displayName: string;
  tenantIds: string[];
  sites: TechnicianSiteAccessRequest[];
};

export type TechnicianSiteAccessRequest = {
  tenantId: string;
  siteId: string;
};

export type TechnicianAccessRequest = {
  tenantIds: string[];
  sites: TechnicianSiteAccessRequest[];
};

// Maintenance Note Types and Interfaces

export type HvacMaintenanceNoteType =
  | "SCHEDULED_MAINTENANCE"
  | "FAILURE_REPAIR";

export type HvacMaintenanceNoteStatus =
  | "SUBMITTED"
  | "REVIEWED";

export type HvacMaintenanceNoteDto = {
  noteId: string;
  tenantId: string;
  siteId: string;
  externalDeviceId: string;

  noteType: HvacMaintenanceNoteType;
  status: HvacMaintenanceNoteStatus;

  workDone?: string | null;
  filterChanged?: boolean;
  serviceDone?: boolean;

  failureCause?: string | null;
  correctiveAction?: string | null;
  sparePartsAdded?: string | null;
  machineRestartedAt?: string | null;

  technicianName?: string | null;
  technicianUserId?: string | null;

  reviewedByUserId?: string | null;
  reviewedAt?: string | null;

  createdAt: string;
  updatedAt: string;
};

export type CreateHvacMaintenanceNoteRequest = {
  noteType: HvacMaintenanceNoteType;

  workDone?: string;
  filterChanged?: boolean;
  serviceDone?: boolean;

  failureCause?: string;
  correctiveAction?: string;
  sparePartsAdded?: string;
  machineRestartedAt?: string;

  technicianName?: string;
};


// ============= Simulator HVAC Types =============

export type SimulatorHvacProtocol = "SIMULATOR" | "BACNET" | "MODBUS";

export type SimulatorHvacDto = {
  id: string;

  tenantId: string;
  siteId: string;

  hvacId?: string | null;
  edgeControllerId?: string | null;

  externalDeviceId: string;
  unitName: string;
  unitType?: string | null;
  zone?: string | null;

  protocol: SimulatorHvacProtocol | string;

  temperature?: number | null;
  setpoint?: number | null;
  onState?: boolean | null;
  fanSpeed?: number | null;
  flowRate?: number | null;
  fault?: boolean | null;
  enabled?: boolean | null;

  createdAt?: string | null;
  updatedAt?: string | null;
};

export type CreateSimulatorHvacRequest = {
  hvacId?: string | null;
  edgeControllerId?: string | null;

  externalDeviceId: string;
  unitName: string;
  unitType?: string;
  zone?: string;
  protocol?: SimulatorHvacProtocol | string;

  temperature?: number;
  setpoint?: number;
  onState?: boolean;
  fanSpeed?: number;
  flowRate?: number;
  fault?: boolean;
  enabled?: boolean;
};

export type UpdateSimulatorHvacRequest = {
  hvacId?: string | null;
  edgeControllerId?: string | null;

  unitName: string;
  unitType?: string;
  zone?: string;
  protocol?: SimulatorHvacProtocol | string;

  temperature?: number;
  setpoint?: number;
  onState?: boolean;
  fanSpeed?: number;
  flowRate?: number;
  fault?: boolean;
  enabled?: boolean;
};


// ============= HVAC Command Types =============

// Used by BMS_ADMIN to send commands to Simulator / BACnet / Modbus
export type HvacCommandType =
  | "SET_ON_OFF"
  | "SET_SETPOINT"
  | "SET_FAN_SPEED"
  | "SET_FLOW_RATE"
  | "SET_AMBIENT_TEMP"
  | "CLEAR_FAULT"
  | "RESTART_HVAC"
  | "SIMULATE_FAULT";

export type CreateHvacCommandRequest = {
  edgeControllerId: string;
  hvacId: string;
  externalDeviceId: string;
  protocol: string;
  commandType: HvacCommandType;
  payload: Record<string, unknown>;
};

export type EdgeCommandResponse = {
  commandId: string;
  tenantId: string;
  siteId: string;
  edgeControllerId?: string;
  hvacId: string;
  externalDeviceId: string;
  protocol: string;
  commandType: HvacCommandType | string;
  payload: Record<string, unknown>;

  status?: string;
  createdAt?: string;
  deliveredAt?: string | null;
  executedAt?: string | null;
  errorMessage?: string | null;
};

export type SiteEdgeAssignmentResponse = {
  assignmentId: string;
  edgeControllerId: string;
  edgeKey: string;
  edgeName: string;
  status: string;
  tenantId: string;
  siteId: string;
};



export const BmsApi = {

    //getMyTenants: async () => await api<Page<TenantDto>>("/api/tenants/search"),
//    getMyTenants: async (page = 0, size = 50) =>
//         await api<Page<TenantDto>>(`/api/tenants/search?page=${page}&size=${size}`),

        getMyTenants: async (page = 0, size = 50) =>
        await api<Page<TenantDto>>(`/api/me/tenants?page=${page}&size=${size}`),

//    getSitesByTenant: async (tenantId: string) =>
//     await api<SiteDto[]>(`/api/tenants/query/${tenantId}/sites`, {
//         method: "GET",
//         handle403Redirect: false,
//     }),

    getSitesByTenant: async (
        tenantId: string,
        page = 0,
        size = 50
        ) =>
        await api<Page<SiteDto>>(
            `/api/tenants/query/${tenantId}/sites?page=${page}&size=${size}`
        ),

    getHvacsByTenantSite: async (tenantId: string, siteId: string) => await api<HvacDto[]>(`/api/hvacs/query/${tenantId}/sites/${siteId}/hvacs`),

    getCurrentUser: async () => await api<CurrentUserDto>("/api/me"),
    getHvacSiteDetails: async (tenantId: string, siteId: string) =>
        await api<HvacDto[]>(
            `/api/tenants/${tenantId}/sites/${siteId}/hvacs/details`
        ),

    getHvacFloorPlanDetails: async (tenantId: string, siteId: string) =>
    await api<HvacFloorPlanDetailsDto[]>(
        `/api/tenants/${tenantId}/sites/${siteId}/hvacs/floor-plan-details`
    ),
    
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


    // ============= Floor Plan APIs =============

    UploadFloorPlan: async (
        tenantId: string,
        siteId: string,
        file: File,
        name: string
    ) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("name", name);

        return await api<FloorPlanUploadResponse>(
            `/api/tenants/${tenantId}/sites/${siteId}/floor-plans`,
            {
                method: "POST",
                body: formData,
            }
        );
    },

    getFloorPlansByTenantSite: async (tenantId: string, siteId: string) => {
        return await api<FloorPlanDto[]>(
            `/api/tenants/${tenantId}/sites/${siteId}/floor-plans`
        );
    },

    getFloorPlanById: async (
        tenantId: string,
        siteId: string,
        floorPlanId: string
    ) => {
        return await api<FloorPlanDto>(
            `/api/tenants/${tenantId}/sites/${siteId}/floor-plans/${floorPlanId}`
        );
    },

    updateFloorPlanMetaData: async (
        tenantId: string,
        siteId: string,
        floorPlanId: string,
        req: UpdateFloorPlanRequest
    ) => {
        return await api<FloorPlanDto>(
            `/api/tenants/${tenantId}/sites/${siteId}/floor-plans/${floorPlanId}`,
            {
                method: "PUT",
                body: JSON.stringify(req),
                headers: { "Content-Type": "application/json" },
            }
        );
    },

     deleteFloorPlan: async (
        tenantId: string,
        siteId: string,
        floorPlanId: string
    ) =>
        await api<void>(
            `/api/tenants/${tenantId}/sites/${siteId}/floor-plans/${floorPlanId}`,
            {
                method: "DELETE",
            }
        ),

    getFloorPlanFileUrl: (
        tenantId: string,
        siteId: string,
        floorPlanId: string
    ) =>
        `${API_BASE_URL}/api/tenants/${tenantId}/sites/${siteId}/floor-plans/${floorPlanId}/file`,


    getFloorPlanPlacements: async (
        tenantId: string,
        siteId: string,
        floorPlanId: string

    ) => {
        return await api<FloorPlanPlacementDto[]>(
            `/api/tenants/${tenantId}/sites/${siteId}/floor-plans/${floorPlanId}/placements`
        );
    },

    // saveFloorPlanPlacements: async (
    //         tenantId: string,
    //         siteId: string,
    //         floorPlanId: string,
    //         placements: FloorPlanPlacementDto[]
    //     ) => {
    //         return await api<FloorPlanPlacementDto[]>(
    //             `/api/tenants/${tenantId}/sites/${siteId}/floor-plans/${floorPlanId}/placements`,
    //             {
    //                 method: "PUT",
    //                 body: JSON.stringify(placements),
    //                 headers: { "Content-Type": "application/json" },
    //             }
    //         );
    //     },
    
   saveFloorPlanPlacements: async (
        tenantId: string,
        siteId: string,
        floorPlanId: string,
        placement: FloorPlanPlacementDto[]
    ) => {
        return await api<FloorPlanPlacementDto>(
            `/api/tenants/${tenantId}/sites/${siteId}/floor-plans/${floorPlanId}/placements`,
            {
                method: "PUT",
                body: JSON.stringify(placement),
                headers: { "Content-Type": "application/json" },
            }

        );
    },

    
    deleteFloorPlanPlacement: async (
            tenantId: string,
            siteId: string,
            floorPlanId: string,
            itemId: string,
            itemType: string
    ) => {
        const query = new URLSearchParams({ itemType }).toString();

        return await api<void>(
        `/api/tenants/${tenantId}/sites/${siteId}/floor-plans/${floorPlanId}/placements/${itemId}?${query}`,
        {
            method: "DELETE",
        }
        );
    },


    //======= Mapping End Points ==============

    getDiscoveredDevices: async (
        tenantId: string,
        siteId: string
    ): Promise<DiscoveredHvacDeviceDto[]> => {
        return await api<DiscoveredHvacDeviceDto[]> (
            `/api/admin/tenants/${tenantId}/sites/${siteId}/hvac-device-mapping/discovered-devices`,
            {
                method: "GET"
            }
        );
    },

    getHvacMappings: async (
        tenantId: string,
        siteId: string
    ): Promise<HvacDeviceMappingDto[]> => {
        return await api<HvacDeviceMappingDto[]>(
            `/api/admin/tenants/${tenantId}/sites/${siteId}/hvac-device-mapping`,
            {
                method: "GET"
            }
        );
    },

    createHvacMapping: async (
        tenantId: string,
        siteId: string,
        body: CreateHvacDeviceMappingRequest
    ): Promise<HvacDeviceMappingDto> => {
        return await api<HvacDeviceMappingDto>(
            `/api/admin/tenants/${tenantId}/sites/${siteId}/hvac-device-mapping`,
            {
                method: "POST",
                body: JSON.stringify(body),
                headers: {
                    "Content-Type": "application/json"
                },
            }
        );
    },

     unmapByMappingId: async (
        tenantId: string,
        siteId: string,
        mappingId: string
    ): Promise<void> => {
        await api<void>(
        `/api/admin/tenants/${tenantId}/sites/${siteId}/hvac-device-mapping/${mappingId}`,
        { method: "DELETE" }
        );
    },

    unmapByHvacId: async (
        tenantId: string,
        siteId: string,
        hvacId: string
    ): Promise<void> => {
        await api<void>(
        `/api/admin/tenants/${tenantId}/sites/${siteId}/hvac-device-mapping/hvac/${hvacId}`,
        { method: "DELETE" }
        );
    },

   createTechnician: async (req: CreateTechnicianRequest): Promise<void> =>
    await api<void>("/api/technicians", {
        method: "POST",
        body: JSON.stringify(req),
        headers: {
            "Content-Type": "application/json",
        },
    }),


    // ============= User Management APIs =============

  createBmsUser: async (req: CreateBmsUserRequest): Promise<BmsUserResponse> =>
    await api<BmsUserResponse>("/api/admin/users", {
      method: "POST",
      body: JSON.stringify(req),
      headers: {
        "Content-Type": "application/json",
      },
    }),


    getBmsUsers: async (
            page = 0,
            size = 20
            ): Promise<Page<BmsUserResponse>> =>
            await api<Page<BmsUserResponse>>(
                `/api/admin/users?page=${page}&size=${size}`
            ),

    getBmsUserById: async (userId: string): Promise<BmsUserResponse> =>
    await api<BmsUserResponse>(`/api/admin/users/${userId}`),

    updateBmsUser: async (
    userId: string,
    req: CreateBmsUserRequest
    ): Promise<BmsUserResponse> =>
    await api<BmsUserResponse>(`/api/admin/users/${userId}`, {
        method: "PUT",
        body: JSON.stringify(req),
        headers: {
        "Content-Type": "application/json",
        },
    }),

    deleteBmsUser: async (userId: string): Promise<void> =>
    await api<void>(`/api/admin/users/${userId}`, {
        method: "DELETE",
    }),


        // ============= HVAC Maintenance Notes APIs =============

    createHvacMaintenanceNote: async (
        tenantId: string,
        siteId: string,
        externalDeviceId: string,
        req: CreateHvacMaintenanceNoteRequest
    ): Promise<HvacMaintenanceNoteDto> => {

         console.log("create note externalDeviceId =", externalDeviceId);

            if (!externalDeviceId || externalDeviceId.trim() === "") {
                throw new Error("externalDeviceId is missing in createHvacMaintenanceNote");
            }

       return await api<HvacMaintenanceNoteDto>(
            `/api/tenants/${tenantId}/sites/${siteId}/hvacs/${externalDeviceId}/maintenance-notes`,
            {
                method: "POST",
                body: JSON.stringify(req),
                headers: {
                    "Content-Type": "application/json",
                },
            }
    )},

    getHvacMaintenanceNotes: async (
        tenantId: string,
        siteId: string,
        externalDeviceId: string,
        noteType?: HvacMaintenanceNoteType | "ALL"
    ): Promise<HvacMaintenanceNoteDto[]> => {
        const query =
            noteType && noteType !== "ALL"
                ? `?noteType=${noteType}`
                : "";

        return await api<HvacMaintenanceNoteDto[]>(
            `/api/tenants/${tenantId}/sites/${siteId}/hvacs/${externalDeviceId}/maintenance-notes${query}`,
            {
                method: "GET",
            }
        );
    },

    reviewHvacMaintenanceNote: async (
        tenantId: string,
        siteId: string,
        externalDeviceId: string,
        noteId: string
    ): Promise<HvacMaintenanceNoteDto> =>
        await api<HvacMaintenanceNoteDto>(
            `/api/tenants/${tenantId}/sites/${siteId}/hvacs/${externalDeviceId}/maintenance-notes/${noteId}/review`,
            {
                method: "PUT",
            }
        ),


    markHvacFailureGone: async (
        tenantId: string,
        siteId: string,
        externalDeviceId: string
        ): Promise<void> =>
        await api<void>(
            `/api/tenants/${tenantId}/sites/${siteId}/hvacs/${externalDeviceId}/mark-failure-gone`,
            {
            method: "PUT",
            }
        ),




    // ============= Simulator HVAC APIs =============

    getSimulatorHvacs: async (
        tenantId: string,
        siteId: string
    ): Promise<SimulatorHvacDto[]> =>
        await api<SimulatorHvacDto[]>(
            `/api/admin/tenants/${tenantId}/sites/${siteId}/simulator-hvacs`,
            {
                method: "GET",
            }
        ),

    getEnabledSimulatorHvacs: async (
        tenantId: string,
        siteId: string
    ): Promise<SimulatorHvacDto[]> =>
        await api<SimulatorHvacDto[]>(
            `/api/admin/tenants/${tenantId}/sites/${siteId}/simulator-hvacs/enabled`,
            {
                method: "GET",
            }
        ),

    createSimulatorHvac: async (
        tenantId: string,
        siteId: string,
        req: CreateSimulatorHvacRequest
    ): Promise<SimulatorHvacDto> =>
        await api<SimulatorHvacDto>(
            `/api/admin/tenants/${tenantId}/sites/${siteId}/simulator-hvacs`,
            {
                method: "POST",
                body: JSON.stringify(req),
                headers: {
                    "Content-Type": "application/json",
                },
            }
        ),

    updateSimulatorHvac: async (
        tenantId: string,
        siteId: string,
        simulatorHvacId: string,
        req: UpdateSimulatorHvacRequest
    ): Promise<SimulatorHvacDto> =>
        await api<SimulatorHvacDto>(
            `/api/admin/tenants/${tenantId}/sites/${siteId}/simulator-hvacs/${simulatorHvacId}`,
            {
                method: "PUT",
                body: JSON.stringify(req),
                headers: {
                    "Content-Type": "application/json",
                },
            }
        ),

    deleteSimulatorHvac: async (
        tenantId: string,
        siteId: string,
        simulatorHvacId: string
    ): Promise<void> =>
        await api<void>(
            `/api/admin/tenants/${tenantId}/sites/${siteId}/simulator-hvacs/${simulatorHvacId}`,
            {
                method: "DELETE",
            }
        ),


    // ============= HVAC Command APIs =============

    createHvacCommand: async (
        tenantId: string,
        siteId: string,
        req: CreateHvacCommandRequest
    ): Promise<EdgeCommandResponse> =>
        await api<EdgeCommandResponse>(
            `/api/admin/tenants/${tenantId}/sites/${siteId}/hvac-commands`,
            {
                method: "POST",
                body: JSON.stringify(req),
                headers: {
                    "Content-Type": "application/json",
                },
            }
        ),

    listHvacCommands: async (
        tenantId: string,
        siteId: string
    ): Promise<EdgeCommandResponse[]> =>
        await api<EdgeCommandResponse[]>(
            `/api/admin/tenants/${tenantId}/sites/${siteId}/hvac-commands`,
            {
                method: "GET",
            }
        ),

    getSiteEdgeAssignment: async (
        tenantId: string,
        siteId: string
    ): Promise<SiteEdgeAssignmentResponse> =>
        await api<SiteEdgeAssignmentResponse>(
            `/api/admin/tenants/${tenantId}/sites/${siteId}/edge-assignment`,
            {
                method: "GET",
            }
    ),


    
};
