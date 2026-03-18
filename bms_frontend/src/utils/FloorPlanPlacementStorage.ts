import type { FloorPlanPlacement } from "../types/floorplan.types";

function buildStorageKey(
  tenantId: string,
  siteId: string,
  floorPlanId: string
) {
  return `floorplan:placements:${tenantId}:${siteId}:${floorPlanId}`;
}

export function loadPlacements(
  tenantId: string,
  siteId: string,
  floorPlanId: string
): FloorPlanPlacement[] {
  try {
    const key = buildStorageKey(tenantId, siteId, floorPlanId);
    const raw = localStorage.getItem(key);

    if (!raw) return [];

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isValidPlacement);
  } catch (error) {
    console.error("Failed to load floor plan placements:", error);
    return [];
  }
}

export function savePlacements(
  tenantId: string,
  siteId: string,
  floorPlanId: string,
  placements: FloorPlanPlacement[]
) {
  try {
    const key = buildStorageKey(tenantId, siteId, floorPlanId);
    localStorage.setItem(key, JSON.stringify(placements));
  } catch (error) {
    console.error("Failed to save floor plan placements:", error);
  }
}

export function clearPlacements(
  tenantId: string,
  siteId: string,
  floorPlanId: string
) {
  try {
    const key = buildStorageKey(tenantId, siteId, floorPlanId);
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Failed to clear floor plan placements:", error);
  }
}

function isValidPlacement(value: unknown): value is FloorPlanPlacement {
  if (!value || typeof value !== "object") return false;

  const item = value as Record<string, unknown>;

  return (
    typeof item.itemId === "string" &&
    item.itemType === "HVAC" &&
    typeof item.itemName === "string" &&
    typeof item.x === "number" &&
    typeof item.y === "number" &&
    typeof item.locked === "boolean"
  );
}