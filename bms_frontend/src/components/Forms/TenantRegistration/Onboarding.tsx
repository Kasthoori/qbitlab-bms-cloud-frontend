import { useMemo, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";
import { z } from "zod";
import TenantForm  from "./TenantForm";
import SiteForm from "./SiteForm";
import HvacForm from "./HvacForm";

// Types

type UUID = string;

export type TenantResponse = {
    tenantId: UUID;
    name: string;
};

export type SiteResponse = {
    siteId: UUID;
    tenantId: UUID;
    siteName: string;
};

export type HvacResponse = {
    hvacId: UUID;
    siteId: UUID;
    name: string;
    deviceId: string;
};

// API client (BASE URL)

const BASE_URL = import.meta.env.SPRING_API_BASE_URL ?? "http://localhost:8084";

async function api<T>(path: string, options?:RequestInit): Promise<T> {

    const res = await fetch(`${BASE_URL}${path}`, {
        headers: {
            "Content-Type": "application/json",
            ...(options?.headers ?? {}),
        },
        ...options,
    });

    if(!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Request failed (${res.status})`)
    }

    return (await res.json()) as T;
}

// Schemas (Validations)

export const tenantSchema = z.object({
    name: z.string().min(2, "Tenant name is required"),
    country: z.string().min(2, "Country is required"), 
    addressLine1: z.string().min(2, "Address line 1 is required"),
    city: z.string().min(2, "City is required"),
    postcode: z.string().min(2, "Postcode is required"),
});

export type TenantFormValues = z.infer<typeof tenantSchema>;

export const siteSchema = z.object({
    siteName: z.string().min(2, "Site name is required"),
    addressLine1: z.string().min(2, "Address line 1 is required"),
    city: z.string().min(2, "City is required"),
    postCode: z.string().min(2, "Post code is required"),
    timezone: z.string().min(2, "Timezone is required"),
});

export type SiteFormValues = z.infer<typeof siteSchema>;

export const hvacSchema = z.object({
    name: z.string().min(2, "HVAC name is required"),
    deviceId: z.string().min(2, "Device ID is required"),
    unitType: z.enum(["AHU", "SPLIT", "VRF", "FAN_COIL", "OTHER"]),
    protocol: z.enum(["BACNET", "MODBUS", "SIMULATED"]),
    zone: z.string().optional(),
});

export type HvacFormValues = z.infer<typeof hvacSchema>;

// Small UI Helpers

export function Card({
    title,
    subtitle,
    children,
}: {
    title: string;
    subtitle?: string;
    children: ReactNode;
}) {

    return (
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-100 p-5">
                <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
                {subtitle && <p className="mt-1 text-sm text-zinc-600">{subtitle}</p>}
            </div>
            <div className="p-5">{children}</div>
        </div>
    );

}

export function Field({
    label,
    error,
    children,
}: {
    label: string;
    error?: string;
    children: ReactNode;
}) {

    return (
        <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-800">{label}</label>
            {children}
            {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
    );

}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {

    return (
        <input
            {...props}
            className={[
                "w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900",
                "outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200",
                props.className ?? "",
            ].join(" ")}
        
        />
    );

}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
   
    return (
        <select
            {...props}
            className={[
                "w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900",
                "outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200",
                props.className ?? "",
            ].join(" ")}
        />
    );
}

export function Button({
    children,
    variant = "primary",
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "danger";
}) {

    const base = "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition border";

    const styles = 
        variant === "primary"
            ? "border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-800"
            : variant === "danger"
                ? "border-red-600 bg-red-600 text-white hover:bg-red-700"
                : "border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50";

    return (
        <button
            {...props}
            className={[base, styles, props.className ?? ""].join(" ")}
        >
            {children}
        </button>
    );

}

function StepPill({
    active,
    done,
    label
}: {
    active: boolean;
    done: boolean;
    label: string;
}) {

    return (
        <div
            className={[
                "flex items-center gap-2 rounded-full border px-3 py-1 text-sm",
                active ? "border-zinc-900 bg-zinc-900 text-white" : done ? "border-zinc-300 bg-zinc-50 text-zinc-700" : "border-zinc-200 bg-white text-zinc-600",

            ].join(" ")}
        >
            <span className="inline-block size-2 rounded-full bg-current opacity-70" />
            <span>{label}</span>
        </div>
    );

}

// Main Page
type Step = "TENANT" | "SITE" | "HVAC" | "DONE";


export default function Onboarding() {

    const [step, setStep] = useState<Step>("TENANT");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [tenant, setTenant] = useState<TenantResponse | null>(null);
    const [site, setSite] = useState<SiteResponse | null>(null);
    const [hvacs, setHvacs] = useState<HvacResponse[]>([]);

    const doneTenant = !!tenant;
    const doneSite = !!site;
    const doneHvac = hvacs.length > 0;

    const header = useMemo(() => {
        return {
            title: "BMS Setup",
            subtitle: "Create a tenant, add site, then register HVAC units under site",
        }
    
    }, []);

    return (
        <div className="min-h-screen bg-zinc-50">
            <div className="mx-auto max-w-5xl px-4 py-10">
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-zinc-900">{header.title}</h1>
                    <p className="mt-1 text-zinc-600">{header.subtitle}</p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                    <StepPill label="Tenant" active={step === "TENANT"} done={doneTenant} />
                    <StepPill label="Site" active={step === "SITE"} done={doneSite} />
                    <StepPill label="HVAC" active={step === "HVAC"} done={doneHvac} />
                    <StepPill label="Finish" active={step === "DONE"} done={step === "DONE"} />
                </div>
            </div>

            {error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}


            <div className="grid gap-6 md:grid-cols-3">
                {/* Left: Summary */}
                <div className="md:col-span-1">
                    <Card title="Summary" subtitle="Backend-generated UUID will appear here.">
                        <div className="space-y-4 text-sm">
                            <div>
                                <div className="font-medium text-zinc-900">Tenant</div>
                                {tenant ? (
                                    <div className="mt-1 space-y-1 text-zinc-700">
                                        <div>Name: {tenant.name}</div>
                                        <div className="break-all">tenantId: {tenant.tenantId}</div>
                                    </div>
                                ) : (
                                    <div className="mt-1 text-zinc-500">Not created yet</div>
                                )}
                            </div>



                            <div>
                                <div className="font-medium text-zinc-900">Site</div>
                                {site ? (
                                    <div className="mt-1 space-y-1 text-zinc-700">
                                    <div>Name: {site.siteName}</div>
                                    <div className="break-all">siteId: {site.siteId}</div>
                                    </div>
                                ) : (
                                    <div className="mt-1 text-zinc-500">Not created yet</div>
                                )}
                            </div>

                            <div>
                                <div className="font-medium text-zinc-900">HVAC Units</div>
                                {hvacs.length ? (
                                    <ul className="mt-1 space-y-2">
                                    {hvacs.map((h) => (
                                        <li key={h.hvacId} className="rounded-xl border border-zinc-200 bg-white p-3">
                                        <div className="font-medium text-zinc-900">{h.name}</div>
                                        <div className="text-zinc-700">deviceId: {h.deviceId}</div>
                                        <div className="break-all text-zinc-500">hvacId: {h.hvacId}</div>
                                        </li>
                                    ))}
                                    </ul>
                                ) : (
                                    <div className="mt-1 text-zinc-500">None yet</div>
                                )}
                            </div>

                            <div className="pt-2">
                                <Button
                                    variant="secondary"
                                    type="button"
                                    onClick={() => {
                                    setTenant(null);
                                    setSite(null);
                                    setHvacs([]);
                                    setStep("TENANT");
                                    setError(null);
                                    }}
                                    disabled={busy}
                                >
                                    Reset setup
                                </Button>
                            </div>
                        </div>
                    </Card>

                </div>

                {/* Right: Forms */}

                <div className="md:col-span-2 space-y-6">
                    {step === "TENANT" && (
                        <TenantForm
                            busy={busy}
                            onSubmit={async (values: any) => {
                                setError(null);
                                setBusy(true);
                                try {
                                    // Adjust to backend route + response shape
                                    const created = await api<TenantResponse>("/api/tenant", {
                                        method: "POST",
                                        body: JSON.stringify(values),
                                    });
                                    setTenant(created);
                                    setStep("SITE");
                                
                                } catch (e: any) {
                                    setError(e?.message ?? "Failed to create tenant");
                                } finally {
                                    setBusy(false);
                                }
                            }}
                        />
                    )}

                    {step === "SITE" && tenant && (
                        <SiteForm 
                            busy={busy}
                            tenant={tenant}
                            onBack={() => setStep("TENANT")}
                            onSubmit={async (values: any) => {
                                setError(null);
                                setBusy(true);
                                try {
                                    const created = await api<SiteResponse>(`/api/tenants/${tenant.tenantId}/sites`, {
                                        method: "POST",
                                        body: JSON.stringify(values),
                                    });
                                    setSite(created);
                                    setStep("HVAC");
                                } catch(e: any) {
                                    setError(e?.message ?? "Failed to create site");
                                } finally {
                                    setBusy(false);
                                }
                            }}
                        />
                    )}

                    {step === "HVAC" && tenant && site && (

                        <HvacForm 
                            busy={busy}
                            tenant={tenant}
                            site={site}
                            onBack={() => setStep("SITE")}
                            onAdd={async (values: any) => {
                                setError(null);
                                setBusy(true)
                                try{
                                    const created = await api<HvacResponse>(`/api/sites/${site.siteId}/hvacs`, {
                                        method: "POST",
                                        body: JSON.stringify(values)
                                    });

                                    setHvacs((prev) => [created, ...prev]);
                                } catch (e: any) {
                                    setError(e?.message ?? "Failed to create HVAC");
                                } finally {
                                    setBusy(false);
                                }
                            }}

                            onFinish={() => setStep("DONE")}
                        
                        />
                    )}

                    {step === "DONE" && (
                        <Card title="Setup complete" subtitle="You can now navigate to your dashboard.">
                            <div className="space-y-3 text-sm text-zinc-700">
                            <p>
                                Tenant, site, and HVAC registrations are done. Your backend generated UUIDs are stored and ready for
                                telemetry mapping.
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <Button variant="primary" type="button" onClick={() => alert("Navigate to dashboard here")}>
                                Go to Dashboard
                                </Button>
                                <Button variant="secondary" type="button" onClick={() => setStep("HVAC")}>
                                Add more HVACs
                                </Button>
                            </div>
                            </div>
                        </Card>
                    )

                    }
                </div>

            </div>
        </div>
    );
}