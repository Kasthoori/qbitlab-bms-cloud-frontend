import { BmsApi, type HvacDto } from "@/api/bms";
import { useCallback, useEffect, useState, type FC } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BmsCard from "./BmsCard";

const HvacsPages:FC = () => {

    const nav = useNavigate();
    const { tenantId, siteId } = useParams<{tenantId: string, siteId: string}>();

    const [hvacs, setHvacs] = useState<HvacDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);


    const loadHvacs = useCallback( async () => {

        if (!tenantId || !siteId) return;

        try {

            setLoading(true);
            setError(null);

            const data = await BmsApi.getHvacsByTenantSite(tenantId, siteId);
            setHvacs(Array.isArray(data) ? data : []);

        } catch (e: unknown) {

            setError(e instanceof Error ? e.message : "An error occurred loading hvacs");

        } finally {

           setLoading(false);
        }
    }, [tenantId, siteId]);

    useEffect(() =>  {
        void loadHvacs();
       
    }, [loadHvacs]);

    const onDeleteHvac = useCallback( async (h: HvacDto) => {

        if (!tenantId || !siteId) return;
        
        const name = h.hvacName ?? h.name ?? h.hvacId;
        const ok = window.confirm(`Delete HVAC "${name}"?`);

        if (!ok) return;

        try {

            setDeletingId(h.hvacId);
            await BmsApi.deleteHvac(tenantId, siteId, h.hvacId);
            await loadHvacs();

        } catch (e: unknown) {
            alert(e instanceof Error ? e.message : "Delete failed");

        } finally {
           setDeletingId(null);
        }

    }, [tenantId, siteId, loadHvacs]);


    return (
        <div className="p-6">
            <div className="mb-4 flex items-center gap-3">
                <button
                    className="rounded-xl border px-4 py-2 text-slate-700 hover:bg-slate-50"
                    onClick={() => nav(`/admin/tenants/query/${tenantId}/sites`)}
                >
                    ← Back
                </button>
            </div>

            <div className="mb-5">
                <h1 className="text-2xl font-bold text-slate-900">HVAC Units</h1>
                <p className="mt-1 text-slate-600">
                <b>Tenant:</b> {tenantId} • <b>Site:</b> {siteId}
                </p>
             </div>

             {loading && <div className="text-slate-600">Loading HVAC units....</div>}
             {error && <div className="text-red-600 whitespace-pre-wrap">{error}</div>}

             {!loading && !error && hvacs.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                    <div className="font-semibold text-slate-900">No HVAC units found</div>
                    <div className="mt-1 text-sm text-slate-600">Onboard an HVAC under this site.</div>
                </div>
             )}

             <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {hvacs.map((h) => {
                    // const title = h.hvacName ?? h.name ?? "Unnamed HVAC";
                    const meta = [
                        h.hvacId ? `HVAC ID: ${h.hvacId}` : "HVAC ID: —",
                        h.status ? `Status: ${h.status}` : null,
                        h.lastSeenAt ? `Last seen: ${new Date(h.lastSeenAt).toLocaleDateString()}` : null,
                        typeof h.temperature === "number" ? `Temp: ${h.temperature}°C` : null,
                    ]
                    .filter(Boolean)
                    .join(" • ");

                    return (
                        <BmsCard 
                           key={h.id}
                           title="HVAC"
                           subtitle={h.hvacName}
                           meta={meta}
                           actions={[
                            {
                                label: "Edit",
                                variant: "secondary",
                                onClick: () => nav(`/admin/tenants/${tenantId}/sites/${siteId}/hvacs/${h.id}/edit`),

                            },
                            {
                                label: deletingId === h.id ? "Deleting..." : "Delete",
                                variant: "danger",
                                disabled: deletingId === h.id,
                                onClick: () => onDeleteHvac(h),
                            }
                           ]}
                          
                        />
                    );
                })}
             </div>
        </div>
    );

}

export default HvacsPages;