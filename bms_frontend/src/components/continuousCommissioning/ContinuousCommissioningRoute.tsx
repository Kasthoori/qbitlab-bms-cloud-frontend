import { Navigate, useParams } from "react-router-dom";

import { ContinuousCommissioningPage } from "./ContinuousCommissioningPage";

export function ContinuousCommissioningRoute() {
  const { tenantId, siteId } = useParams<{
    tenantId: string;
    siteId: string;
  }>();

  if (!tenantId || !siteId) {
    return <Navigate to="/access-denied" replace />;
  }

  return (
    <ContinuousCommissioningPage
      tenantId={tenantId}
      siteId={siteId}
    />
  );
}