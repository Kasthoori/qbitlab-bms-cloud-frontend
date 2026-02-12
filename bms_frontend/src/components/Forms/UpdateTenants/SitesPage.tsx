import type { SiteDto } from "@/api/bms";
import { api } from "@/api/http";
import {useEffect, useState, type FC } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BmsCard from "./BmsCard";

const SitesPage:FC = () => {

    const nav = useNavigate();

    const { tenantId} = useParams<{ tenantId: string}>();

    const [sites, setSites] = useState<SiteDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);


    useEffect(() => {

        let alive = true;

        (async () => {
            try {

                setLoading(true);
                setError(null);

                const data = await api<SiteDto[]>(`/api/tenants/query/${tenantId}/sites`);
                if (!alive) return;
                setSites(data);
                console.log("Fetched sites:", data);


            }catch (e: unknown) {

                if (!alive) return;
                setError(e instanceof Error ? e.message : "An unknown error occurred");

            } finally {

                if (!alive) setLoading(false);
            }
        })();

        return () => {
            alive = false;
        };

        
    }, [tenantId]);

    return (
        <div className="p-6">
            <div className="mb-4 flex items-center gap-3">
                <button
                    className="rounded-xl border px-4 py-2 text-slate-700 hover:bg-slate-50"
                    onClick={() => nav("/admin/update-tenant")}
                >
                    ← Back
                </button>
            </div>

            <div className="mb-5">
                <h1 className="text-2xl font-bold text-slate-900">Sites</h1>
                <p className="mt-1 text-slate-600">Tenant: {tenantId}</p>
            </div>

            {loading && <p className="text-slate-600">Loading Sites.....</p>}
            {error && <p className="text-red-600 whitespace-pre-wrap">{error}</p>}

            {!loading && !error && sites.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                    <div className="font-semibold text-slate-600">No sites found for this tenant.</div>
                    <div className="mt-1 text-sm text-slate-600">Create a site under this tenant.</div>
                </div>
            )}

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {sites.map((s) => (
                    <BmsCard 
                        key={s.id}
                        title={s.siteName}
                        subtitle={[s.addressLine1, s.city, s.postcode].filter(Boolean).join(",")}
                        meta={s.timezone ? `Timezone: ${s.timezone}` : undefined}
                        badge="HVACs"
                        onClick={() => nav(`/tenants/${tenantId}/sites/${s.id}/hvacs`)}
                    />
                ))}
            </div>
        </div>
    );

}

export default SitesPage;