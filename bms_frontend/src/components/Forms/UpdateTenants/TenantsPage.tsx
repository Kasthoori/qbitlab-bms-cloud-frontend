import { type Page, type TenantDto } from "@/api/bms"
import { useEffect, useState, type FC } from "react";
import { useNavigate } from "react-router-dom";
import BmsCard from "./BmsCard";
import { api } from "@/api/http";

const TenantsPage:FC = () => {

    const nav = useNavigate();
    const [tenants, setTenants] = useState<TenantDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let alive = true;

        (async () => {
            try {
                 setLoading(true);
                 setError(null);
                 const page = await api<Page<TenantDto>>("/api/tenants/search");

                 if (!alive) return;
                 setTenants(page.content);
                 console.log("Fetched tenants:", page);

            }catch (e: unknown) {
                if (!alive) return;
                setError(e instanceof Error ? e.message : "An unknown error occurred");
            }finally {
                if (alive) setLoading(false);
            }

        })();

        return () => {
            alive = false;
        };
    }, []);

    return (
        <div className="p-6">
            <div className="mb-5">
                <h1 className="text-2xl font-bold text-slate-900">Tenants</h1>
                <p className="mt-1 text-slate-600">Tenants you own / have access to</p>
            </div>

            {loading && <p className="text-slate-600">Loading...</p>}
            {error && <p className="text-red-600 whitespace-pre-wrap">Error: {error}</p>}

            {!loading && !error && tenants.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                    <div className="font-semibold text-slate-900">No Tenants Found</div>
                    <div className="mt-1 text-sm text-slate-600">
                        Create a tenant or ask admin to assign access
                    </div>
                </div>
            )}

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {tenants.map((t) => {
                    const title = t.tenantName ?? t.name ?? "Unnamed Tenant";

                    return (
                        <BmsCard 
                            key={t.tenantId}
                            title={title}
                            subtitle={`Tenant ID: ${t.tenantId}`}
                            meta={t.createdAt ? `Created: ${new Date(t.createdAt).toLocaleString()}` : undefined}
                            badge="Open"
                            onClick={() => nav(`/admin/tenants/query/${t.tenantId}/sites`)}
                        />
                    );
                })}
            </div>
        </div>
    );


}

export default TenantsPage;