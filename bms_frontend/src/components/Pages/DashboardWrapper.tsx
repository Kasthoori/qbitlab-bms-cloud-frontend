import { useParams } from "react-router-dom";
import Dashboard from "./Dashboard";

export default function DashboardWrapper() {
  const { tenantId, siteId } = useParams<{ tenantId: string; siteId: string }>();

  if (!tenantId || !siteId) {
    return <div>Missing tenant or site</div>;
  }

  return <Dashboard tenantId={tenantId} siteId={siteId} />;
}