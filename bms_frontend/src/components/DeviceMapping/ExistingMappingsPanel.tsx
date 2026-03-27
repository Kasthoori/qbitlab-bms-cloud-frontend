import type { HvacDeviceMappingDto } from "@/api/bms";

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
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Existing Mappings</h2>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
          {mappings.length}
        </span>
      </div>

      {mappings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
          No mappings created yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0 overflow-hidden rounded-2xl">
            <thead>
              <tr className="bg-slate-100 text-left text-sm text-slate-700">
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
                  className={index % 2 === 0 ? "bg-white" : "bg-slate-50/60"}
                >
                  <td className="px-4 py-3 text-sm text-slate-800">
                    {mapping.hvacName}
                  </td>

                  <td className="px-4 py-3 text-sm text-slate-800">
                    {mapping.unitName || "Unknown device"}
                  </td>

                  <td className="px-4 py-3 text-sm text-slate-600">
                    {mapping.externalDeviceId}
                  </td>

                  <td className="px-4 py-3 text-sm text-slate-600">
                    {mapping.mappedAt
                      ? new Date(mapping.mappedAt).toLocaleString()
                      : "-"}
                  </td>

                  <td className="px-4 py-3 text-right">
                    <button
                      className="rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={() => onUnmap(mapping.mappingId)}
                      disabled={busy}
                    >
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