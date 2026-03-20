export type FloorPlanResponse = {
    id: string;
    name: string;
    siteId: string;
    contentType?: string;
    fileName?: string;
    imageUrl?: string;
};

export type HvacResponse = {
    id: string;
    hvacName: string;
    deviceId: string;
    zone?: string;
    unitType?: string;
    protocol?: string;
}

export type FloorPlanPlacement = {
    itemId: string;
    itemType: "HVAC";
    itemName: string;
    x: number; //percent
    y: number; //percent
    locked: boolean;
}

export type UpsertFloorPlanPlacementRequest = {
  itemId: string;
  itemType: string;
  itemName: string;
  x: number;
  y: number;
  locked: boolean;
};

export type UploadFloorPlanRequest = {
    tenantId: string;
    siteId: string;
    name: string;
    file: File;
}
