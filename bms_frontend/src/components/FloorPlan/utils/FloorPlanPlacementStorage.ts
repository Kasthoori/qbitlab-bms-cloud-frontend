import type { FloorPlanPlacement } from '../types/floorplan.types';

function storageKey(tenantId: string, siteId: string, floorPlanId: string) {
    return `qbitlab-floorplan-${tenantId}-${siteId}-${floorPlanId}`;
}

export function loadPlacements(
    tenantId: string,
    siteId: string,
    floorPlanId: string
): FloorPlanPlacement[] {
   
    try {

        const raw = localStorage.getItem(storageKey(tenantId, siteId, floorPlanId));
        if (!raw) return [];

        const parsed = JSON.parse(raw) as FloorPlanPlacement[];
        return Array.isArray(parsed) ? parsed : [];

    } catch {

        return [];
    }
    
}

export function savePlacements(
    tenantId: string,
    siteId: string,
    floorPlanId: string,
    placements: FloorPlanPlacement[]
) {

    localStorage.setItem(
    storageKey(tenantId, siteId, floorPlanId),
    JSON.stringify(placements)
  );
}