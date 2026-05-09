/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Fan, Sparkles } from "lucide-react";

import HvacWsTable from "./HvacWsTable";
import HvacMaintenanceNotesPanel from "@/components/Maintenance/HvacMaintenanceNotesPanel";
import { BmsApi, type CurrentUserDto, type HvacDto } from "@/api/bms";

type LocationState = {
  siteName?: string;
};

type UserRole =
  | "ADMIN"
  | "BMS_ADMIN"
  | "TECHNICIAN"
  | "FACILITY_MANAGER"
  | "SITE_MANAGER";

export default function SiteHvacDetailsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { tenantId, siteId } = useParams<{ tenantId: string; siteId: string }>();

  const state = location.state as LocationState | null;
  const siteName = state?.siteName || "Selected Site";

  const [selectedHvac, setSelectedHvac] = useState<HvacDto | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUserDto | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [edgeControllerId, setEdgeControllerId] = useState<string>("");
  const [edgeError, setEdgeError] = useState<string | null>(null);
  const [edgeLoading, setEdgeLoading] = useState<boolean>(true);

  useEffect(() => {
    BmsApi.getCurrentUser()
      .then(setCurrentUser)
      .catch(() => setCurrentUser(null));
  }, []);

  useEffect(() => {
    if (!tenantId || !siteId) return;

    const tenantIdValue = tenantId;
    const siteIdValue = siteId;

    let cancelled = false;

    async function loadEdgeAssignment() {
      try {
        setEdgeLoading(true);
        setEdgeError(null);

        const assignment = await BmsApi.getSiteEdgeAssignment(
          tenantIdValue,
          siteIdValue
        );

        if (!cancelled) {
          setEdgeControllerId(assignment.edgeControllerId);
        }
      } catch (error: any) {
        console.error("Failed to load edge assignment", error);

        if (!cancelled) {
          setEdgeControllerId("");
          setEdgeError(
            error?.response?.data?.message ||
              error?.response?.data?.error ||
              error?.message ||
              "No edge controller assigned to this site."
          );
        }
      } finally {
        if (!cancelled) {
          setEdgeLoading(false);
        }
      }
    }

    loadEdgeAssignment();

    return () => {
      cancelled = true;
    };
  }, [tenantId, siteId]);

  if (!tenantId || !siteId) {
    return (
      <div className="min-h-screen bg-slate-950 p-6">
        <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-6 text-rose-300">
          <p className="font-medium">Missing tenantId or siteId.</p>
        </div>
      </div>
    );
  }

  const currentUserRole = currentUser?.roles
    ?.map((role) => role.replace("ROLE_", ""))
    ?.find((role) =>
      [
        "ADMIN",
        "BMS_ADMIN",
        "TECHNICIAN",
        "FACILITY_MANAGER",
        "SITE_MANAGER",
      ].includes(role)
    ) as UserRole | undefined;

  const currentUserName =
    currentUser?.name || currentUser?.username || currentUser?.email || "";

  function handleFailureResolved() {
    setReloadKey((prev) => prev + 1);
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="space-y-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 backdrop-blur-xl transition hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft size={16} />
          Back
        </button>

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

        {edgeLoading && (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-slate-300">
            Loading edge controller assignment...
          </div>
        )}

        {edgeError && (
          <div className="rounded-3xl border border-amber-400/20 bg-amber-500/10 p-5 text-amber-100">
            <p className="font-medium">Edge controller assignment missing</p>
            <p className="mt-1 text-sm text-amber-200/80">{edgeError}</p>
          </div>
        )}

        {!edgeLoading && edgeControllerId && (
          <HvacWsTable
            key={reloadKey}
            tenantId={tenantId}
            siteId={siteId}
            edgeControllerId={edgeControllerId}
            onSelectHvac={setSelectedHvac}
            selectedHvacId={selectedHvac?.hvacId}
          />
        )}

        {selectedHvac ? (
          <HvacMaintenanceNotesPanel
            tenantId={tenantId}
            siteId={siteId}
            externalDeviceId={selectedHvac.externalDeviceId ?? ""}
            unitName={selectedHvac.unitName}
            temperature={selectedHvac.temperature}
            setpoint={selectedHvac.setpoint}
            fanSpeed={
              selectedHvac.fanSpeed != null
                ? String(selectedHvac.fanSpeed)
                : null
            }
            flowRate={selectedHvac.flowRate}
            fault={selectedHvac.fault}
            currentUserRole={currentUserRole}
            currentUserName={currentUserName}
            onFailureResolved={handleFailureResolved}
          />
        ) : (
          <div className="rounded-3xl border border-white/10 bg-white/10 p-5 text-slate-300">
            Select an HVAC from the table to view or add maintenance notes.
          </div>
        )}
      </div>
    </div>
  );
}