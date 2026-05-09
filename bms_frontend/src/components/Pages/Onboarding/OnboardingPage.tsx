/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Building2, Cpu, MapPin, Sparkles, Wind } from "lucide-react";
import { api } from "../../../api/http";

import TenantForm from "./Components/TenantForm";
import SiteForm from "./Components/SiteForm";
import HvacForm from "./Components/HvacForm";
import { Button, Card, StepPill } from "./Components/onboarding.ui";
import type {
  HvacResponse,
  SiteResponse,
  TenantResponse,
  TenantFormValues,
  SiteFormValues,
  HvacFormValues,
} from "./Components/onboarding.types";

type Step = "TENANT" | "SITE" | "HVAC" | "DONE";

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>("TENANT");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tenant, setTenant] = useState<TenantResponse | null>(null);
  const [site, setSite] = useState<SiteResponse | null>(null);
  const [hvacs, setHvacs] = useState<HvacResponse[]>([]);

  const doneTenant = !!tenant;
  const doneSite = !!site;
  const doneHvac = hvacs.length > 0;

  const header = useMemo(
    () => ({
      title: "Smart Building Setup",
      subtitle: "Configure your tenant, site, and HVAC devices with AI-assisted onboarding.",
    }),
    []
  );

  const resetSetup = () => {
    setTenant(null);
    setSite(null);
    setHvacs([]);
    setStep("TENANT");
    setError(null);
  };

  const handleCreateTenant = async (values: TenantFormValues) => {
    setError(null);
    setBusy(true);

    try {
      const created = await api<TenantResponse>("/api/tenants", {
        method: "POST",
        body: JSON.stringify(values),
        auth: true,
      });

      setTenant(created);
      setStep("SITE");
    } catch (e: any) {
      setError(e?.message ?? "Failed to create tenant");
    } finally {
      setBusy(false);
    }
  };

  const handleCreateSite = async (values: SiteFormValues) => {
    if (!tenant) return;

    setError(null);
    setBusy(true);

    try {
      const created = await api<SiteResponse>(`/api/tenants/${tenant.tenantId}/sites`, {
        method: "POST",
        body: JSON.stringify(values),
        auth: true,
      });

      setSite(created);
      setStep("HVAC");
    } catch (e: any) {
      setError(e?.message ?? "Failed to create site");
    } finally {
      setBusy(false);
    }
  };

  const handleAddHvac = async (values: HvacFormValues) => {
    if (!tenant || !site) return;

    setError(null);
    setBusy(true);

    try {
      const created = await api<HvacResponse>(`/api/hvacs/${tenant.tenantId}/sites/${site.siteId}/hvacs`, {
        method: "POST",
        body: JSON.stringify(values),
        auth: true,
      });

      setHvacs((prev) => [created, ...prev]);
    } catch (e: any) {
      setError(e?.message ?? "Failed to create HVAC");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-full rounded-3xl bg-linear-to-br from-slate-950 via-[#08122f] to-slate-950 p-6 text-white">
      <div className="mb-8">
        <h1 className="flex items-center gap-3 text-3xl font-bold">
          <Sparkles className="h-7 w-7 text-blue-400" />
          {header.title}
        </h1>
        <p className="mt-2 text-slate-400">{header.subtitle}</p>
      </div>

      <div className="mb-8 flex flex-wrap gap-3">
        <StepPill label="Tenant" active={step === "TENANT"} done={doneTenant} />
        <StepPill label="Site" active={step === "SITE"} done={doneSite} />
        <StepPill label="HVAC" active={step === "HVAC"} done={doneHvac} />
        <StepPill label="Finish" active={step === "DONE"} done={step === "DONE"} />
      </div>

      {error ? (
        <div className="mb-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6 xl:col-span-1"
        >
          <Card title="AI Assistant" subtitle="Smart setup guidance for NZ building onboarding">
            <div className="space-y-4 text-sm text-slate-300">
              <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                <Sparkles className="mt-0.5 h-5 w-5 text-purple-400" />
                <div>
                  <p className="font-medium text-white">Recommended structure</p>
                  <p className="mt-1 text-slate-400">
                    Create tenant first, then site, then register HVAC devices for mapping.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                <Wind className="mt-0.5 h-5 w-5 text-cyan-400" />
                <div>
                  <p className="font-medium text-white">HVAC estimate</p>
                  <p className="mt-1 text-slate-400">
                    Typical commercial floor coverage often needs multiple units by zone and floor.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-linear-to-r from-blue-500/20 to-purple-500/20 p-4 text-slate-200">
                💡 Tip: keep your HVAC deviceId aligned with edge-controller identifiers such as
                <span className="ml-1 font-medium text-white">hvac-1</span>,
                <span className="ml-1 font-medium text-white">hvac-2</span>.
              </div>
            </div>
          </Card>

          <Card title="Live Summary" subtitle="Backend-generated UUIDs appear here after creation">
            <div className="space-y-5 text-sm">
              <div>
                <div className="mb-2 flex items-center gap-2 font-medium text-white">
                  <Building2 className="h-4 w-4 text-blue-400" />
                  Tenant
                </div>
                {tenant ? (
                  <div className="space-y-1 text-slate-300">
                    <div>Name: {tenant.name}</div>
                    <div className="break-all text-slate-400">tenantId: {tenant.tenantId}</div>
                  </div>
                ) : (
                  <div className="text-slate-500">Not created yet</div>
                )}
              </div>

              <div>
                <div className="mb-2 flex items-center gap-2 font-medium text-white">
                  <MapPin className="h-4 w-4 text-cyan-400" />
                  Site
                </div>
                {site ? (
                  <div className="space-y-1 text-slate-300">
                    <div>Name: {site.siteName}</div>
                    <div className="break-all text-slate-400">siteId: {site.siteId}</div>
                  </div>
                ) : (
                  <div className="text-slate-500">Not created yet</div>
                )}
              </div>

              <div>
                <div className="mb-2 flex items-center gap-2 font-medium text-white">
                  <Cpu className="h-4 w-4 text-purple-400" />
                  HVAC Units
                </div>
                {hvacs.length > 0 ? (
                  <ul className="space-y-3">
                    {hvacs.map((h) => (
                      <li key={h.hvacId} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="font-medium text-white">{h.hvacName}</div>
                        <div className="text-slate-300">deviceId: {h.deviceId}</div>
                        <div className="break-all text-slate-500">hvacId: {h.hvacId}</div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-slate-500">None yet</div>
                )}
              </div>

              <div className="pt-2">
                <Button variant="secondary" type="button" onClick={resetSetup} disabled={busy}>
                  Reset setup
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 xl:col-span-2"
        >
          {step === "TENANT" && (
            <TenantForm busy={busy} onSubmit={handleCreateTenant} />
          )}

          {step === "SITE" && tenant && (
            <SiteForm
              busy={busy}
              tenant={tenant}
              onBack={() => setStep("TENANT")}
              onSubmit={handleCreateSite}
            />
          )}

          {step === "HVAC" && tenant && site && (
            <HvacForm
              busy={busy}
              tenant={tenant}
              site={site}
              onBack={() => setStep("SITE")}
              onAdd={handleAddHvac}
              onFinish={() => setStep("DONE")}
            />
          )}

          {step === "DONE" && (
            <Card title="Setup complete" subtitle="Tenant, site, and HVAC registration completed">
              <div className="space-y-4 text-sm text-slate-300">
                <p>
                  Your tenant, site, and HVAC setup has been created successfully. You can now continue to
                  dashboard flows, device mapping, or add more HVAC units.
                </p>

                <div className="flex flex-wrap gap-3">
                  <Button type="button" onClick={() => window.alert("Navigate to dashboard here")}>
                    Go to Dashboard
                  </Button>

                  <Button type="button" variant="secondary" onClick={() => setStep("HVAC")}>
                    Add more HVACs
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}