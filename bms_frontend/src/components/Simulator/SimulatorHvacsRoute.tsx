import { useLocation, useParams } from "react-router-dom";
import SimulatorHvacsPage from "./SimulatorHvacsPage";

type LocationState = {
  tenantName?: string;
  siteName?: string;
};

export default function SimulatorHvacsRoute() {
  const { tenantId, siteId } = useParams();
  const location = useLocation();
  const state = location.state as LocationState | null;

  if (!tenantId || !siteId) {
    return (
      <div className="min-h-screen bg-slate-950 p-6 text-slate-100">
        Tenant ID or Site ID is missing.
      </div>
    );
  }

  return (
    <SimulatorHvacsPage
      tenantId={tenantId}
      siteId={siteId}
      tenantName={state?.tenantName}
      siteName={state?.siteName}
    />
  );
}