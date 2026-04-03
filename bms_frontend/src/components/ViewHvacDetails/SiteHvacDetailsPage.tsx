import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import HvacWsTable from "./HvacWsTable";

type LocationState = {
  siteName?: string;
};

export default function SiteHvacDetailsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { tenantId, siteId } = useParams<{ tenantId: string; siteId: string }>();

  const state = location.state as LocationState | null;
  const siteName = state?.siteName || "Selected Site";

  if (!tenantId || !siteId) {
    return (
      <div className="min-h-screen bg-slate-100 p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
          <p className="font-medium text-red-700">Missing tenantId or siteId.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">HVAC</h1>
          <p className="mt-1 text-sm text-slate-500">
            {siteName} · Site HVAC details
          </p>
        </div>

        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
          Back
        </button>
      </div>

      <HvacWsTable tenantId={tenantId} siteId={siteId} />
    </div>
  );
}