import type { HvacDeviceMappingDto } from "@/api/bms";
import { BmsButton, BmsCard } from "@/components/UI";
import { Link2, SlidersHorizontal, Trash2 } from "lucide-react";

type Props = {
  mappings: HvacDeviceMappingDto[];
  onUnmap: (mappingId: string) => void;
  onConfigurePoints: (mapping: HvacDeviceMappingDto) => void;
  busy?: boolean;
};

export default function ExistingMappingsPanel({
  mappings,
  onUnmap,
  onConfigurePoints,
  busy = false,
}: Props) {
  return (
    <BmsCard variant="section" className="p-5">
      <div className="mb-5 flex items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200/80">
            Mapping register
          </p>

          <h2 className="mt-1 text-xl font-semibold text-white">
            Existing Mappings
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Review logical-to-device mappings and configure point references.
          </p>
        </div>

        <span className="rounded-full border border-white/10 bg-white/4 px-3 py-1 text-sm font-semibold text-slate-200">
          {mappings.length}
        </span>
      </div>

      {mappings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/4 p-6 text-center text-sm text-slate-400">
          No mappings created yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-white/10">
          <table className="min-w-full border-separate border-spacing-0">
            <thead>
              <tr className="bg-white/4 text-left text-sm text-slate-300">
                <th className="px-4 py-3 font-semibold">Logical HVAC</th>
                <th className="px-4 py-3 font-semibold">Device Name</th>
                <th className="px-4 py-3 font-semibold">
                  External Device ID
                </th>
                <th className="px-4 py-3 font-semibold">Mapped At</th>
                <th className="px-4 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>

            <tbody>
              {mappings.map((mapping, index) => (
                <tr
                  key={mapping.mappingId}
                  className={
                    index % 2 === 0 ? "bg-slate-950/10" : "bg-white/3"
                  }
                >
                  <td className="px-4 py-3 text-sm text-slate-100">
                    <span className="inline-flex items-center gap-2">
                      <Link2 className="h-4 w-4 text-blue-300" />
                      {mapping.hvacName || "Unnamed HVAC"}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-sm text-slate-200">
                    {mapping.unitName || "Unknown device"}
                  </td>

                  <td className="px-4 py-3 text-sm text-slate-400">
                    {mapping.externalDeviceId}
                  </td>

                  <td className="px-4 py-3 text-sm text-slate-400">
                    {mapping.mappedAt
                      ? new Date(mapping.mappedAt).toLocaleString()
                      : "-"}
                  </td>

                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <BmsButton
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => onConfigurePoints(mapping)}
                        disabled={busy}
                      >
                        <SlidersHorizontal className="h-4 w-4" />
                        Configure Points
                      </BmsButton>

                      <BmsButton
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => onUnmap(mapping.mappingId)}
                        disabled={busy}
                      >
                        <Trash2 className="h-4 w-4" />
                        Unmap
                      </BmsButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </BmsCard>
  );
}