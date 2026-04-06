import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  ChevronRight,
  MapPin,
  Clock3,
  Search,
  LayoutTemplate,
  Fan,
} from "lucide-react";
import { BmsApi, type SiteDto, type TenantDto } from "@/api/bms";

export default function UserViewSites() {
  const navigate = useNavigate();
  const { tenantId } = useParams<{ tenantId: string }>();

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [tenant, setTenant] = useState<TenantDto | null>(null);
  const [sites, setSites] = useState<SiteDto[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  async function loadData() {
    if (!tenantId) {
      setErrorMessage("Tenant ID is missing in the route.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);

      const [tenantData, siteData] = await Promise.all([
        BmsApi.getTenantById(tenantId),
        BmsApi.getSitesByTenant(tenantId),
      ]);

      setTenant(tenantData ?? null);
      setSites(Array.isArray(siteData) ? siteData : []);
    } catch (error) {
      console.error(error);
      setErrorMessage("Failed to load tenant sites.");
    } finally {
      setLoading(false);
    }
  }

  const filteredSites = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return sites;

    return sites.filter((site) => {
      const values = [
        site.siteName,
        site.addressLine1,
        site.city,
        site.postcode,
        site.timezone,
        site.siteId,
      ]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase());

      return values.some((value) => value.includes(query));
    });
  }, [sites, search]);

  function buildLocationText(site: SiteDto) {
    return [site.addressLine1, site.city, site.postcode]
      .filter((value) => value && String(value).trim().length > 0)
      .join(", ");
  }

  function handleViewPlans(siteId: string) {
    if (!tenantId) return;
    navigate(`/buildings/user/tenants/${tenantId}/sites/${siteId}/floor-plans/view`);
  }

  function handleViewHvacs(siteId: string, siteName?: string) {
  if (!tenantId) return;

  navigate(`/user/tenants/${tenantId}/sites/${siteId}/hvacs`, {
    state: { siteName: siteName ?? "Selected Site" },
  });
}

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        Loading sites...
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm">
        {errorMessage}
      </div>
    );
  }

  if (!tenantId) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm">
        Tenant ID is missing in the route.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate("/buildings/user/tenants")}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tenants
        </button>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-linear-to-r from-slate-900 via-slate-800 to-blue-900 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">
              Buildings
            </p>
            <h1 className="mt-2 text-3xl font-bold">
              {tenant?.name ?? tenant?.tenantName ?? "Tenant Sites"}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-200">
              Select a site to view floor plans and HVAC equipment for this tenant.
            </p>
          </div>

          <div className="w-full max-w-md">
            <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-300">
              Search sites
            </label>
            <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
              <Search className="h-4 w-4 text-slate-300" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by site, city, postcode..."
                className="w-full bg-transparent text-sm text-white placeholder:text-slate-300 outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Available Sites
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Choose a site to continue to plans or HVAC equipment.
            </p>
          </div>

          <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
            {filteredSites.length} site{filteredSites.length === 1 ? "" : "s"}
          </div>
        </div>

        {filteredSites.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
            <p className="text-base font-medium text-slate-800">No sites found</p>
            <p className="mt-1 text-sm text-slate-500">
              Try another search keyword.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            {filteredSites.map((site) => {
              const siteId = String(site.siteId ?? "").trim();
              const locationText = buildLocationText(site);
              const hasTimezone =
                site.timezone && String(site.timezone).trim().length > 0;

              return (
                <div
                  key={siteId}
                  className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 ring-8 ring-blue-50">
                      <Building2 className="h-7 w-7" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-xl font-semibold text-slate-900">
                            {site.siteName || "Unnamed Site"}
                          </h3>
                          <p className="mt-1 text-sm text-slate-500">
                            Site ID: {siteId || "-"}
                          </p>
                        </div>

                        <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600" />
                      </div>

                      <div className="mt-5 space-y-3">
                        {locationText && (
                          <div className="flex items-start gap-3 rounded-2xl bg-slate-50 px-3 py-3">
                            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                            <div>
                              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                Address
                              </p>
                              <p className="text-sm text-slate-700">{locationText}</p>
                            </div>
                          </div>
                        )}

                        {hasTimezone && (
                          <div className="flex items-start gap-3 rounded-2xl bg-slate-50 px-3 py-3">
                            <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                            <div>
                              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                Timezone
                              </p>
                              <p className="text-sm text-slate-700">{site.timezone}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                        <div>
                          <p className="text-sm font-medium text-slate-800">
                            Open this site
                          </p>
                          <p className="text-xs text-slate-500">
                            View floor plans or inspect HVAC equipment
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleViewPlans(siteId)}
                            className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
                          >
                            <LayoutTemplate className="h-4 w-4" />
                            View Plans
                          </button>

                          <button
                            type="button"
                            onClick={() => handleViewHvacs(siteId, site.siteName)}
                            className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
                          >
                            <Fan className="h-4 w-4" />
                            View HVACs
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}