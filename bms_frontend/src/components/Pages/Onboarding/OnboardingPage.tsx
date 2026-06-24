/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  CheckCircle2,
  Cpu,
  MapPin,
  Sparkles,
  Wind,
} from "lucide-react";

import { api } from "../../../api/http";
import { BmsButton, BmsCard } from "@/components/UI";

import TenantForm from "./Components/TenantForm";
import SiteForm from "./Components/SiteForm";
import HvacForm from "./Components/HvacForm";

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

  const doneTenant = Boolean(tenant);
  const doneSite = Boolean(site);
  const doneHvac = hvacs.length > 0;

  const header = useMemo(
    () => ({
      title: "Smart Building Setup",
      subtitle:
        "Configure your tenant, site, and HVAC devices with AI-assisted onboarding.",
    }),
    []
  );

  const steps: Array<{
    key: Step;
    label: string;
    done: boolean;
  }> = [
    {
      key: "TENANT",
      label: "Tenant",
      done: doneTenant,
    },
    {
      key: "SITE",
      label: "Site",
      done: doneSite,
    },
    {
      key: "HVAC",
      label: "HVAC",
      done: doneHvac,
    },
    {
      key: "DONE",
      label: "Finish",
      done: step === "DONE",
    },
  ];

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
      const created = await api<SiteResponse>(
        `/api/tenants/${tenant.tenantId}/sites`,
        {
          method: "POST",
          body: JSON.stringify(values),
          auth: true,
        }
      );

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
      const created = await api<HvacResponse>(
        `/api/hvacs/${tenant.tenantId}/sites/${site.siteId}/hvacs`,
        {
          method: "POST",
          body: JSON.stringify(values),
          auth: true,
        }
      );

      setHvacs((prev) => [created, ...prev]);
    } catch (e: any) {
      setError(e?.message ?? "Failed to create HVAC");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bms-dashboard-bg min-h-full rounded-3xl p-6 text-white">
      <BmsCard variant="section" className="mb-8 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/80">
              <Sparkles className="h-4 w-4" />
              AI-Assisted Onboarding
            </p>

            <h1 className="mt-3 text-3xl font-bold text-white">
              {header.title}
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              {header.subtitle}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/4 px-4 py-3 text-sm text-slate-300">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Progress
            </p>
            <p className="mt-1 font-semibold text-cyan-100">
              {step === "DONE" ? "Completed" : `Current step: ${step}`}
            </p>
          </div>
        </div>
      </BmsCard>

      <div className="mb-8 flex flex-wrap gap-3">
        {steps.map((item, index) => {
          const active = step === item.key;

          return (
            <div
              key={item.key}
              className={[
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition",
                active
                  ? "border-cyan-300/40 bg-cyan-400/15 text-cyan-100 shadow-[0_0_28px_rgba(34,211,238,0.12)]"
                  : item.done
                    ? "border-emerald-300/30 bg-emerald-500/10 text-emerald-200"
                    : "border-white/10 bg-white/4 text-slate-400",
              ].join(" ")}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-current/30 text-xs">
                {item.done ? <CheckCircle2 className="h-3.5 w-3.5" /> : index + 1}
              </span>
              {item.label}
            </div>
          );
        })}
      </div>

      {error ? (
        <BmsCard
          variant="section"
          className="mb-6 border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300"
        >
          {error}
        </BmsCard>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6 xl:col-span-1"
        >
          <BmsCard variant="section" className="p-5">
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200/80">
                AI Assistant
              </p>
              <h2 className="mt-1 text-xl font-semibold text-white">
                Smart setup guidance
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Smart setup guidance for NZ building onboarding.
              </p>
            </div>

            <div className="space-y-4 text-sm text-slate-300">
              <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/4 p-4">
                <Sparkles className="mt-0.5 h-5 w-5 text-purple-400" />

                <div>
                  <p className="font-medium text-white">
                    Recommended structure
                  </p>
                  <p className="mt-1 text-slate-400">
                    Create tenant first, then site, then register HVAC devices
                    for mapping.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/4 p-4">
                <Wind className="mt-0.5 h-5 w-5 text-cyan-400" />

                <div>
                  <p className="font-medium text-white">HVAC estimate</p>
                  <p className="mt-1 text-slate-400">
                    Typical commercial floor coverage often needs multiple
                    units by zone and floor.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-cyan-400/10 bg-cyan-400/5 p-4 text-slate-200">
                💡 Tip: keep your HVAC deviceId aligned with edge-controller
                identifiers such as{" "}
                <span className="font-medium text-white">hvac-1</span>,{" "}
                <span className="font-medium text-white">hvac-2</span>.
              </div>
            </div>
          </BmsCard>

          <BmsCard variant="section" className="p-5">
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200/80">
                Live Summary
              </p>
              <h2 className="mt-1 text-xl font-semibold text-white">
                Created Records
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Backend-generated UUIDs appear here after creation.
              </p>
            </div>

            <div className="space-y-5 text-sm">
              <div>
                <div className="mb-2 flex items-center gap-2 font-medium text-white">
                  <Building2 className="h-4 w-4 text-blue-400" />
                  Tenant
                </div>

                {tenant ? (
                  <div className="space-y-1 text-slate-300">
                    <div>Name: {tenant.name}</div>
                    <div className="break-all text-slate-400">
                      tenantId: {tenant.tenantId}
                    </div>
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
                    <div className="break-all text-slate-400">
                      siteId: {site.siteId}
                    </div>
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
                    {hvacs.map((hvac) => (
                      <li
                        key={hvac.hvacId}
                        className="rounded-2xl border border-white/10 bg-white/4 p-4"
                      >
                        <div className="font-medium text-white">
                          {hvac.hvacName}
                        </div>
                        <div className="text-slate-300">
                          deviceId: {hvac.deviceId}
                        </div>
                        <div className="break-all text-slate-500">
                          hvacId: {hvac.hvacId}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-slate-500">None yet</div>
                )}
              </div>

              <div className="pt-2">
                <BmsButton
                  variant="secondary"
                  type="button"
                  onClick={resetSetup}
                  disabled={busy}
                >
                  Reset setup
                </BmsButton>
              </div>
            </div>
          </BmsCard>
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
            <BmsCard variant="section" className="p-5">
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200/80">
                  Setup complete
                </p>
                <h2 className="mt-1 text-xl font-semibold text-white">
                  Tenant, site, and HVAC registration completed
                </h2>
              </div>

              <div className="space-y-4 text-sm text-slate-300">
                <p>
                  Your tenant, site, and HVAC setup has been created
                  successfully. You can now continue to dashboard flows, device
                  mapping, or add more HVAC units.
                </p>

                <div className="flex flex-wrap gap-3">
                  <BmsButton
                    type="button"
                    variant="primary"
                    onClick={() => window.alert("Navigate to dashboard here")}
                  >
                    Go to Dashboard
                  </BmsButton>

                  <BmsButton
                    type="button"
                    variant="secondary"
                    onClick={() => setStep("HVAC")}
                  >
                    Add more HVACs
                  </BmsButton>
                </div>
              </div>
            </BmsCard>
          )}
        </motion.div>
      </div>
    </div>
  );
}