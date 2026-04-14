/* eslint-disable @typescript-eslint/no-explicit-any */
import { BmsApi, type TenantDto } from "@/api/bms";
import { useEffect, useMemo, useState, type FC } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Plus, Sparkles } from "lucide-react";

import BmsCard from "./BmsCard";
import AddSiteModal from "./AddSiteModal";
import UpdateTenantModel from "./UpdateTenantModel";
import ConfirmDeleteTenantModal from "./ConfirmDeleteTenantModel";

const TenantsPage: FC = () => {
  const nav = useNavigate();

  const [tenants, setTenants] = useState<TenantDto[]>([]);
  const [loading, setLoading] = useState(true);

  const [addSiteTenantId, setAddSiteTenantId] = useState<string>("");
  const [addSiteTenantTitle, setAddSiteTenantTitle] = useState<string>("");

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
    try {
      if (tenants.length === 0) setLoading(true);
      else setRefreshing(true);

      const data = await BmsApi.getMyTenants();

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
  };

  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cards = useMemo(() => tenants ?? [], [tenants]);

  const openAddSite = (t: TenantDto) => {
    setAddSiteTenantId(t.tenantId);
    setAddSiteTenantTitle(t.tenantName ?? t.name ?? "Unnamed Tenant");
  };

  const openEditTenant = async (t: TenantDto) => {
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
  };

  const closeAddSite = () => {
    setAddSiteTenantId("");
    setAddSiteTenantTitle("");
  };

  const handleOpenDeleteTenant = (t: TenantDto) => {
    setDeleteTenantId(t.tenantId);
    setDeleteTenantName(t.tenantName ?? t.name ?? "");
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

      await BmsApi.deleteTenant(deleteTenantId);
      setDeleteSuccess(true);

      await refetch();

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

  if (loading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-slate-300 backdrop-blur-xl">
        Loading tenants...
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-slate-300 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Building2 className="h-6 w-6 text-blue-300" />
          <div>
            <h2 className="text-xl font-semibold text-white">No tenants found</h2>
            <p className="mt-1 text-sm text-slate-400">
              Create your first tenant to begin building setup.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">
                <Sparkles className="h-4 w-4" />
                Tenant Workspace
              </div>

              <h1 className="mt-3 text-3xl font-bold text-white">
                Manage Tenants
              </h1>

              <p className="mt-2 max-w-2xl text-slate-400">
                View tenant accounts, open sites, add new sites, and manage tenant records
                with the same AI-ready glass experience used across QbitLab BMS.
              </p>
            </div>

            <button
              type="button"
              onClick={() => nav("/onboarding")}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 px-5 py-3 text-sm font-semibold text-white transition hover:scale-[1.02]"
            >
              <Plus className="h-4 w-4" />
              New Tenant Setup
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-3">
          {cards.map((t) => {
            const tenantTitle = t.tenantName ?? t.name ?? "Unnamed Tenant";
            const created =
              (t as any).createdAt
                ? new Date((t as any).createdAt).toLocaleString()
                : "Not available";

            return (
              <BmsCard
                key={t.tenantId}
                title="Tenant"
                subtitle={tenantTitle}
                meta={`Tenant ID: ${t.tenantId}\nCreated: ${created}`}
                badge="Active"
                actions={[
                  {
                    label: "View Sites",
                    variant: "secondary",
                    onClick: () => nav(`/admin/tenants/query/${t.tenantId}/sites`),
                  },
                  {
                    label: "Add Site",
                    variant: "primary",
                    onClick: () => openAddSite(t),
                  },
                  {
                    label: "Edit",
                    variant: "primary",
                    onClick: () => openEditTenant(t),
                  },
                  {
                    label: "Delete",
                    variant: "danger",
                    onClick: () => handleOpenDeleteTenant(t),
                  },
                ]}
              />
            );
          })}
        </div>
      </div>

      <AddSiteModal
        open={!!addSiteTenantId}
        tenantId={addSiteTenantId}
        tenantTitle={addSiteTenantTitle}
        onClose={closeAddSite}
        onCreated={refetch}
      />

      {selectedTenant && (
        <UpdateTenantModel
          open={openUpdateTenant}
          tenantId={selectedTenant.tenantId}
          tenantTitle={selectedTenant.tenantName ?? selectedTenant.name}
          onClose={closeEditTenant}
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
  );
};

export default TenantsPage;