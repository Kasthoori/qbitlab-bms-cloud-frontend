import { useMemo } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, BellRing } from "lucide-react";
import { HvacFaultMappingPage } from "./HvacFaultMappingPage";

export function HvacFaultMappingRoute() {
  const { tenantId, siteId, hvacId } = useParams();
  const [searchParams] = useSearchParams();
  const externalDeviceId = useMemo(() => searchParams.get("externalDeviceId") ?? "", [searchParams]);
  if (!tenantId || !siteId || !hvacId) return <div className="p-6 text-rose-200">Missing tenant, site or HVAC ID.</div>;

  return <div className="space-y-5 p-6"><div className="flex flex-wrap items-center justify-between gap-3"><Link to={`/admin/tenants/${tenantId}/sites/${siteId}/hvac-device-mapping`} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-2 text-sm font-bold text-slate-200 hover:bg-white/10"><ArrowLeft className="h-4 w-4" /> Back to device mapping</Link><Link to={`/tenants/${tenantId}/sites/${siteId}/fault-alarms?hvacId=${encodeURIComponent(hvacId)}`} className="inline-flex items-center gap-2 rounded-2xl border border-cyan-400/20 px-4 py-2 text-sm font-bold text-cyan-100 hover:bg-cyan-500/10"><BellRing className="h-4 w-4" /> View alarms</Link></div><HvacFaultMappingPage tenantId={tenantId} siteId={siteId} hvacId={hvacId} externalDeviceId={externalDeviceId} /></div>;
}
