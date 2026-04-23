/* eslint-disable @typescript-eslint/no-explicit-any */
import { motion } from "framer-motion";
import {
  Bell,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  Shield,
  User2,
  UserCog,
  Wrench,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type JSX } from "react";
import { BmsApi } from "@/api/bms";
import type {
  BmsUserResponse,
  CreateBmsUserRequest,
  UserRole,
} from "@/types/userManagement";

interface TenantDto {
  tenantId: number | string;
  name: string;
}

interface SiteDto {
  siteId: string;
  siteName: string;
}

type FormErrors = Partial<
  Record<keyof CreateBmsUserRequest | "general" | "siteIds", string>
>;

const ROLE_OPTIONS: { value: UserRole; label: string; icon: JSX.Element }[] = [
  { value: "ADMIN", label: "Admin", icon: <Shield size={16} /> },
  { value: "BMS_ADMIN", label: "BMS Admin", icon: <UserCog size={16} /> },
  { value: "TECHNICIAN", label: "Technician", icon: <Wrench size={16} /> },
  { value: "FACILITY_MANAGER", label: "Facility Manager", icon: <Building2 size={16} /> },
];

const initialForm: CreateBmsUserRequest = {
  username: "",
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  displayName: "",
  role: "TECHNICIAN",
  tenantId: null,
  siteIds: [],
  notificationEnabled: true,
  enabled: true,
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function UserForm() {
  const [form, setForm] = useState<CreateBmsUserRequest>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [createdUser, setCreatedUser] = useState<BmsUserResponse | null>(null);

  const [showPassword, setShowPassword] = useState(false);

  const [tenants, setTenants] = useState<TenantDto[]>([]);
  const [sites, setSites] = useState<SiteDto[]>([]);

  const [loadingTenants, setLoadingTenants] = useState(false);
  const [loadingSites, setLoadingSites] = useState(false);

  const fullName = useMemo(() => {
    const joined = `${form.firstName ?? ""} ${form.lastName ?? ""}`.trim();
    return form.displayName?.trim() || joined || "Preview User";
  }, [form.firstName, form.lastName, form.displayName]);

  const isTenantRequired =
    form.role === "TECHNICIAN" || form.role === "FACILITY_MANAGER";

  const isSiteRequired = form.role === "TECHNICIAN";

  useEffect(() => {
    const loadTenants = async () => {
      try {
        setLoadingTenants(true);
        const response = await BmsApi.getMyTenants();
        setTenants(response.content ?? []);
      } catch (error) {
        console.error("Failed to load tenants", error);
        setErrors((prev) => ({
          ...prev,
          general: "Failed to load tenants.",
        }));
      } finally {
        setLoadingTenants(false);
      }
    };

    loadTenants();
  }, []);

  useEffect(() => {
    const loadSites = async () => {
      if (!form.tenantId) {
        setSites([]);
        return;
      }

      try {
        setLoadingSites(true);
        const response = await BmsApi.getSitesByTenant(form.tenantId);
        setSites(response ?? []);
      } catch (error) {
        console.error("Failed to load sites", error);
        setErrors((prev) => ({
          ...prev,
          general: "You do not have access to this tenant.",
        }));
      } finally {
        setLoadingSites(false);
      }
    };

    loadSites();
  }, [form.tenantId]);

  useEffect(() => {
    if (!isTenantRequired) {
      setForm((prev) => ({
        ...prev,
        tenantId: null,
        siteIds: [],
      }));
      setSites([]);
      return;
    }

    if (!isSiteRequired) {
      setForm((prev) => ({
        ...prev,
        siteIds: [],
      }));
    }
  }, [form.role, isTenantRequired, isSiteRequired]);

  const updateField = <K extends keyof CreateBmsUserRequest>(
    key: K,
    value: CreateBmsUserRequest[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({
      ...prev,
      [key]: undefined,
      siteIds: undefined,
      general: undefined,
    }));
  };

  const toggleSite = (siteId: string) => {
    const current = form.siteIds ?? [];
    const exists = current.includes(siteId);

    if (exists) {
      updateField(
        "siteIds",
        current.filter((id) => id !== siteId)
      );
    } else {
      updateField("siteIds", [...current, siteId]);
    }
  };

  const validate = () => {
    const nextErrors: FormErrors = {};

    if (!form.username.trim()) {
      nextErrors.username = "Username is required.";
    }

    if (!form.email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!isValidEmail(form.email.trim())) {
      nextErrors.email = "Please enter a valid email address.";
    }

    if (!form.password.trim()) {
      nextErrors.password = "Password is required.";
    } else if (form.password.trim().length < 6) {
      nextErrors.password = "Password must be at least 6 characters.";
    }

    if (isTenantRequired && !form.tenantId) {
      nextErrors.tenantId = "Tenant is required for this role.";
    }

    if (isSiteRequired && (!form.siteIds || form.siteIds.length === 0)) {
      nextErrors.siteIds = "At least one site is required for TECHNICIAN.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const normalizePayload = (): CreateBmsUserRequest => ({
    username: form.username.trim(),
    email: form.email.trim(),
    password: form.password.trim(),
    firstName: form.firstName?.trim() || "",
    lastName: form.lastName?.trim() || "",
    displayName: form.displayName?.trim() || "",
    role: form.role,
    tenantId: form.tenantId || null,
    siteIds: form.siteIds ?? [],
    notificationEnabled: form.notificationEnabled,
    enabled: form.enabled,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setSaving(true);
      setCreatedUser(null);

      const response = await BmsApi.createBmsUser(normalizePayload());

      setCreatedUser(response);
      setForm(initialForm);
      setSites([]);
      setErrors({});
    } catch (error: any) {
      console.error("Failed to create BMS user", error);

      setErrors({
        general:
          error?.message ||
          "Failed to create user. Please check backend validation and try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative overflow-hidden rounded-3xl border border-white/15 bg-white/10 p-6 shadow-2xl backdrop-blur-xl"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.12),transparent_22%)]" />

        <div className="relative z-10">
          <div className="mb-6 flex flex-col gap-3 border-b border-white/10 pb-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-cyan-200/80">
                User Management
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                Create BMS User
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">
                Create users with role based access, tenant assignment, and multi-site assignment for technicians.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">
              <CheckCircle2 size={16} />
              Keycloak + DB sync
            </div>
          </div>

          {errors.general && (
            <div className="mb-5 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {errors.general}
            </div>
          )}

          {createdUser && (
            <div className="mb-5 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              User created successfully for <strong>{createdUser.email}</strong>.
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-2">
            <Field
              label="Username"
              icon={<User2 size={16} />}
              value={form.username}
              onChange={(v) => updateField("username", v)}
              placeholder="Enter username"
              error={errors.username}
              required
            />

            <Field
              label="Email"
              icon={<Mail size={16} />}
              value={form.email}
              onChange={(v) => updateField("email", v)}
              placeholder="Enter email address"
              error={errors.email}
              required
              type="email"
            />

            <div className="md:col-span-2">
              <PasswordField
                label="Password"
                value={form.password}
                onChange={(v) => updateField("password", v)}
                placeholder="Enter password"
                error={errors.password}
                required
                showPassword={showPassword}
                setShowPassword={setShowPassword}
              />
            </div>

            <Field
              label="First Name"
              value={form.firstName ?? ""}
              onChange={(v) => updateField("firstName", v)}
              placeholder="Enter first name"
              error={errors.firstName}
            />

            <Field
              label="Last Name"
              value={form.lastName ?? ""}
              onChange={(v) => updateField("lastName", v)}
              placeholder="Enter last name"
              error={errors.lastName}
            />

            <div className="md:col-span-2">
              <Field
                label="Display Name"
                value={form.displayName ?? ""}
                onChange={(v) => updateField("displayName", v)}
                placeholder="Optional friendly display name"
                error={errors.displayName}
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-200">
                Role <span className="text-cyan-300">*</span>
              </label>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {ROLE_OPTIONS.map((role) => {
                  const active = form.role === role.value;

                  return (
                    <button
                      type="button"
                      key={role.value}
                      onClick={() => updateField("role", role.value)}
                      className={`rounded-2xl border px-4 py-4 text-left transition ${
                        active
                          ? "border-cyan-300/40 bg-cyan-400/15 shadow-lg shadow-cyan-500/10"
                          : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                      }`}
                    >
                      <div className="mb-3 inline-flex rounded-xl border border-white/10 bg-white/10 p-2 text-slate-100">
                        {role.icon}
                      </div>
                      <div className="text-sm font-semibold text-white">
                        {role.label}
                      </div>
                      <div className="mt-1 text-xs text-slate-300">
                        {role.value.replaceAll("_", " ")}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {isTenantRequired && (
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Tenant <span className="text-cyan-300">*</span>
                </label>

                <select
                  value={form.tenantId ?? ""}
                  onChange={(e) => {
                    const tenantId = e.target.value || null;
                    updateField("tenantId", tenantId);
                    updateField("siteIds", []);
                  }}
                  disabled={loadingTenants}
                  className={`w-full rounded-2xl border bg-white/5 px-4 py-3 text-sm text-white outline-none transition ${
                    errors.tenantId
                      ? "border-red-400/30"
                      : "border-white/10 hover:border-white/20 focus:border-cyan-300/35"
                  }`}
                >
                  <option value="" className="bg-slate-900 text-slate-300">
                    {loadingTenants ? "Loading tenants..." : "Select tenant"}
                  </option>

                  {tenants.map((tenant) => (
                    <option
                      key={String(tenant.tenantId)}
                      value={String(tenant.tenantId)}
                      className="bg-slate-900 text-white"
                    >
                      {tenant.name}
                    </option>
                  ))}
                </select>

                {errors.tenantId && (
                  <p className="mt-2 text-sm text-red-300">{errors.tenantId}</p>
                )}
              </div>
            )}

            {isSiteRequired && (
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Assigned Sites <span className="text-cyan-300">*</span>
                </label>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  {!form.tenantId ? (
                    <p className="text-sm text-slate-400">Select tenant first</p>
                  ) : loadingSites ? (
                    <p className="text-sm text-slate-400">Loading sites...</p>
                  ) : sites.length === 0 ? (
                    <p className="text-sm text-slate-400">No sites available for this tenant</p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {sites.map((site) => {
                        const checked = form.siteIds?.includes(site.siteId) ?? false;

                        return (
                          <label
                            key={site.siteId}
                            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition hover:bg-white/10"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleSite(site.siteId)}
                              className="h-4 w-4 rounded border-white/20 bg-transparent"
                            />

                            <div className="flex min-w-0 flex-col">
                              <span className="truncate font-medium">{site.siteName}</span>
                              <span className="truncate text-xs text-slate-400">
                                {site.siteId}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                {form.siteIds && form.siteIds.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {form.siteIds.map((siteId) => {
                      const site = sites.find((s) => s.siteId === siteId);

                      return (
                        <span
                          key={siteId}
                          className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100"
                        >
                          {site?.siteName || siteId}
                          <button
                            type="button"
                            onClick={() =>
                              updateField(
                                "siteIds",
                                (form.siteIds ?? []).filter((id) => id !== siteId)
                              )
                            }
                            className="text-cyan-200 transition hover:text-white"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                {errors.siteIds && (
                  <p className="mt-2 text-sm text-red-300">{errors.siteIds}</p>
                )}
              </div>
            )}

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-xl border border-white/10 bg-white/10 p-2 text-cyan-200">
                  <Bell size={16} />
                </div>

                <div className="flex-1">
                  <p className="font-medium text-white">Notifications</p>
                  <p className="mt-1 text-sm text-slate-300">
                    Enable notifications for this user.
                  </p>
                </div>

                <Toggle
                  checked={form.notificationEnabled}
                  onChange={(checked) =>
                    updateField("notificationEnabled", checked)
                  }
                />
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-xl border border-white/10 bg-white/10 p-2 text-emerald-200">
                  <CheckCircle2 size={16} />
                </div>

                <div className="flex-1">
                  <p className="font-medium text-white">Enabled</p>
                  <p className="mt-1 text-sm text-slate-300">
                    Activate this user immediately.
                  </p>
                </div>

                <Toggle
                  checked={form.enabled}
                  onChange={(checked) => updateField("enabled", checked)}
                />
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={() => {
                setForm(initialForm);
                setSites([]);
                setErrors({});
                setCreatedUser(null);
              }}
              className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10"
            >
              Reset
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-300/30 bg-cyan-400/20 px-5 py-3 text-sm font-semibold text-cyan-50 transition hover:bg-cyan-400/25 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Creating User...
                </>
              ) : (
                <>
                  <UserCog size={16} />
                  Create User
                </>
              )}
            </button>
          </div>
        </div>
      </motion.form>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="overflow-hidden rounded-3xl border border-white/15 bg-white/10 p-6 shadow-2xl backdrop-blur-xl"
      >
        <div className="mb-5">
          <p className="text-sm uppercase tracking-[0.28em] text-fuchsia-200/80">
            Live Preview
          </p>
          <h3 className="mt-2 text-xl font-semibold text-white">
            User Access Card
          </h3>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.9),rgba(30,41,59,0.75))] p-5">
          <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-fuchsia-400/10 blur-3xl" />

          <div className="relative z-10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
                  BMS Identity
                </p>
                <h4 className="mt-2 text-2xl font-semibold text-white">
                  {fullName}
                </h4>
                <p className="mt-1 text-sm text-slate-300">
                  @{form.username || "username"}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 p-3 text-cyan-100">
                <User2 size={24} />
              </div>
            </div>

            <div className="mt-6 space-y-3 text-sm">
              <InfoRow label="Email" value={form.email || "user@company.com"} />
              <InfoRow label="Role" value={form.role.replaceAll("_", " ")} />
              <InfoRow
                label="Tenant"
                value={
                  tenants.find((t) => String(t.tenantId) === form.tenantId)?.name ||
                  "Not assigned"
                }
              />
              <InfoRow
                label="Sites"
                value={
                  form.siteIds && form.siteIds.length > 0
                    ? form.siteIds
                        .map((id) => sites.find((s) => s.siteId === id)?.siteName || id)
                        .join(", ")
                    : "Not assigned"
                }
              />
              <InfoRow
                label="Notifications"
                value={form.notificationEnabled ? "Enabled" : "Disabled"}
              />
              <InfoRow
                label="Account Status"
                value={form.enabled ? "Active" : "Inactive"}
              />
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm font-medium text-white">Role Rules</p>

          <div className="mt-3 space-y-2 text-sm text-slate-300">
            <p>Admin: no tenant or site required</p>
            <p>BMS Admin: no tenant or site required</p>
            <p>Facility Manager: tenant required</p>
            <p>Technician: tenant required and one or more sites required</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  error,
  required,
  type = "text",
  icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  type?: React.HTMLInputTypeAttribute;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-200">
        {label} {required && <span className="text-cyan-300">*</span>}
      </label>

      <div
        className={`flex items-center gap-3 rounded-2xl border bg-white/5 px-4 py-3 backdrop-blur-md transition ${
          error
            ? "border-red-400/30"
            : "border-white/10 hover:border-white/20 focus-within:border-cyan-300/35"
        }`}
      >
        {icon && <div className="text-slate-400">{icon}</div>}

        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 outline-none"
        />
      </div>

      {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  placeholder,
  error,
  required,
  showPassword,
  setShowPassword,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  showPassword: boolean;
  setShowPassword: (value: boolean) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-200">
        {label} {required && <span className="text-cyan-300">*</span>}
      </label>

      <div
        className={`flex items-center gap-3 rounded-2xl border bg-white/5 px-4 py-3 backdrop-blur-md transition ${
          error
            ? "border-red-400/30"
            : "border-white/10 hover:border-white/20 focus-within:border-cyan-300/35"
        }`}
      >
        <div className="text-slate-400">
          <KeyRound size={16} />
        </div>

        <input
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 outline-none"
        />

        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="text-slate-400 transition hover:text-white"
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-14 rounded-full transition ${
        checked ? "bg-cyan-400/60" : "bg-white/15"
      }`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-md transition ${
          checked ? "left-8" : "left-1"
        }`}
      />
    </button>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <span className="text-slate-400">{label}</span>
      <span className="max-w-[60%] truncate text-right text-white">{value}</span>
    </div>
  );
}