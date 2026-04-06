import { BmsApi, type SiteDto } from "@/api/bms";
import { api } from "@/api/http";
import { useEffect, useState, type FC } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BmsCard from "./BmsCard";
import AddHvacModal from "./AddHvacModal";
import UpdateSiteModel from "./UpdateSiteModel";
import ConfirmDeleteSiteModel from "./ConfirmDeleteSiteModel";

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
      <div className="mb-4 flex items-center gap-3">
        <button
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-slate-700 shadow-sm hover:bg-slate-50"
          onClick={() => nav("/admin/update-tenant")}
        >
          ← Back
        </button>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Sites</h1>
        <p className="mt-1 text-slate-600">
          <b>Tenant:</b> {tenantId}
        </p>
      </div>

      {loading && <p className="text-slate-600">Loading Sites.....</p>}
      {error && <p className="whitespace-pre-wrap text-red-600">{error}</p>}

      {!loading && !error && sites.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
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