import { BmsApi, type SiteDto } from "@/api/bms";
import { api } from "@/api/http";
import { useEffect, useState, type FC } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Building2,
  Cpu,
  Image,
  Layers,
  MapPin,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  Wind,
} from "lucide-react";

import { BmsEntityCard } from "@/components/UI";

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
  const [selectedSite, setSelectedSite] = useState<SiteDto | undefined>(
    undefined
  );

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

  const onAskDeleteSite = (site: SiteDto) => {
    setSiteToDelete(site);
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

  function handleOpenAddHvac(site: SiteDto) {
    setSelectedSiteId(site.siteId);
    setSelectedSiteTitle(site.siteName);
    setOpenAddHvac(true);
  }

  function handleOpenEditSite(site: SiteDto) {
    setSelectedSiteId(site.siteId);
    setSelectedSiteTitle(site.siteName);
    setOpenUpdateSite(true);
    setSelectedSite(site);
  }

  function formatAddress(site: SiteDto) {
    return [site.addressLine1, site.city, site.postcode]
      .filter(Boolean)
      .join(", ");
  }

  return (
    <div className="bms-dashboard-bg bms-dashboard-shell mx-auto w-full max-w-7xl">
      <div className="mb-6 space-y-4">
        <BackButton onClick={() => nav("/admin/update-tenant")} />

        <section className="bms-dashboard-hero">
          <div className="bms-dashboard-hero-content">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
                <Sparkles className="h-4 w-4" />
                Site Workspace
              </div>

              <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-100">
                Manage Sites
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                View tenant sites, manage HVACs, configure mappings, upload
                floor plans, and maintain AI-ready building operations.
              </p>

              <p className="mt-3 max-w-2xl break-all text-sm text-slate-400">
                <span className="font-medium text-slate-200">Tenant:</span>{" "}
                {tenantId}
              </p>
            </div>
           </div>
          </div>
        </section>
      </div>

      {loading && (
        <div className="bms-section">
          <div className="flex items-center gap-3 text-slate-300">
            <Sparkles className="h-5 w-5 text-cyan-300" />
            <span>Loading sites...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-300/20 bg-rose-400/10 p-4 text-sm font-medium text-rose-100">
          {error}
        </div>
      )}

      {!loading && !error && sites.length === 0 && (
        <div className="bms-section">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/15 bg-slate-900/55 text-cyan-200">
              <Building2 className="h-6 w-6" />
            </div>

            <div>
              <h2 className="text-xl font-semibold text-slate-100">
                No sites found
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Create a site under this tenant to continue building setup.
              </p>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && sites.length > 0 && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {sites.map((site) => {
            const address = formatAddress(site);

            return (
              <BmsEntityCard
                key={site.siteId}
                eyebrow="Site"
                title={site.siteName || "Unnamed Site"}
                icon={<Building2 className="h-5 w-5" />}
                statusLabel="Active"
                status="active"
                meta={
                  <div className="space-y-2">
                    {address && (
                      <p className="flex gap-2">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300/80" />
                        <span className="text-slate-300">{address}</span>
                      </p>
                    )}

                    {site.timezone && (
                      <p className="flex gap-2">
                        <ClockIcon />
                        <span>
                          <span className="text-slate-500">Timezone:</span>{" "}
                          <span className="text-slate-300">
                            {site.timezone}
                          </span>
                        </span>
                      </p>
                    )}

                    <p>
                      <span className="text-slate-500">Site ID:</span>{" "}
                      <span className="break-all text-slate-300">
                        {site.siteId}
                      </span>
                    </p>
                  </div>
                }
                helperText="AI-ready site workspace"
                actions={[
                  {
                    label: (
                      <>
                        <Wind className="h-4 w-4" />
                        View HVACs
                      </>
                    ),
                    variant: "primary",
                    onClick: () =>
                      nav(
                        `/admin/tenants/query/${tenantId}/sites/${site.siteId}/hvacs`
                      ),
                  },
                  {
                    label: (
                      <>
                        <Plus className="h-4 w-4" />
                        Add HVAC
                      </>
                    ),
                    variant: "secondary",
                    onClick: () => handleOpenAddHvac(site),
                  },
                  {
                    label: (
                      <>
                        <Cpu className="h-4 w-4" />
                        Device Mapping
                      </>
                    ),
                    variant: "secondary",
                    onClick: () =>
                      nav(
                        `/admin/tenants/${tenantId}/sites/${site.siteId}/hvac-device-mapping`
                      ),
                  },
                  {
                    label: (
                      <>
                        <Cpu className="h-4 w-4" />
                        Simulator HVACs
                      </>
                    ),
                    variant: "secondary",
                    onClick: () =>
                      nav(
                        `/admin/tenants/${tenantId}/sites/${site.siteId}/simulator-hvacs`,
                        {
                          state: {
                            tenantName: tenantId,
                            siteName: site.siteName,
                          },
                        }
                      ),
                  },
                  {
                    label: (
                      <>
                        <Image className="h-4 w-4" />
                        Add Floor Plan
                      </>
                    ),
                    variant: "ghost",
                    onClick: () =>
                      nav(
                        `/admin/tenants/${tenantId}/sites/${site.siteId}/floor-plans/upload`
                      ),
                  },
                  {
                    label: (
                      <>
                        <Layers className="h-4 w-4" />
                        View Floor Plans
                      </>
                    ),
                    variant: "ghost",
                    onClick: () =>
                      nav(
                        `/admin/tenants/${tenantId}/sites/${site.siteId}/floor-plans/view`
                      ),
                  },
                  {
                    label: (
                      <>
                        <Pencil className="h-4 w-4" />
                        Edit Site
                      </>
                    ),
                    variant: "warning",
                    onClick: () => handleOpenEditSite(site),
                  },
                  {
                    label: (
                      <>
                        <Trash2 className="h-4 w-4" />
                        Delete Site
                      </>
                    ),
                    variant: "danger",
                    onClick: () => onAskDeleteSite(site),
                  },
                ]}
              />
            );
          })}
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

function ClockIcon() {
  return <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-violet-300/80" />;
}

export default SitesPage;