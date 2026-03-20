export type FloorPlanPlacement = {
  itemId: string;
  itemType: "HVAC";
  itemName: string;
  x: number; // percentage
  y: number; // percentage
  locked: boolean;
};