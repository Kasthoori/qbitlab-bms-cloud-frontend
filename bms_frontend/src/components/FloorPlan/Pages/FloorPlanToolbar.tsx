import type { FC } from "react";
import { CheckSquare, Fan, Layers3, MousePointerClick, X } from "lucide-react";

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
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/5 px-5 py-4 shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl">
      <div>
        <h2 className="text-xl font-semibold text-white">
          {floorPlanName ?? "Floor Plan"}
        </h2>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-400">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
            <Layers3 className="h-4 w-4 text-blue-300" />
            HVACs Placed: {placedHvacs ?? 0} / {totalHvacs ?? 0}
          </span>

          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-emerald-300">
            <CheckSquare className="h-4 w-4" />
            Active Plan Selected
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {selectedItemName ? (
          <>
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-sm font-medium text-cyan-300">
              <Fan className="h-4 w-4" />
              Selected: {selectedItemName}
            </span>

            <button
              type="button"
              onClick={onClearSelection}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          </>
        ) : (
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-400">
            <MousePointerClick className="h-4 w-4 text-blue-300" />
            Select an HVAC from the left panel, then click on the plan
          </span>
        )}
      </div>
    </div>
  );
};

export default FloorPlanToolbar;