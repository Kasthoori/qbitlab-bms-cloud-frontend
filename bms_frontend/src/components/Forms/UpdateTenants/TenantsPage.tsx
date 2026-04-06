/* eslint-disable @typescript-eslint/no-explicit-any */
import { BmsApi, type TenantDto } from "@/api/bms"
import { useEffect, useState, type FC } from "react";
import { useNavigate } from "react-router-dom";
import BmsCard from "./BmsCard";
import AddSiteModal from "./AddSiteModal";


const TenantsPage:FC = () => {

    const nav = useNavigate();
    const [tenants, setTenants] = useState<TenantDto[]>([]);
    const [loading, setLoading] = useState(true);

    //model state
    const [addSiteTenantId, setAddSiteTenantId] = useState<string>("");
    const [addSiteTenantTitle, setAddSiteTenantTitle] = useState<string>("");

    const refetch = async () => {

        try{
            setLoading(true);
            const data = await BmsApi.getMyTenants();

            console.log("Get Tenants: ", data);

            const list = 
                    Array.isArray(data) ? data :
                    
                    Array.isArray((data as any)?.data) ? (data as any).data :
                    Array.isArray((data as any)?.content) ? (data as any).content :
                    Array.isArray((data as any)?.tenants) ? (data as any).tenants :
                    [];

                    setTenants(list);

        } catch (e) {

            console.log("Failed to fetch tenants:", e);
            setTenants([]);

        } finally {

            setLoading(false);

        }
    }

    useEffect(() => {
           refetch();     
    }, []);

    const onDeleteTenant = async (t: TenantDto) => {

        const name = t.tenantName ?? t.name ?? t.tenantId;

        const ok = window.confirm(`Delete tenant "${name}"?`);

        if(!ok) return;

        try {
            await BmsApi.deleteTenant(t.tenantId);

        }catch (err: any){
            alert(err instanceof Error ? err.message : "Delete failed");
        }
    };

    const openAddSite = (t: TenantDto) => {

        setAddSiteTenantId(t.tenantId);
        setAddSiteTenantTitle(t.tenantName ?? t.name ?? "Unnamed Tenant");
    };

    const closeAddSite = () => {
        setAddSiteTenantId("");
        setAddSiteTenantTitle("");
    }

    if (loading) {
        return <div className="p-6 text-slate-600">Loading tenants....</div>
    }

    if (tenants.length === 0) {
        return <div className="p-6 text-slate-600">No tenants found</div>
    }



    return (
        <><div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {tenants.map((t) => {
                const tenantTitle = t.tenantName ?? t.name ?? "Unnamed Tenant";

                return (
                    <BmsCard
                        key={t.tenantId}
                        title="Update Information"
                        subtitle={tenantTitle}
                        meta={`Tenant ID: ${t.tenantId}`}
                        actions={[
                            {
                                label: "Sites",
                                variant: "secondary",
                                onClick: () => nav(`/admin/tenants/query/${t.tenantId}/sites`),
                            },
                            {
                                label: "Add Site",
                                variant: "primary",
                                onClick: () => openAddSite(t)
                            },
                            {
                                label: "Edit",
                                variant: "primary",
                                onClick: () => nav(`/admin/tenants/${t.tenantId}/edit`),
                            },
                            {
                                label: "Delete",
                                variant: "danger",
                                onClick: () => onDeleteTenant(t),
                            },
                        ]} />
                );

            })}
        </div>
            // Animated modal
            <AddSiteModal 
                open={!!addSiteTenantId}
                tenantId={addSiteTenantId}
                tenantTitle={addSiteTenantTitle}
                onClose={closeAddSite}
                onCreated={() => {
                    refetch();
                }}
            />
            
      </>
    )


}

export default TenantsPage;