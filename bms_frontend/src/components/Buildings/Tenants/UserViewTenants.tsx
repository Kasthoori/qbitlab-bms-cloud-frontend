import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  ChevronRight,
  Clock3,
  Globe2,
  MapPin,
  Search,
  Sparkles,
} from "lucide-react";

import { BmsApi, type Page, type TenantDto } from "@/api/bms";
import { BmsButton, BmsCard, BmsInput } from "@/components/UI";

export default function UserViewTenants() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [tenants, setTenants] = useState<TenantDto[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    void loadTenants();
  }, []);

  async function loadTenants() {
    try {
      setLoading(true);
      setErrorMessage(null);

      const page = (await BmsApi.getMyTenants()) as Page<TenantDto>;

      setTenants(page?.content ?? []);
    } catch (error) {
      console.error(error);
      setErrorMessage("Failed to load tenants.");
    } finally {
      setLoading(false);
    }
  }

  const filteredTenants = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return tenants;

    return tenants.filter((tenant) => {
      const values = [
        tenant.name,
        tenant.tenantName,
        tenant.city,
        tenant.country,
        tenant.addressLine1,
        tenant.postcode,
        tenant.timezone,
        tenant.tenantId,
        tenant.id != null ? String(tenant.id) : "",
      ]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase());

      return values.some((value) => value.includes(query));
    });
  }, [tenants, search]);

  function handleOpenTenantSites(tenantId: string) {
    navigate(`/user/tenants/${tenantId}/sites`);
  }

  function buildLocationText(tenant: TenantDto) {
    return [tenant.addressLine1, tenant.city, tenant.postcode]
      .filter((value) => value && String(value).trim().length > 0)
      .join(", ");
  }

  function buildRegionText(tenant: TenantDto) {
    return [tenant.country, tenant.timezone]
      .filter((value) => value && String(value).trim().length > 0)
      .join(" • ");
  }

  if (loading) {
    return (
      <BmsCard variant="section" className="p-6 text-slate-300">
        Loading tenants...
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

  return (
    <div className="space-y-6">
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

            <h1 className="mt-3 text-3xl font-bold">Tenants</h1>

            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Select a tenant to explore sites, floor plans, and HVAC equipment.
            </p>
          </div>

          <div className="w-full max-w-md">
            <label
              htmlFor="tenant-search"
              className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-300"
            >
              Search tenants
            </label>

            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />

              <BmsInput
                id="tenant-search"
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by tenant, city, country..."
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
              Tenant directory
            </p>

            <h2 className="mt-1 text-xl font-semibold text-white">
              Available Tenants
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Choose a tenant to continue to its sites.
            </p>
          </div>

          <div className="rounded-full border border-white/10 bg-white/4 px-4 py-2 text-sm font-medium text-slate-200">
            {filteredTenants.length} tenant
            {filteredTenants.length === 1 ? "" : "s"}
          </div>
        </div>

        {filteredTenants.length === 0 ? (
          <BmsCard variant="glass" className="border-dashed p-10 text-center">
            <p className="text-base font-medium text-white">No tenants found</p>
            <p className="mt-1 text-sm text-slate-400">
              Try another search keyword.
            </p>
          </BmsCard>
        ) : (
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            {filteredTenants.map((tenant) => {
              const tenantId = String(
                tenant.tenantId ?? tenant.id ?? ""
              ).trim();
              const tenantName =
                tenant.name ?? tenant.tenantName ?? "Unnamed Tenant";

              const locationText = buildLocationText(tenant);
              const regionText = buildRegionText(tenant);
              const hasTimezone =
                tenant.timezone && String(tenant.timezone).trim().length > 0;

              return (
                <BmsCard
                  key={tenantId}
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
                            {tenantName}
                          </h3>

                          <p className="mt-1 break-all text-sm text-slate-400">
                            Tenant ID: {tenantId || "-"}
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

                        {regionText && (
                          <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/4 px-3 py-3">
                            <Globe2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                            <div>
                              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                Region
                              </p>

                              <p className="text-sm text-slate-200">
                                {regionText}
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
                                {tenant.timezone}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                        <div>
                          <p className="text-sm font-medium text-white">
                            Open this tenant
                          </p>

                          <p className="text-xs text-slate-400">
                            View sites and continue to floor plans
                          </p>
                        </div>

                        <BmsButton
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={() => handleOpenTenantSites(tenantId)}
                        >
                          Open Sites
                          <ArrowRight className="h-4 w-4" />
                        </BmsButton>
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