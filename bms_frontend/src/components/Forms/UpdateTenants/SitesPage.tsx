import { BmsApi, type SiteDto } from "@/api/bms";
import { api } from "@/api/http";
import { useEffect, useState, type FC } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BmsCard from "./BmsCard";
import AddHvacModal from "./AddHvacModal";
import UpdateSiteModel from "./UpdateSiteModal";
import ConfirmDeleteSiteModel from "./ConfirmDeleteSiteModel";
import BackButton from "@/components/common/BackButton";

const SitesPage: FC = () => {
  const nav = useNavigate();
  const { tenantId } = useParams<{ tenantId: string }>();

  const [sites, setSites] = useState<SiteDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSite, setSelectedSite] = useState<SiteDto | undefined>(undefined);

  const [openAddHvac, setOpenAddHvac] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [selectedSiteTitle, setSelectedSiteTitle] = useState<string>();

  const [openUpdateSite, setOpenUpdateSite] = useState(false);

  const [openDeleteSite, setOpenDeleteSite] = useState(false);
  const [siteToDelete, setSiteToDelete] = useState<SiteDto | null>(null);
  const [deletingSite, setDeletingSite] = useState(false);
  const [deleteSiteError, setDeleteSiteError] = useState<string | null>(null);
  const [deleteSiteSuccess, setDeleteSiteSuccess] = useState(false);

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

  const onAskDeleteSite = (s: SiteDto) => {
    setSiteToDelete(s);
    setDeleteSiteError(null);
    setDeleteSiteSuccess(false);
    setOpenDeleteSite(true);
  };

  const onConfirmDeleteSite = async () => {
    if (!siteToDelete || !tenantId) return;

    setDeletingSite(true);
    setDeleteSiteError(null);
    setDeleteSiteSuccess(false);

    try {
      await BmsApi.deleteSite(tenantId, siteToDelete.siteId);

      setDeleteSiteSuccess(true);
      await loadSites();

      setTimeout(() => {
        setOpenDeleteSite(false);
        setSiteToDelete(null);
        setDeleteSiteSuccess(false);
      }, 700);
    } catch (err: unknown) {
      setDeleteSiteError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingSite(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl p-6">
      <div className="mb-6 space-y-4">
      <BackButton onClick={() => nav("/admin/update-tenant")} />

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        <h1 className="text-3xl font-bold text-white">Sites</h1>
        <p className="mt-2 text-slate-400">
          <span className="font-medium text-slate-200">Tenant:</span> {tenantId}
        </p>
      </div>
    </div>     

      {loading && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-slate-300 backdrop-blur-xl">
          Loading sites...
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-rose-300">
          {error}
        </div>
      )}

      {!loading && !error && sites.length === 0 && (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-slate-300 backdrop-blur-xl">
          <div className="font-semibold text-slate-600">
            No sites found for this tenant.
          </div>
          <div className="mt-1 text-sm text-slate-600">
            Create a site under this tenant.
          </div>
        </div>
      )}

      {!loading && !error && sites.length > 0 && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
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
                  label: "View HVACs",
                  variant: "secondary",
                  onClick: () =>
                    nav(`/admin/tenants/query/${tenantId}/sites/${s.siteId}/hvacs`),
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
                  label: "Device Mapping",
                  variant: "secondary",
                  onClick: () =>
                    nav(`/admin/tenants/${tenantId}/sites/${s.siteId}/hvac-device-mapping`),
                },
                {
                  label: "Add Floor Plan",
                  variant: "secondary",
                  onClick: () =>
                    nav(`/admin/tenants/${tenantId}/sites/${s.siteId}/floor-plans/upload`),
                },
                {
                  label: "View Floor Plans",
                  variant: "secondary",
                  onClick: () =>
                    nav(`/admin/tenants/${tenantId}/sites/${s.siteId}/floor-plans/view`),
                },
                {
                  label: "Edit Site",
                  variant: "primary",
                  onClick: () => {
                    setSelectedSiteId(s.siteId);
                    setSelectedSiteTitle(s.siteName);
                    setOpenUpdateSite(true);
                    setSelectedSite(s);
                  },
                },
                {
                  label: "Delete Site",
                  variant: "danger",
                  onClick: () => onAskDeleteSite(s),
                },
              ]}
            />
          ))}
        </div>
      )}

      <AddHvacModal
        open={openAddHvac}
        tenantId={tenantId!}
        siteId={selectedSiteId!}
        siteTitle={selectedSiteTitle}
        onClose={() => setOpenAddHvac(false)}
        onCreated={loadSites}
      />

      {selectedSite && (
        <UpdateSiteModel
          open={openUpdateSite}
          siteId={selectedSiteId!}
          siteName={selectedSiteTitle || ""}
          tenantId={tenantId!}
          onClose={() => setOpenUpdateSite(false)}
          onCreated={loadSites}
          site={selectedSite}
        />
      )}

      {tenantId && siteToDelete && (
        <ConfirmDeleteSiteModel
          open={openDeleteSite}
          tenantId={tenantId}
          siteId={siteToDelete.siteId}
          siteName={siteToDelete.siteName}
          deleting={deletingSite}
          error={deleteSiteError}
          success={deleteSiteSuccess}
          onClose={() => {
            if (deletingSite) return;
            setOpenDeleteSite(false);
            setSiteToDelete(null);
            setDeleteSiteError(null);
            setDeleteSiteSuccess(false);
          }}
          onConfirmDelete={onConfirmDeleteSite}
        />
      )}
    </div>
  );
};

export default SitesPage;