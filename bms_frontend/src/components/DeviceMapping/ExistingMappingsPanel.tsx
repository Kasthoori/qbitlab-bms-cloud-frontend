import type { HvacDeviceMappingDto } from "@/api/bms";
import { Link2, Trash2 } from "lucide-react";

type Props = {
  mappings: HvacDeviceMappingDto[];
  onUnmap: (mappingId: string) => void;
  busy?: boolean;
};

export default function ExistingMappingsPanel({
  mappings,
  onUnmap,
  busy = false,
}: Props) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Existing Mappings</h2>
          <p className="mt-1 text-sm text-slate-400">
            Review current logical-to-device mappings.
          </p>
        </div>

        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm font-semibold text-slate-200">
          {mappings.length}
        </span>
      </div>

      {mappings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-center text-sm text-slate-400">
          No mappings created yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-white/10">
          <table className="min-w-full border-separate border-spacing-0">
            <thead>
              <tr className="bg-white/5 text-left text-sm text-slate-300">
                <th className="px-4 py-3 font-semibold">Logical HVAC</th>
                <th className="px-4 py-3 font-semibold">Device Name</th>
                <th className="px-4 py-3 font-semibold">External Device ID</th>
                <th className="px-4 py-3 font-semibold">Mapped At</th>
                <th className="px-4 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {mappings.map((mapping, index) => (
                <tr
                  key={mapping.mappingId}
                  className={index % 2 === 0 ? "bg-slate-950/10" : "bg-white/5"}
                >
                  <td className="px-4 py-3 text-sm text-slate-100">
                    <span className="inline-flex items-center gap-2">
                      <Link2 className="h-4 w-4 text-blue-300" />
                      {mapping.hvacName}
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
                    <button
                      className="inline-flex items-center gap-2 rounded-2xl bg-rose-500/90 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={() => onUnmap(mapping.mappingId)}
                      disabled={busy}
                    >
                      <Trash2 className="h-4 w-4" />
                      Unmap
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}