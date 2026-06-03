/* eslint-disable @typescript-eslint/no-explicit-any */
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Fan, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

import HvacWsTable from "./HvacWsTable";
import HvacMaintenanceNotesPanel from "@/components/Maintenance/HvacMaintenanceNotesPanel";
import HvacAiInsightPanel from "@/components/Hvac/HvacAiInsightPanel";
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

type ViewportRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

/**
 * Small viewport animation wrapper.
 *
 * Important:
 * - triggerOnce is true to prevent scroll jumping.
 * - Do not use this wrapper for long interactive panels such as Maintenance History.
 */
function ViewportReveal({
  children,
  className = "",
  delay = 0,
}: ViewportRevealProps) {
  const { ref, inView } = useInView({
    threshold: 0.05,
    triggerOnce: true,
    rootMargin: "120px 0px",
  });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 18 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
      transition={{
        duration: 0.32,
        delay,
        ease: "easeOut",
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function normalizeRole(role: string): string {
  return role.startsWith("ROLE_") ? role.replace("ROLE_", "") : role;
}

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

  /**
   * Loads the current logged-in user once when this page opens.
   *
   * Used for:
   * - Maintenance review button visibility
   * - Technician name placeholder
   * - Admin-only Edge Controller button visibility
   */
  useEffect(() => {
    BmsApi.getCurrentUser()
      .then(setCurrentUser)
      .catch(() => setCurrentUser(null));
  }, []);

  /**
   * Loads the readable edge assignment for the selected tenant/site.
   *
   * The WebSocket HVAC table needs edgeControllerId for live telemetry.
   *
   * Important:
   * - We do NOT render HvacCommandPanel here.
   * - This prevents duplicate command panels and duplicate recent-command loading.
   */
  useEffect(() => {
    if (!tenantId || !siteId) return;

    const tenantIdValue = tenantId;
    const siteIdValue = siteId;

    let cancelled = false;

    async function loadEdgeAssignment() {
      try {
        setEdgeLoading(true);
        setEdgeError(null);

        const assignment = await BmsApi.getReadableSiteEdgeAssignment(
          tenantIdValue,
          siteIdValue
        );

        if (!cancelled) {
          setEdgeControllerId(assignment.edgeControllerId);
        }
      } catch (error: any) {
        console.error("Failed to load readable edge assignment", error);

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

  const currentUserRoles = useMemo(() => {
    return (currentUser?.roles ?? []).map(normalizeRole);
  }, [currentUser?.roles]);

  const currentUserRole = currentUserRoles.find((role) =>
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

  const canManageEdgeController =
    currentUserRoles.includes("ADMIN") || currentUserRoles.includes("BMS_ADMIN");

  function handleFailureResolved() {
    /*
     * Reloads the HVAC WebSocket/table area after a failure is marked resolved.
     * This makes the selected HVAC fault state refresh without manually reloading page.
     */
    setReloadKey((prev) => prev + 1);
  }

  if (!tenantId || !siteId) {
    return (
      <div className="min-h-screen bg-slate-950 p-6">
        <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-6 text-rose-300">
          <p className="font-medium">Missing tenantId or siteId.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full min-w-0 max-w-full overflow-x-hidden bg-slate-950 px-3 py-4 sm:px-4 sm:py-5">
      <div className="w-full min-w-0 max-w-full space-y-6 overflow-x-hidden">
        <ViewportReveal>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 backdrop-blur-xl transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft size={16} />
            Back
          </button>
        </ViewportReveal>

        <ViewportReveal delay={0.05}>
          <div className="w-full min-w-0 overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(135deg,rgba(2,6,23,0.96),rgba(15,23,42,0.94),rgba(30,41,59,0.94))] p-6 text-white shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl">
            <div className="flex min-w-0 flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">
                  <Sparkles className="h-4 w-4 shrink-0" />
                  Live HVAC Monitoring
                </div>

                <h1 className="mt-3 flex items-center gap-3 text-3xl font-bold">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-cyan-300">
                    <Fan className="h-6 w-6" />
                  </span>
                  HVAC Details
                </h1>

                <p className="mt-2 text-sm text-slate-300">
                  {siteName} · Site HVAC details
                </p>

                <p className="mt-3 break-all text-xs text-slate-500">
                  Tenant: <span className="text-slate-300">{tenantId}</span>
                  <span className="mx-2">•</span>
                  Site: <span className="text-slate-300">{siteId}</span>
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-3">
                {canManageEdgeController && (
                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        `/admin/tenants/${tenantId}/sites/${siteId}/edge-controller`
                      )
                    }
                    className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-2.5 text-sm font-medium text-cyan-100 transition hover:bg-cyan-300/20"
                  >
                    Edge Controller
                  </button>
                )}
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/admin/tenants/${tenantId}/sites/${siteId}/reports/command-audit`
                    )
                  }
                  className="rounded-2xl border border-amber-300/20 bg-amber-400/10 px-4 py-2.5 text-sm font-medium text-amber-100 transition hover:bg-amber-400/20"
                >
                  Command Audit
                </button>

                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-2.5 text-sm font-medium text-cyan-300">
                  Real-time telemetry view
                </div>
              </div>
            </div>
          </div>
        </ViewportReveal>

        {edgeLoading && (
          <ViewportReveal>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-slate-300">
              Loading edge controller assignment...
            </div>
          </ViewportReveal>
        )}

        {edgeError && (
          <ViewportReveal>
            <div className="rounded-3xl border border-amber-400/20 bg-amber-500/10 p-5 text-amber-100">
              <p className="font-medium">Edge controller assignment missing</p>
              <p className="mt-1 text-sm text-amber-200/80">{edgeError}</p>
            </div>
          </ViewportReveal>
        )}

        {!edgeLoading && edgeControllerId && (
          <ViewportReveal delay={0.08}>
            <div className="min-w-0 max-w-full overflow-x-hidden">
              <HvacWsTable
                key={reloadKey}
                tenantId={tenantId}
                siteId={siteId}
                edgeControllerId={edgeControllerId}
                onSelectHvac={setSelectedHvac}
                selectedHvacId={selectedHvac?.hvacId}
              />
            </div>
          </ViewportReveal>
        )}

        {!edgeLoading && !edgeControllerId && !edgeError && (
          <ViewportReveal>
            <div className="rounded-3xl border border-amber-400/20 bg-amber-500/10 p-5 text-amber-100">
              <p className="font-medium">No edge controller assigned</p>
              <p className="mt-1 text-sm text-amber-200/80">
                Assign an edge controller before opening live HVAC details.
              </p>
            </div>
          </ViewportReveal>
        )}

        {selectedHvac ? (
          <div className="min-w-0 max-w-full space-y-6 overflow-x-hidden">
            <ViewportReveal delay={0.05}>
              <div className="min-w-0 max-w-full overflow-x-hidden">
                <HvacAiInsightPanel
                  tenantId={tenantId}
                  siteId={siteId}
                  hvacId={selectedHvac.hvacId}
                />
              </div>
            </ViewportReveal>

            {/*
            Maintenance Workflow is intentionally NOT wrapped in ViewportReveal.
            It contains filters, note cards, and a fixed drawer.
            Wrapping long interactive panels in scroll animations can cause jumpy UX.
          */}
            <div className="min-w-0 max-w-full overflow-x-hidden">
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
                currentUserRoles={currentUserRoles}
                currentUserName={currentUserName}
                onFailureResolved={handleFailureResolved}
              />
            </div>
          </div>
        ) : (
          <ViewportReveal delay={0.1}>
            <div className="rounded-3xl border border-white/10 bg-white/10 p-5 text-slate-300">
              Select an HVAC from the table to view AI insight and maintenance
              notes.
            </div>
          </ViewportReveal>
        )}
      </div>
    </div>
  );
}