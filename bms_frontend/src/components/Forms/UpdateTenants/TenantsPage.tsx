/* eslint-disable @typescript-eslint/no-explicit-any */
import { BmsApi, type TenantDto } from "@/api/bms"
import { useEffect, useState, type FC } from "react";
import { useNavigate } from "react-router-dom";
import BmsCard from "./BmsCard";
import AddSiteModal from "./AddSiteModal";
import UpdateTenantModel from "./UpdateTenantModel";
import ConfirmDeleteTenantModal from "./ConfirmDeleteTenantModel";


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


    const [openDeleteTenant, setOpenDeleteTenant] = useState(false);
    const [deleteTenantId, setDeleteTenantId] = useState<string>("");
    const [deleteTenantName, setDeleteTenantName] = useState<string>("");
    const [deleteErr, setDeleteErr] = useState<string | null>(null);
    const [deleteSuccess, setDeleteSuccess] = useState(false);
    const [deleting, setDeleting] = useState(false);
        

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


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


    const handleOpenDeleteTenant = (t: TenantDto) => {
        setDeleteTenantId(t.tenantId);
        setDeleteTenantName(t.name ?? "");
        setDeleteErr(null);
        setDeleteSuccess(false);
        setOpenDeleteTenant(true);
    };

    const handleCloseDeleteTenant = () => {
        if (deleting) return;
        setOpenDeleteTenant(false);
        setDeleteTenantId("");
        setDeleteTenantName("");
        setDeleteErr(null);
        setDeleteSuccess(false);
    };

    const confirmDeleteTenant = async () => {
        if (!deleteTenantId) return;

        try {
            setDeleting(true);
            setDeleteErr(null);

            await BmsApi.deleteTenant(deleteTenantId); // ✅ ensure this exists in your api client

            setDeleteSuccess(true);

            // refresh list
            await refetch(); // or refetchTenants() - whatever your function name is

            // auto close after showing success
            setTimeout(() => {
            handleCloseDeleteTenant();
            }, 1200);
        } catch (e: any) {
            const msg =
            e?.response?.data?.message ||
            e?.message ||
            "Failed to delete tenant. Please try again.";
            setDeleteErr(String(msg));
        } finally {
            setDeleting(false);
        }
     };



    return (
        <><div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {tenants.map((t) => {
                const tenantTitle = t.tenantName ?? t.name ?? "Unnamed Tenant";

                return (
                    <BmsCard
                        key={t.tenantId}
                        title="Tenanat"
                        subtitle={tenantTitle}
                        meta={`Tenant ID: ${t.tenantId}`}
                        actions={[
                            {
                                label: "Site",
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
                                onClick: () => handleOpenDeleteTenant(t),
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

           <ConfirmDeleteTenantModal
                open={openDeleteTenant}
                tenantId={deleteTenantId}
                tenantName={deleteTenantName}
                deleting={deleting}
                error={deleteErr}
                success={deleteSuccess}
                onClose={handleCloseDeleteTenant}
                onConfirmDelete={confirmDeleteTenant}
           />
      </>
    )


}

export default TenantsPage;