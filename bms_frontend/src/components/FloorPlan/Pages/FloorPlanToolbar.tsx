import type { FC } from "react";

type FloorPlanToolbarProps = {
  floorPlanName?: string;
  selectedItemName?: string | null;
  totalHvacs?: number;
  placedHvacs?: number;
  onClearSelection?: () => void;
};

const FloorPlanToolbar: FC<FloorPlanToolbarProps> = ({
  floorPlanName,
  selectedItemName,
  totalHvacs,
  placedHvacs,
  onClearSelection,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          {floorPlanName ?? "Floor Plan"}
        </h2>
        <p className="text-sm text-slate-500">
          HVACs Placed: {placedHvacs ?? 0} / {totalHvacs ?? 0}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {selectedItemName ? (
          <>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
              Selected: {selectedItemName}
            </span>
            <button
              type="button"
              onClick={onClearSelection}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          </>
        ) : (
          <span className="text-sm text-slate-500">
            Select an HVAC from the left panel, then click on the plan
          </span>
        )}
      </div>
    </div>
  );
};

export default FloorPlanToolbar;