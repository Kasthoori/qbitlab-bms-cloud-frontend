import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Fan, Sparkles } from "lucide-react";
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
      <div className="min-h-screen bg-slate-950 p-6">
        <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-6 text-rose-300 shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl">
          <p className="font-medium">Missing tenantId or siteId.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="space-y-6">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 shadow-[0_8px_30px_rgba(0,0,0,0.18)] backdrop-blur-xl transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft size={16} />
            Back
          </button>
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(135deg,rgba(2,6,23,0.96),rgba(15,23,42,0.94),rgba(30,41,59,0.94))] p-6 text-white shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">
                <Sparkles className="h-4 w-4" />
                Live HVAC Monitoring
              </div>

              <h1 className="mt-3 flex items-center gap-3 text-3xl font-bold">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-cyan-300">
                  <Fan className="h-6 w-6" />
                </span>
                HVAC Details
              </h1>

              <p className="mt-2 text-sm text-slate-300">
                {siteName} · Site HVAC details
              </p>

              <p className="mt-3 text-xs text-slate-500">
                Tenant: <span className="text-slate-300">{tenantId}</span>
                <span className="mx-2">•</span>
                Site: <span className="text-slate-300">{siteId}</span>
              </p>
            </div>

            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-2.5 text-sm font-medium text-cyan-300">
              Real-time telemetry view
            </div>
          </div>
        </div>

        <HvacWsTable tenantId={tenantId} siteId={siteId} />
      </div>
    </div>
  );
}