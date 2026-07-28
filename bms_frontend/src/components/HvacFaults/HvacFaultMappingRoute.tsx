import { useMemo } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { HvacFaultMappingPage } from "./HvacFaultMappingPage";

export function HvacFaultMappingRoute() {
  const { tenantId, siteId, hvacId } = useParams();
  const [searchParams] = useSearchParams();

  const externalDeviceId = useMemo(
    () => searchParams.get("externalDeviceId") ?? "",
    [searchParams]
  );

  if (!tenantId || !siteId || !hvacId) {
    return (
      <div className="p-6 text-red-200">
        Missing tenant, site, or HVAC id.
      </div>
    );
  }

  return (
    <div className="space-y-5 p-6">
      <Link
        to={`/tenants/${tenantId}/sites/${siteId}/hvac-device-mapping`}
        className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to device mapping
      </Link>

      <HvacFaultMappingPage
        tenantId={tenantId}
        siteId={siteId}
        hvacId={hvacId}
        externalDeviceId={externalDeviceId}
      />
    </div>
  );
}