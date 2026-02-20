import { type SiteDto } from "@/api/bms";
import { api } from "@/api/http";
import {useEffect, useState, type FC } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BmsCard from "./BmsCard";
import AddHvacModal from "./AddHvacModal";
import UpdateSiteModel from "./UpdateSiteModel";

const SitesPage:FC = () => {

    const nav = useNavigate();

    const { tenantId} = useParams<{ tenantId: string}>();

    const [sites, setSites] = useState<SiteDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);


    const [openAddHvac, setOpenAddHvac] = useState(false);
    const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
    const [selectedSiteTitle, setSelectedSiteTitle] = useState<string>();

    const [openUpdateSite, setOpenUpdateSite] = useState(false);


    const loadSites = async () => {

        if (!tenantId) return;

        setLoading(true);
        setError(null);

        try {
            const data = await api<SiteDto[]>(`/api/tenants/query/${tenantId}/sites`);

            setSites(Array.isArray(data) ? data : []);

        } catch (e: unknown) {

            setError(e instanceof Error ? e.message : "An unknown error occurred");
            setSites([]);

        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
         loadSites();    
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tenantId]);

    const onDeleteSite = async (s: SiteDto) => {
        const ok = window.confirm(`Delete site "${s.siteName}"?`);

        if (!ok) return;

        try {

            await api<void>(`/api/sites/${s.siteId}`, {method: "DELETE"});
            await loadSites();

        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : "Delete failed");
        }
    }

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
                <p className="mt-1 text-slate-600"><b>Tenant:</b> {tenantId}</p>
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
                        key={s.siteId}
                        title="Sites"
                        subtitle={s.siteName}
                        meta={[
                            [s.addressLine1, s.city, s.postcode].filter(Boolean).join(", "),
                            s.timezone ? `Timezone: ${s.timezone}` : null,
                            `Site ID: ${s.siteId}`,
                        ]
                        .filter(Boolean)
                        .join("\n")}
                        actions={[
                            {
                                label: "HVACs",
                                variant: "secondary",
                                onClick: () => nav(`/admin/tenants/query/${tenantId}/sites/${s.siteId}/hvacs`),
                            },
                            {
                                label: "Add HVAC",
                                variant: "secondary",
                                onClick: () => {
                                    setSelectedSiteId(s.siteId);
                                    setSelectedSiteTitle(s.siteName);
                                    setOpenAddHvac(true);
                                },
                            },
                            {
                                label: "Edit",
                                variant: "primary",
                                onClick: () => {
                                    setSelectedSiteId(s.siteId);
                                    setSelectedSiteTitle(s.siteName);
                                    setOpenUpdateSite(true);
                                },
                            },
                            {
                                label: "Delete",
                                variant: "danger",
                                onClick: () => onDeleteSite(s),
                            },
                           
                        ]}
                        
                        //onClick={() => nav(`/admin/tenants/query/${tenantId}/sites/${s.siteId}/hvacs`)}
                    />
                ))}

                <AddHvacModal
                    open={openAddHvac}
                    tenantId={tenantId!}
                    siteId={selectedSiteId!}
                    siteTitle={selectedSiteTitle}
                    onClose={() => setOpenAddHvac(false)}
                    onCreated={loadSites}
                />

                <UpdateSiteModel 
                    open={openUpdateSite}
                    siteId={selectedSiteId!}
                    siteName={selectedSiteTitle || ""}
                    tenantId={tenantId!}
                    onClose={() => setOpenUpdateSite(false)}
                    onCreated={loadSites}
                />
            </div>
        </div>
    );

}

export default SitesPage;