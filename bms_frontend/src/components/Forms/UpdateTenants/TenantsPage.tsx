/* eslint-disable @typescript-eslint/no-explicit-any */
import { BmsApi, type TenantDto } from "@/api/bms";
import { useEffect, useMemo, useState, type FC } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Plus, Sparkles } from "lucide-react";

import { BmsButton, BmsEntityCard } from "@/components/UI";

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
  const [selectedTenant, setSelectedTenant] = useState<TenantDto | undefined>(
    undefined
  );
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

      const list = Array.isArray(data)
        ? data
        : Array.isArray((data as any)?.data)
        ? (data as any).data
        : Array.isArray((data as any)?.content)
        ? (data as any).content
        : Array.isArray((data as any)?.tenants)
        ? (data as any).tenants
        : [];

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
      <div className="bms-section">
        <div className="flex items-center gap-3 text-slate-300">
          <Sparkles className="h-5 w-5 text-cyan-300" />
          <span>Loading tenants...</span>
        </div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="bms-section">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/15 bg-slate-900/55 text-cyan-200">
            <Building2 className="h-6 w-6" />
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-100">
              No tenants found
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Create your first tenant to begin building setup.
            </p>
          </div>
        </div>

        <div className="mt-5">
          <BmsButton variant="primary" onClick={() => nav("/onboarding")}>
            <Plus className="h-4 w-4" />
            New Tenant Setup
          </BmsButton>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bms-dashboard-bg bms-dashboard-shell space-y-6">
        <section className="bms-dashboard-hero">
         <div className="bms-dashboard-hero-content">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
                <Sparkles className="h-4 w-4" />
                Tenant Workspace
              </div>

              <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-100">
                Manage Tenants
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                View tenant accounts, open sites, add new sites, and manage
                tenant records with the same AI-ready glass experience used
                across QbitLabs BMS.
              </p>
            </div>

            <BmsButton
              variant="primary"
              size="lg"
              onClick={() => nav("/onboarding")}
            >
              <Plus className="h-4 w-4" />
              New Tenant Setup
            </BmsButton>
          </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-3">
          {cards.map((t) => {
            const tenantTitle = t.tenantName ?? t.name ?? "Unnamed Tenant";
            const created = (t as any).createdAt
              ? new Date((t as any).createdAt).toLocaleString()
              : "Not available";

            return (
              <BmsEntityCard
                key={t.tenantId}
                eyebrow="Tenant"
                title={tenantTitle}
                icon={<Building2 className="h-5 w-5" />}
                statusLabel="Active"
                status="active"
                meta={
                  <div className="space-y-1">
                    <p>
                      <span className="text-slate-500">Tenant ID:</span>{" "}
                      <span className="break-all text-slate-300">
                        {t.tenantId}
                      </span>
                    </p>
                    <p>
                      <span className="text-slate-500">Created:</span>{" "}
                      <span className="text-slate-300">{created}</span>
                    </p>
                  </div>
                }
                helperText="AI-ready tenant workspace"
                actions={[
                  {
                    label: (
                      <>
                        View Sites <span>→</span>
                      </>
                    ),
                    variant: "primary",
                    onClick: () =>
                      nav(`/admin/tenants/query/${t.tenantId}/sites`),
                  },
                  {
                    label: "Add Site",
                    variant: "secondary",
                    onClick: () => openAddSite(t),
                  },
                  {
                    label: "Edit",
                    variant: "ghost",
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