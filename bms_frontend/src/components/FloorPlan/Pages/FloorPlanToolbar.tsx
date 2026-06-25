import type { FC } from "react";
import {
  CheckSquare,
  Fan,
  Layers3,
  MousePointerClick,
  X,
} from "lucide-react";

import { BmsButton, BmsCard } from "@/components/UI";

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
    <BmsCard
      variant="section"
      className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200/80">
          Active layout
        </p>

        <h2 className="mt-1 text-xl font-semibold text-white">
          {floorPlanName ?? "Floor Plan"}
        </h2>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-400">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/4 px-3 py-1">
            <Layers3 className="h-4 w-4 text-blue-300" />
            HVACs Placed: {placedHvacs ?? 0} / {totalHvacs ?? 0}
          </span>

          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-emerald-300">
            <CheckSquare className="h-4 w-4" />
            Active Plan Selected
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {selectedItemName ? (
          <>
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-sm font-medium text-cyan-300">
              <Fan className="h-4 w-4" />
              Selected: {selectedItemName}
            </span>

            <BmsButton
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
            >
              <X className="h-4 w-4" />
              Clear
            </BmsButton>
          </>
        ) : (
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/4 px-3 py-2 text-sm text-slate-400">
            <MousePointerClick className="h-4 w-4 text-blue-300" />
            Select an HVAC from the left panel, then click on the plan
          </span>
        )}
      </div>
    </BmsCard>
  );
};

export default FloorPlanToolbar;