/* eslint-disable @typescript-eslint/no-explicit-any */
import { BmsApi, type TenantDto } from "@/api/bms"
import { useEffect, useState, type FC } from "react";
import { useNavigate } from "react-router-dom";
import BmsCard from "./BmsCard";
import AddSiteModal from "./AddSiteModal";
import UpdateTenantModel from "./UpdateTenantModel";


const TenantsPage:FC = () => {

    const nav = useNavigate();
    const [tenants, setTenants] = useState<TenantDto[]>([]);
    const [loading, setLoading] = useState(true);

    //model state
    const [addSiteTenantId, setAddSiteTenantId] = useState<string>("");
    const [addSiteTenantTitle, setAddSiteTenantTitle] = useState<string>("");
    //const [editTenantId, setEditTenantId] = useState<string>("");
    //const [editTenantTitle, setEditTenantTitle] = useState<string>("");

    const [openUpdateTenant, setOpenUpdateTenant] = useState(false);

    const [selectedTenant, setSelectedTenant] = useState<TenantDto | undefined>(undefined);
    const [, setRefreshing] = useState(false);
    

    const refetch = async () => {

        try{
            if (tenants.length === 0) setLoading(true);
            else setRefreshing(true);

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
            setRefreshing(false);
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

   const openEditTenant = async(t: TenantDto) => {
        
            setOpenUpdateTenant(true);
            setSelectedTenant(t);

            try {

                const fullTenant = await BmsApi.getTenantById(t.tenantId);
                setSelectedTenant(fullTenant);

            } catch (e) {

                alert(`Failed to fetch tenant details: ${e instanceof Error ? e.message : ""}`);
                setOpenUpdateTenant(false);
                setSelectedTenant(undefined);

            }
    };

    const closeEditTenant = () => {
       setOpenUpdateTenant(false);
        setSelectedTenant(undefined);
    }    

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
                                onClick: () => {
                                    openEditTenant(t);
                                },
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
            
            <AddSiteModal 
                open={!!addSiteTenantId}
                tenantId={addSiteTenantId}
                tenantTitle={addSiteTenantTitle}
                onClose={closeAddSite}
                onCreated={() => {
                    refetch();
                }}
            />
           {selectedTenant && (
            <UpdateTenantModel 
               open={openUpdateTenant} 
               tenantId={selectedTenant.tenantId} 
               tenantTitle={selectedTenant.tenantName ?? selectedTenant.name}
               onClose={() => closeEditTenant()}
               onCreated={refetch}
               tenant={selectedTenant}
            />
           )}
      </>
    )


}

export default TenantsPage;