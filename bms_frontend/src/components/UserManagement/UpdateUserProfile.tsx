/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState, type JSX } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  Save,
  Search,
  Shield,
  User,
  User2,
  UserCog,
  Wrench,
  X,
} from "lucide-react";

import { BmsApi } from "@/api/bms";
import type {
  BmsUserResponse,
  CreateBmsUserRequest,
  UserRole,
} from "@/types/userManagement";

interface TenantDto {
  tenantId: string;
  name: string;
}

interface SiteDto {
  siteId: string;
  siteName: string;
}

type SitesByTenant = Record<string, SiteDto[]>;
type SearchByTenant = Record<string, string>;

type FormErrors = Partial<
  Record<keyof CreateBmsUserRequest | "general" | "selectedUser", string>
>;

const TENANT_PAGE_SIZE = 50;
const MAX_TENANT_PAGES = 100;
const SITE_PAGE_SIZE = 50;
const MAX_SITE_PAGES = 100;

const ROLE_OPTIONS: { value: UserRole; label: string; icon: JSX.Element }[] = [
  { value: "ADMIN", label: "Admin", icon: <Shield size={16} /> },
  { value: "BMS_ADMIN", label: "BMS Admin", icon: <UserCog size={16} /> },
  { value: "TECHNICIAN", label: "Technician", icon: <Wrench size={16} /> },
  { value: "SITE_MANAGER", label: "Site Manager", icon: <Building2 size={16} /> },
  {
    value: "FACILITY_MANAGER",
    label: "Facility Manager",
    icon: <Building2 size={16} />,
  },
];

const emptyForm: CreateBmsUserRequest = {
  username: "",
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  displayName: "",
  phoneNumber: "",
  role: "TECHNICIAN",
  tenantIds: [],
  sites: [],
  notificationEnabled: true,
  enabled: true,
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPhone(value: string) {
  return /^[0-9+\-\s()]{8,20}$/.test(value);
}

export default function UpdateUserProfile() {
  const [users, setUsers] = useState<BmsUserResponse[]>([]);
  const [selectedUser, setSelectedUser] = useState<BmsUserResponse | null>(null);
  const [form, setForm] = useState<CreateBmsUserRequest>(emptyForm);

  const [tenants, setTenants] = useState<TenantDto[]>([]);
  const [sitesByTenant, setSitesByTenant] = useState<SitesByTenant>({});

  const [userSearch, setUserSearch] = useState("");
  const [tenantSearch, setTenantSearch] = useState("");
  const [siteSearchByTenant, setSiteSearchByTenant] = useState<SearchByTenant>(
    {}
  );
  const [expandedTenantIds, setExpandedTenantIds] = useState<string[]>([]);

  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingTenants, setLoadingTenants] = useState(false);
  const [loadingSitesTenantId, setLoadingSitesTenantId] = useState<string | null>(
    null
  );
  const [saving, setSaving] = useState(false);

  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const isTenantRequired =
    form.role === "TECHNICIAN" || form.role === "FACILITY_MANAGER" || form.role === "SITE_MANAGER";

  const isSiteRequired = form.role === "TECHNICIAN";

  const filteredUsers = useMemo(() => {
    const keyword = userSearch.trim().toLowerCase();

    if (!keyword) return users;

    return users.filter((user) => {
      return (
        user.username?.toLowerCase().includes(keyword) ||
        user.email?.toLowerCase().includes(keyword) ||
        user.displayName?.toLowerCase().includes(keyword) ||
        user.firstName?.toLowerCase().includes(keyword) ||
        user.lastName?.toLowerCase().includes(keyword)
      );
    });
  }, [users, userSearch]);

  const filteredTenants = useMemo(() => {
    const keyword = tenantSearch.trim().toLowerCase();

    if (!keyword) return tenants;

    return tenants.filter((tenant) => {
      return (
        tenant.name.toLowerCase().includes(keyword) ||
        tenant.tenantId.toLowerCase().includes(keyword)
      );
    });
  }, [tenants, tenantSearch]);

  const selectedTenantNames = useMemo(() => {
    return form.tenantIds
      .map(
        (tenantId) =>
          tenants.find((tenant) => tenant.tenantId === tenantId)?.name ||
          tenantId
      )
      .join(", ");
  }, [form.tenantIds, tenants]);

  const selectedSiteNames = useMemo(() => {
    return form.sites
      .map((selected) => {
        const site = sitesByTenant[selected.tenantId]?.find(
          (s) => s.siteId === selected.siteId
        );
        return site?.siteName || selected.siteId;
      })
      .join(", ");
  }, [form.sites, sitesByTenant]);

  useEffect(() => {
    loadUsers();
    loadTenants();
  }, []);

  useEffect(() => {
    if (!selectedUser) return;

    const nextForm: CreateBmsUserRequest = {
      username: selectedUser.username ?? "",
      email: selectedUser.email ?? "",
      password: "",
      firstName: selectedUser.firstName ?? "",
      lastName: selectedUser.lastName ?? "",
      displayName: selectedUser.displayName ?? "",
      phoneNumber: selectedUser.phoneNumber ?? "",
      role: selectedUser.role,
      tenantIds: selectedUser.tenantIds ?? [],
      sites: selectedUser.sites ?? [],
      notificationEnabled: selectedUser.notificationEnabled,
      enabled: selectedUser.enabled,
    };

    setForm(nextForm);
    setErrors({});
    //setSuccessMessage("");

    const tenantIdsToExpand = nextForm.tenantIds ?? [];
    setExpandedTenantIds(tenantIdsToExpand);

    tenantIdsToExpand.forEach((tenantId) => {
      void loadAllSitesForTenant(tenantId);
    });
  }, [selectedUser]);

  useEffect(() => {
    if (!isTenantRequired) {
      setForm((prev) => ({
        ...prev,
        tenantIds: [],
        sites: [],
      }));
      setExpandedTenantIds([]);
      return;
    }

    if (!isSiteRequired) {
      setForm((prev) => ({
        ...prev,
        sites: [],
      }));
    }
  }, [form.role, isTenantRequired, isSiteRequired]);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      setErrors({});
      const response = await BmsApi.getBmsUsers();
      setUsers(response.content ?? []);
    } catch (error: any) {
      setErrors({
        general: error?.message || "Failed to load users.",
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadTenants = async () => {
    try {
      setLoadingTenants(true);

      const allTenants: TenantDto[] = [];
      const seenTenantIds = new Set<string>();

      let page = 0;
      let totalPages = 1;

      while (page < totalPages && page < MAX_TENANT_PAGES) {
        const response = await BmsApi.getMyTenants(page, TENANT_PAGE_SIZE);
        const content = response.content ?? [];

        for (const tenant of content) {
          const tenantId = String(tenant.tenantId);

          if (!seenTenantIds.has(tenantId)) {
            seenTenantIds.add(tenantId);
            allTenants.push({
              tenantId,
              name: tenant.name,
            });
          }
        }

        totalPages = response.totalPages ?? 1;
        page += 1;

        if (content.length === 0) break;
      }

      setTenants(allTenants);
    } catch (error: any) {
      setErrors({
        general: error?.message || "Failed to load tenants.",
      });
    } finally {
      setLoadingTenants(false);
    }
  };

  const loadAllSitesForTenant = async (
    tenantId: string,
    forceReload = false
  ) => {
    if (!forceReload && sitesByTenant[tenantId]) return;

    try {
      setLoadingSitesTenantId(tenantId);

      const allSites: SiteDto[] = [];
      const seenSiteIds = new Set<string>();

      let page = 0;
      let totalPages = 1;

      while (page < totalPages && page < MAX_SITE_PAGES) {
        const response = await BmsApi.getSitesByTenant(
          tenantId,
          page,
          SITE_PAGE_SIZE
        );

        const content: SiteDto[] = Array.isArray(response)
          ? response
          : response.content ?? [];

        for (const site of content) {
          if (!seenSiteIds.has(site.siteId)) {
            seenSiteIds.add(site.siteId);
            allSites.push(site);
          }
        }

        totalPages = Array.isArray(response) ? 1 : response.totalPages ?? 1;
        page += 1;

        if (content.length === 0) break;
      }

      setSitesByTenant((prev) => ({
        ...prev,
        [tenantId]: allSites,
      }));
    } catch (error: any) {
      setErrors({
        general: error?.message || "Failed to load sites.",
      });
    } finally {
      setLoadingSitesTenantId(null);
    }
  };

  const updateField = <K extends keyof CreateBmsUserRequest>(
    key: K,
    value: CreateBmsUserRequest[K]
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [key]: undefined,
      general: undefined,
      selectedUser: undefined,
    }));

    setSuccessMessage("");
  };

  const selectUser = (user: BmsUserResponse) => {
    setSelectedUser(user);
  };

  const toggleTenant = async (tenantId: string) => {
    const exists = form.tenantIds.includes(tenantId);

    if (exists) {
      updateField(
        "tenantIds",
        form.tenantIds.filter((id) => id !== tenantId)
      );

      updateField(
        "sites",
        form.sites.filter((site) => site.tenantId !== tenantId)
      );

      setExpandedTenantIds((prev) => prev.filter((id) => id !== tenantId));
      return;
    }

    updateField("tenantIds", [...form.tenantIds, tenantId]);
    setExpandedTenantIds((prev) =>
      prev.includes(tenantId) ? prev : [...prev, tenantId]
    );
    await loadAllSitesForTenant(tenantId);
  };

  const toggleExpandTenant = async (tenantId: string) => {
    const expanded = expandedTenantIds.includes(tenantId);

    if (expanded) {
      setExpandedTenantIds((prev) => prev.filter((id) => id !== tenantId));
      return;
    }

    setExpandedTenantIds((prev) => [...prev, tenantId]);
    await loadAllSitesForTenant(tenantId);
  };

 const toggleSite = (tenantId: string, siteId: string) => {
    const exists = form.sites.some(
        (site) => site.tenantId === tenantId && site.siteId === siteId
    );

    if (exists) {
        updateField(
        "sites",
        form.sites.filter(
            (site) => !(site.tenantId === tenantId && site.siteId === siteId)
        )
        );
        return;
    }

    if (!form.tenantIds.includes(tenantId)) {
        updateField("tenantIds", [...form.tenantIds, tenantId]);
    }

    // ✅ FINAL SAFE ADD
    const updated = [
        ...form.sites,
        { tenantId, siteId }
    ];

    const unique = Array.from(
        new Map(
        updated.map(s => [`${s.tenantId}-${s.siteId}`, s])
        ).values()
    );

    updateField("sites", unique);
};

  const removeSiteChip = (tenantId: string, siteId: string) => {
    updateField(
      "sites",
      form.sites.filter(
        (site) => !(site.tenantId === tenantId && site.siteId === siteId)
      )
    );
  };

  const isSiteChecked = (tenantId: string, siteId: string) => {
    return form.sites.some(
      (site) => site.tenantId === tenantId && site.siteId === siteId
    );
  };

  const getFilteredSites = (tenantId: string) => {
    const sites = sitesByTenant[tenantId] ?? [];
    const keyword = (siteSearchByTenant[tenantId] ?? "").trim().toLowerCase();

    if (!keyword) return sites;

    return sites.filter((site) => {
      return (
        site.siteName.toLowerCase().includes(keyword) ||
        site.siteId.toLowerCase().includes(keyword)
      );
    });
  };

  const validate = () => {
    const nextErrors: FormErrors = {};

    if (!selectedUser) {
      nextErrors.selectedUser = "Please select a user to edit.";
    }

    if (!form.username.trim()) {
      nextErrors.username = "Username is required.";
    }

    if (!form.email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!isValidEmail(form.email.trim())) {
      nextErrors.email = "Please enter a valid email address.";
    }

    if (
      (form.role === "TECHNICIAN" || form.role === "FACILITY_MANAGER") &&
      !form.phoneNumber?.trim()
      ) {
        nextErrors.phoneNumber = "Phone number is required for SMS alerts.";
      } else if (
        form.phoneNumber?.trim() &&
        !isValidPhone(form.phoneNumber.trim())
      ) {
        nextErrors.phoneNumber = "Please enter a valid phone number.";
      }

    if (form.password && form.password.trim().length > 0 && form.password.trim().length < 6) {
      nextErrors.password = "Password must be at least 6 characters.";
    }

    if (isTenantRequired && form.tenantIds.length === 0) {
      nextErrors.tenantIds = "At least one tenant is required for this role.";
    }

    if (isSiteRequired && form.sites.length === 0) {
      nextErrors.sites = "At least one site is required for TECHNICIAN.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const normalizePayload = (): CreateBmsUserRequest => {
    const uniqueSites = Array.from(
        new Map(
        form.sites.map((site) => [
            `${site.tenantId}-${site.siteId}`,
            site,
        ])
        ).values()
    );

    return {
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password.trim(),
        firstName: form.firstName?.trim() || "",
        lastName: form.lastName?.trim() || "",
        displayName: form.displayName?.trim() || "",
        phoneNumber: form.phoneNumber?.trim() || "",
        role: form.role,
        tenantIds: isTenantRequired ? form.tenantIds : [],
        sites: isSiteRequired ? uniqueSites : [],
        notificationEnabled: form.notificationEnabled,
        enabled: form.enabled,
    };
};

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

    if (!validate() || !selectedUser) return;

    try {
        setSaving(true);
        setSuccessMessage("");
        setErrors({});

        const payload = normalizePayload();

        const updated = await BmsApi.updateBmsUser(selectedUser.id, payload);

        setSelectedUser(updated);
        setSuccessMessage(
        "User profile and access privileges updated successfully."
        );
        
        await loadUsers();
    } catch (error: any) {
        setErrors({
        general:
            error?.message ||
            "Failed to update user. Please check the details and try again.",
        });
    } finally {
        setSaving(false);
    }
};

  const fullName = `${form.firstName ?? ""} ${form.lastName ?? ""}`.trim();

  return (
    <div className="grid gap-6 xl:grid-cols-[0.85fr_1.4fr]">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="rounded-3xl border border-white/15 bg-white/10 p-5 shadow-2xl backdrop-blur-xl"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-cyan-200/80">
              User Management
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Select User
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Search by username, email, or display name.
            </p>
          </div>

          <button
            type="button"
            onClick={loadUsers}
            className="rounded-2xl border border-white/10 bg-white/5 p-3 text-slate-200 transition hover:bg-white/10"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {errors.selectedUser && (
          <div className="mb-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {errors.selectedUser}
          </div>
        )}

        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/20 px-4 py-3">
          <Search size={16} className="text-slate-400" />
          <input
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            placeholder="Search user..."
            className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 outline-none"
          />
        </div>

        <div className="max-h-170 space-y-3 overflow-y-auto pr-1">
          {loadingUsers ? (
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
              <Loader2 size={16} className="animate-spin" />
              Loading users...
            </div>
          ) : filteredUsers.length === 0 ? (
            <p className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
              No users found.
            </p>
          ) : (
            filteredUsers.map((user) => {
              const active = selectedUser?.id === user.id;

              return (
                <button
                  type="button"
                  key={user.id}
                  onClick={() => selectUser(user)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    active
                      ? "border-cyan-300/40 bg-cyan-400/15 shadow-lg shadow-cyan-500/10"
                      : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl border border-white/10 bg-white/10 p-2 text-cyan-100">
                      <User2 size={18} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-white">
                        {user.displayName ||
                          `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
                          user.username}
                      </p>
                      <p className="truncate text-sm text-slate-300">
                        {user.email}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-300">
                          {user.role.replaceAll("_", " ")}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-300">
                          {user.enabled ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </motion.div>

      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="relative overflow-hidden rounded-3xl border border-white/15 bg-white/10 p-6 shadow-2xl backdrop-blur-xl"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.12),transparent_22%)]" />

        <div className="relative z-10">
          <div className="mb-6 flex flex-col gap-3 border-b border-white/10 pb-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-fuchsia-200/80">
                Edit User
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                Update Profile & Access
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">
                Edit user details, role, tenant access, and site privileges in
                one place.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">
              <CheckCircle2 size={16} />
              Keycloak + DB sync
            </div>
          </div>

          {!selectedUser && (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-cyan-100">
                <User size={24} />
              </div>
              <h3 className="text-lg font-semibold text-white">
                Select a user to edit
              </h3>
              <p className="mt-2 text-sm text-slate-300">
                Choose a user from the left panel to load profile and access
                details.
              </p>
            </div>
          )}

          {selectedUser && (
            <>
              {errors.general && (
                <div className="mb-5 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {errors.general}
                </div>
              )}

              {successMessage && (
                <div className="mb-5 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                  {successMessage}
                </div>
              )}

              <div className="mb-6 rounded-3xl border border-white/10 bg-slate-950/20 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                      Editing
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-white">
                      {form.displayName || fullName || form.username}
                    </h3>
                    <p className="mt-1 text-sm text-slate-300">{form.email}</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/10 p-3 text-cyan-100">
                    <User2 size={22} />
                  </div>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <Field
                  label="Username"
                  icon={<User2 size={16} />}
                  value={form.username}
                  onChange={(v) => updateField("username", v)}
                  error={errors.username}
                  required
                />

                <Field
                  label="Email"
                  icon={<Mail size={16} />}
                  value={form.email}
                  onChange={(v) => updateField("email", v)}
                  error={errors.email}
                  required
                  type="email"
                />

                <Field
                  label="Phone Number"
                  icon={<Phone size={16} />}
                  value={form.phoneNumber ?? ""}
                  onChange={(v) => updateField("phoneNumber", v)}
                  error={errors.phoneNumber}
                  type="tel"
                />

                <div className="md:col-span-2">
                  <PasswordField
                    label="New Password"
                    value={form.password}
                    onChange={(v) => updateField("password", v)}
                    placeholder="Leave blank to keep current password"
                    error={errors.password}
                    showPassword={showPassword}
                    setShowPassword={setShowPassword}
                  />
                </div>

                <Field
                  label="First Name"
                  value={form.firstName ?? ""}
                  onChange={(v) => updateField("firstName", v)}
                  error={errors.firstName}
                />

                <Field
                  label="Last Name"
                  value={form.lastName ?? ""}
                  onChange={(v) => updateField("lastName", v)}
                  error={errors.lastName}
                />

                <div className="md:col-span-2">
                  <Field
                    label="Display Name"
                    value={form.displayName ?? ""}
                    onChange={(v) => updateField("displayName", v)}
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
                    <div className="mb-2 flex items-end justify-between gap-3">
                      <label className="block text-sm font-medium text-slate-200">
                        Assigned Tenants{" "}
                        <span className="text-cyan-300">*</span>
                      </label>
                      <span className="text-xs text-slate-400">
                        Selected: {form.tenantIds.length}
                      </span>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="mb-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/20 px-4 py-3">
                        <Search size={16} className="text-slate-400" />
                        <input
                          value={tenantSearch}
                          onChange={(e) => setTenantSearch(e.target.value)}
                          placeholder="Search tenant..."
                          className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 outline-none"
                        />
                      </div>

                      {loadingTenants ? (
                        <p className="text-sm text-slate-400">
                          Loading tenants...
                        </p>
                      ) : (
                        <div className="grid max-h-72 gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
                          {filteredTenants.map((tenant) => {
                            const checked = form.tenantIds.includes(
                              tenant.tenantId
                            );

                            return (
                              <label
                                key={tenant.tenantId}
                                className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition ${
                                  checked
                                    ? "border-cyan-300/30 bg-cyan-400/10 text-white"
                                    : "border-white/10 bg-white/5 text-white hover:bg-white/10"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleTenant(tenant.tenantId)}
                                  className="h-4 w-4 rounded border-white/20 bg-transparent"
                                />

                                <div className="flex min-w-0 flex-col">
                                  <span className="truncate font-medium">
                                    {tenant.name}
                                  </span>
                                  <span className="truncate text-xs text-slate-400">
                                    {tenant.tenantId}
                                  </span>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {errors.tenantIds && (
                      <p className="mt-2 text-sm text-red-300">
                        {errors.tenantIds}
                      </p>
                    )}
                  </div>
                )}

                {isSiteRequired && form.tenantIds.length > 0 && (
                  <div className="md:col-span-2">
                    <div className="mb-2 flex items-end justify-between gap-3">
                      <label className="block text-sm font-medium text-slate-200">
                        Assigned Sites <span className="text-cyan-300">*</span>
                      </label>
                      <span className="text-xs text-slate-400">
                        Selected: {form.sites.length}
                      </span>
                    </div>

                    <div className="max-h-140 space-y-4 overflow-y-auto rounded-2xl border border-white/10 bg-white/5 p-4 pr-2">
                      {form.tenantIds.map((tenantId) => {
                        const tenant = tenants.find(
                          (t) => t.tenantId === tenantId
                        );
                        const expanded = expandedTenantIds.includes(tenantId);
                        const isLoading = loadingSitesTenantId === tenantId;
                        const tenantSites = getFilteredSites(tenantId);
                        const allTenantSites = sitesByTenant[tenantId] ?? [];
                        const selectedCount = form.sites.filter(
                          (site) => site.tenantId === tenantId
                        ).length;

                        return (
                          <div
                            key={tenantId}
                            className="rounded-2xl border border-white/10 bg-slate-950/20 p-4"
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <button
                                type="button"
                                onClick={() => toggleExpandTenant(tenantId)}
                                className="flex min-w-0 items-center gap-3 text-left"
                              >
                                <span className="rounded-xl border border-white/10 bg-white/10 p-2 text-cyan-100">
                                  {expanded ? (
                                    <ChevronDown size={16} />
                                  ) : (
                                    <ChevronRight size={16} />
                                  )}
                                </span>

                                <span className="min-w-0">
                                  <span className="block truncate text-sm font-semibold text-white">
                                    {tenant?.name || tenantId}
                                  </span>
                                  <span className="block truncate text-xs text-slate-400">
                                    {selectedCount} selected • {tenantId}
                                  </span>
                                </span>
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  loadAllSitesForTenant(tenantId, true)
                                }
                                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 transition hover:bg-white/10"
                              >
                                Refresh
                              </button>
                            </div>

                            {expanded && (
                              <div className="mt-4 space-y-3">
                                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                                  <Search
                                    size={16}
                                    className="text-slate-400"
                                  />
                                  <input
                                    value={siteSearchByTenant[tenantId] ?? ""}
                                    onChange={(e) =>
                                      setSiteSearchByTenant((prev) => ({
                                        ...prev,
                                        [tenantId]: e.target.value,
                                      }))
                                    }
                                    placeholder="Search site..."
                                    className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 outline-none"
                                  />
                                </div>

                                {isLoading ? (
                                  <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
                                    <Loader2
                                      size={16}
                                      className="animate-spin"
                                    />
                                    Loading sites...
                                  </div>
                                ) : allTenantSites.length === 0 ? (
                                  <p className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
                                    No sites available.
                                  </p>
                                ) : (
                                  <div className="grid max-h-64 gap-3 overflow-y-auto rounded-2xl border border-white/10 p-2 sm:grid-cols-2">
                                    {tenantSites.map((site) => {
                                      const checked = isSiteChecked(
                                        tenantId,
                                        site.siteId
                                      );

                                      return (
                                        <label
                                          key={site.siteId}
                                          className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition ${
                                            checked
                                              ? "border-cyan-300/30 bg-cyan-400/10 text-white"
                                              : "border-white/10 bg-white/5 text-white hover:bg-white/10"
                                          }`}
                                        >
                                          <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() =>
                                              toggleSite(
                                                tenantId,
                                                site.siteId
                                              )
                                            }
                                            className="h-4 w-4 rounded border-white/20 bg-transparent"
                                          />

                                          <div className="flex min-w-0 flex-col">
                                            <span className="truncate font-medium">
                                              {site.siteName}
                                            </span>
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
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {form.sites.length > 0 && (
                      <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                        <p className="mb-2 text-xs font-medium uppercase tracking-[0.22em] text-slate-400">
                          Selected Sites
                        </p>

                        <div className="flex max-h-28 flex-wrap gap-2 overflow-y-auto pr-1">
                          {form.sites.map((selected) => {
                            const site = sitesByTenant[
                              selected.tenantId
                            ]?.find((s) => s.siteId === selected.siteId);

                            return (
                              <span
                                key={`${selected.tenantId}-${selected.siteId}`}
                                className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100"
                              >
                                {site?.siteName || selected.siteId}

                                <button
                                  type="button"
                                  onClick={() =>
                                    removeSiteChip(
                                      selected.tenantId,
                                      selected.siteId
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
                      </div>
                    )}

                    {errors.sites && (
                      <p className="mt-2 text-sm text-red-300">
                        {errors.sites}
                      </p>
                    )}
                  </div>
                )}

                <StatusCard
                  icon={<Bell size={16} />}
                  title="Notifications"
                  description="Enable alert notifications for this user."
                  checked={form.notificationEnabled}
                  onChange={(checked) =>
                    updateField("notificationEnabled", checked)
                  }
                />

                <StatusCard
                  icon={<CheckCircle2 size={16} />}
                  title="Enabled"
                  description="Allow this user to access the BMS."
                  checked={form.enabled}
                  onChange={(checked) => updateField("enabled", checked)}
                />
              </div>

              <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUser(null);
                    setForm(emptyForm);
                    setErrors({});
                    setSuccessMessage("");
                    setExpandedTenantIds([]);
                    setSiteSearchByTenant({});
                  }}
                  className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10"
                >
                  Clear
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-300/30 bg-cyan-400/20 px-5 py-3 text-sm font-semibold text-cyan-50 transition hover:bg-cyan-400/25 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-medium text-white">Current Summary</p>
                <div className="mt-3 space-y-2 text-sm text-slate-300">
                  <p>Tenants: {selectedTenantNames || "Not assigned"}</p>
                  <p>Sites: {selectedSiteNames || "Not assigned"}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </motion.form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  error,
  required,
  type = "text",
  icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
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
  showPassword,
  setShowPassword,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  showPassword: boolean;
  setShowPassword: (value: boolean) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-200">
        {label}
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

function StatusCard({
  icon,
  title,
  description,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-xl border border-white/10 bg-white/10 p-2 text-cyan-200">
          {icon}
        </div>

        <div className="flex-1">
          <p className="font-medium text-white">{title}</p>
          <p className="mt-1 text-sm text-slate-300">{description}</p>
        </div>

        <Toggle checked={checked} onChange={onChange} />
      </div>
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