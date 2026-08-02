import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { HvacFaultAlarmsPage } from "./HvacFaultAlarmsPage";

export function HvacFaultAlarmsRoute() {
  const { tenantId, siteId, hvacId } = useParams();
  const [searchParams] = useSearchParams();
  if (!tenantId || !siteId) return <div className="p-6 text-rose-200">Missing tenant or site ID.</div>;
  const selectedHvacId = hvacId ?? searchParams.get("hvacId") ?? "";

  return <div className="space-y-5 p-6">
    <Link to={`/user/tenants/${tenantId}/sites/${siteId}/hvacs`} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-2 text-sm font-bold text-slate-200 hover:bg-white/10"><ArrowLeft className="h-4 w-4" /> Back to HVACs</Link>
    <HvacFaultAlarmsPage tenantId={tenantId} siteId={siteId} initialHvacId={selectedHvacId} />
  </div>;
}
