/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  ChevronRight,
  Clock3,
  Fan,
  FileCheck2,
  LayoutTemplate,
  MapPin,
  Search,
  Sparkles,
} from "lucide-react";

import { BmsApi, type SiteDto, type TenantDto } from "@/api/bms";
import { BmsButton, BmsCard, BmsInput } from "@/components/UI";

export default function UserViewSites() {
  const navigate = useNavigate();
  const { tenantId } = useParams<{ tenantId: string }>();

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [tenant, setTenant] = useState<TenantDto | null>(null);
  const [sites, setSites] = useState<SiteDto[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    void loadData();
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
    } catch (error: any) {
      console.error(error);

      if (error?.status === 403) {
        navigate("/access-denied", { replace: true });
        return;
      }

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
    if (!tenantId || !siteId) return;

    navigate(
      `/buildings/user/tenants/${tenantId}/sites/${siteId}/floor-plans/view`
    );
  }

  function handleViewHvacs(siteId: string, siteName?: string) {
    if (!tenantId || !siteId) return;

    navigate(`/user/tenants/${tenantId}/sites/${siteId}/hvacs`, {
      state: { siteName: siteName ?? "Selected Site" },
    });
  }

  function handleComplianceReport(siteId: string) {
    if (!tenantId || !siteId) return;

    navigate(
      `/admin/tenants/${tenantId}/sites/${siteId}/reports/compliance-evidence`
    );
  }

  if (loading) {
    return (
      <BmsCard variant="section" className="p-6 text-slate-300">
        Loading sites...
      </BmsCard>
    );
  }

  if (errorMessage) {
    return (
      <BmsCard
        variant="section"
        className="border-rose-500/20 bg-rose-500/10 p-6 text-rose-300"
      >
        {errorMessage}
      </BmsCard>
    );
  }

  if (!tenantId) {
    return (
      <BmsCard
        variant="section"
        className="border-rose-500/20 bg-rose-500/10 p-6 text-rose-300"
      >
        Tenant ID is missing in the route.
      </BmsCard>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <BmsButton
          type="button"
          variant="ghost"
          onClick={() => navigate("/buildings/user/tenants")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tenants
        </BmsButton>
      </div>

      <BmsCard
        variant="section"
        className="overflow-hidden bg-[linear-gradient(135deg,rgba(2,6,23,0.96),rgba(15,23,42,0.94),rgba(30,41,59,0.94))] p-6 text-white"
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">
              <Sparkles className="h-4 w-4" />
              Buildings
            </div>

            <h1 className="mt-3 text-3xl font-bold">
              {tenant?.name ?? tenant?.tenantName ?? "Tenant Sites"}
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Select a site to view floor plans, HVAC equipment, or compliance
              evidence reports.
            </p>
          </div>

          <div className="w-full max-w-md">
            <label
              htmlFor="site-search"
              className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-300"
            >
              Search sites
            </label>

            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />

              <BmsInput
                id="site-search"
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by site, city, postcode..."
                className="pl-11"
              />
            </div>
          </div>
        </div>
      </BmsCard>

      <BmsCard variant="section" className="p-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200/80">
              Site directory
            </p>

            <h2 className="mt-1 text-xl font-semibold text-white">
              Available Sites
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Choose a site to continue to plans, HVAC equipment, or compliance
              reports.
            </p>
          </div>

          <div className="rounded-full border border-white/10 bg-white/4 px-4 py-2 text-sm font-medium text-slate-200">
            {filteredSites.length} site{filteredSites.length === 1 ? "" : "s"}
          </div>
        </div>

        {filteredSites.length === 0 ? (
          <BmsCard
            variant="glass"
            className="border-dashed p-10 text-center"
          >
            <p className="text-base font-medium text-white">No sites found</p>
            <p className="mt-1 text-sm text-slate-400">
              Try another search keyword.
            </p>
          </BmsCard>
        ) : (
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            {filteredSites.map((site) => {
              const siteId = String(site.siteId ?? "").trim();
              const locationText = buildLocationText(site);
              const hasTimezone =
                site.timezone && String(site.timezone).trim().length > 0;

              return (
                <BmsCard
                  key={siteId}
                  variant="glass"
                  hover
                  className="group p-5 transition hover:-translate-y-0.5"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/4 text-blue-300">
                      <Building2 className="h-7 w-7" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-xl font-semibold text-white">
                            {site.siteName || "Unnamed Site"}
                          </h3>

                          <p className="mt-1 break-all text-sm text-slate-400">
                            Site ID: {siteId || "-"}
                          </p>
                        </div>

                        <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-slate-500 transition group-hover:translate-x-1 group-hover:text-blue-300" />
                      </div>

                      <div className="mt-5 space-y-3">
                        {locationText && (
                          <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/4 px-3 py-3">
                            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                            <div>
                              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                Address
                              </p>

                              <p className="text-sm text-slate-200">
                                {locationText}
                              </p>
                            </div>
                          </div>
                        )}

                        {hasTimezone && (
                          <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/4 px-3 py-3">
                            <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                            <div>
                              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                Timezone
                              </p>

                              <p className="text-sm text-slate-200">
                                {site.timezone}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                        <div>
                          <p className="text-sm font-medium text-white">
                            Open this site
                          </p>

                          <p className="text-xs text-slate-400">
                            View plans, inspect HVACs, or export compliance
                            evidence
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <BmsButton
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewPlans(siteId)}
                          >
                            <LayoutTemplate className="h-4 w-4" />
                            View Plans
                          </BmsButton>

                          <BmsButton
                            type="button"
                            variant="primary"
                            size="sm"
                            onClick={() =>
                              handleViewHvacs(siteId, site.siteName)
                            }
                          >
                            <Fan className="h-4 w-4" />
                            View HVACs
                          </BmsButton>

                          <BmsButton
                            type="button"
                            variant="success"
                            size="sm"
                            onClick={() => handleComplianceReport(siteId)}
                          >
                            <FileCheck2 className="h-4 w-4" />
                            Compliance Report
                          </BmsButton>
                        </div>
                      </div>
                    </div>
                  </div>
                </BmsCard>
              );
            })}
          </div>
        )}
      </BmsCard>
    </div>
  );
}