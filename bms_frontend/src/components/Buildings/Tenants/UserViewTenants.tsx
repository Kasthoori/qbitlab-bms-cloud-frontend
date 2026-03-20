import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  ChevronRight,
  MapPin,
  Globe2,
  Clock3,
  Search,
} from "lucide-react";
import { BmsApi, type Page, type TenantDto } from "@/api/bms";

export default function UserViewTenants() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [tenants, setTenants] = useState<TenantDto[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadTenants();
  }, []);

  async function loadTenants() {
    try {
      setLoading(true);
      setErrorMessage(null);

      const page = await BmsApi.getMyTenants() as Page<TenantDto>;
      setTenants(page?.content ?? []);
    } catch (error) {
      console.error(error);
      setErrorMessage("Failed to load tenants.");
    } finally {
      setLoading(false);
    }
  }

  const filteredTenants = tenants.filter((tenant) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;

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
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        Loading tenants...
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

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">
              Buildings
            </p>
            <h1 className="mt-2 text-3xl font-bold">Tenants</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-200">
              Select a tenant to explore sites, floor plans, and HVAC equipment.
            </p>
          </div>

          <div className="w-full max-w-md">
            <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-300">
              Search tenants
            </label>
            <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
              <Search className="h-4 w-4 text-slate-300" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by tenant, city, country..."
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
              Available Tenants
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Choose a tenant to continue to its sites.
            </p>
          </div>

          <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
            {filteredTenants.length} tenant{filteredTenants.length === 1 ? "" : "s"}
          </div>
        </div>

        {filteredTenants.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
            <p className="text-base font-medium text-slate-800">No tenants found</p>
            <p className="mt-1 text-sm text-slate-500">
              Try another search keyword.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            {filteredTenants.map((tenant) => {
              const tenantId = String(tenant.tenantId ?? tenant.id ?? "").trim();
              const tenantName =
                tenant.name ?? tenant.tenantName ?? "Unnamed Tenant";

              const locationText = buildLocationText(tenant);
              const regionText = buildRegionText(tenant);
              const hasTimezone =
                tenant.timezone && String(tenant.timezone).trim().length > 0;

              return (
                <div
                  key={tenantId}
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
                            {tenantName}
                          </h3>
                          <p className="mt-1 text-sm text-slate-500">
                            Tenant ID: {tenantId || "-"}
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

                        {regionText && (
                          <div className="flex items-start gap-3 rounded-2xl bg-slate-50 px-3 py-3">
                            <Globe2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                            <div>
                              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                Region
                              </p>
                              <p className="text-sm text-slate-700">{regionText}</p>
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
                              <p className="text-sm text-slate-700">{tenant.timezone}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                        <div>
                          <p className="text-sm font-medium text-slate-800">
                            Open this tenant
                          </p>
                          <p className="text-xs text-slate-500">
                            View sites and continue to floor plans
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleOpenTenantSites(tenantId)}
                          className="rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
                        >
                          Open Sites
                        </button>
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