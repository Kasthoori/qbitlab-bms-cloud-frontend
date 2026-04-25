import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BrainCircuit,
  CheckCircle2,
  Mail,
  Search,
  ShieldCheck,
  Sparkles,
  User,
  Users,
  XCircle,
} from "lucide-react";
import { BmsApi } from "@/api/bms";
import type { BmsUserResponse } from "@/types/userManagement";

const glassCard =
  "rounded-3xl border border-white/10 bg-white/10 shadow-2xl backdrop-blur-xl";

export default function ViewUsersPage() {
  const [users, setUsers] = useState<BmsUserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setLoading(true);
      setErrorMessage(null);

      const result = await BmsApi.getBmsUsers();
      setUsers(result ?? []);
    } catch (error) {
      console.error(error);
      setErrorMessage("Failed to load users.");
    } finally {
      setLoading(false);
    }
  }

  const roles = useMemo(() => {
    return Array.from(new Set(users.map((user) => user.role).filter(Boolean)));
  }, [users]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesRole = roleFilter === "ALL" || user.role === roleFilter;

      const values = [
        user.username,
        user.email,
        user.firstName,
        user.lastName,
        user.displayName,
        user.role,
        user.keycloakUserId,
        user.id,
      ]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase());

      const matchesSearch =
        !query || values.some((value) => value.includes(query));

      return matchesRole && matchesSearch;
    });
  }, [users, search, roleFilter]);

  const enabledCount = users.filter((user) => user.enabled).length;
  const disabledCount = users.length - enabledCount;

  return (
    <div className="min-h-full bg-[radial-gradient(circle_at_top_right,rgba(6,182,212,0.12),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.12),transparent_24%),linear-gradient(180deg,#020617_0%,#0f172a_45%,#111827_100%)] px-4 py-6 md:px-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mx-auto max-w-7xl space-y-6"
      >
        <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <div className={`${glassCard} p-6`}>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-100">
              <BrainCircuit size={14} />
              AI User Intelligence
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-4xl">
              View all platform users
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 md:text-base">
              Review created users, roles, Keycloak sync status, tenant/site
              access count, and account status in one glass dashboard.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <MetricCard
              icon={<Users size={18} />}
              title="Total Users"
              value={String(users.length)}
              subtitle="Created in BMS"
            />
            <MetricCard
              icon={<CheckCircle2 size={18} />}
              title="Enabled"
              value={String(enabledCount)}
              subtitle="Active accounts"
            />
            <MetricCard
              icon={<XCircle size={18} />}
              title="Disabled"
              value={String(disabledCount)}
              subtitle="Inactive accounts"
            />
          </div>
        </div>

        <div className={`${glassCard} p-5`}>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="flex items-center gap-2 text-white">
                <Sparkles size={20} className="text-cyan-200" />
                <h2 className="text-xl font-semibold">User Directory</h2>
              </div>
              <p className="mt-1 text-sm text-slate-400">
                {filteredUsers.length} user{filteredUsers.length === 1 ? "" : "s"} shown
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row xl:max-w-2xl">
              <div className="flex flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                <Search className="h-4 w-4 text-slate-300" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by name, email, role..."
                  className="w-full bg-transparent text-sm text-white placeholder:text-slate-400 outline-none"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
                className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none"
              >
                <option value="ALL">All roles</option>
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {errorMessage && (
            <div className="mt-5 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">
              {errorMessage}
            </div>
          )}

          {loading ? (
            <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-slate-300">
              Loading users...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-white/10 bg-white/5 p-10 text-center">
              <User className="mx-auto h-10 w-10 text-slate-500" />
              <p className="mt-3 text-base font-medium text-white">No users found</p>
              <p className="mt-1 text-sm text-slate-400">
                Try another search keyword or role filter.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-5 xl:grid-cols-2">
              {filteredUsers.map((user) => {
                const displayName =
                  user.displayName ||
                  `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
                  user.username ||
                  "Unnamed User";

                const siteCount = user.sites?.length ?? 0;
                const tenantCount = user.tenantIds?.length ?? 0;

                return (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-xl transition hover:-translate-y-0.5 hover:bg-white/[0.09]"
                  >
                    {/* <div className="flex items-start gap-4"> */}
                    <div className="max-h-[calc(100vh-140px)] overflow-y-auto pr-2">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-100">
                        <User size={26} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="truncate text-xl font-semibold text-white">
                              {displayName}
                            </h3>
                            <p className="mt-1 text-sm text-slate-400">
                              @{user.username || "no-username"}
                            </p>
                          </div>

                          <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-100">
                            {user.role}
                          </span>
                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                          <InfoBox
                            icon={<Mail size={16} />}
                            label="Email"
                            value={user.email || "-"}
                          />

                          <InfoBox
                            icon={<ShieldCheck size={16} />}
                            label="Status"
                            value={user.enabled ? "Enabled" : "Disabled"}
                            status={user.enabled ? "success" : "muted"}
                          />

                          <InfoBox
                            icon={<Users size={16} />}
                            label="Tenants"
                            value={`${tenantCount} assigned`}
                          />

                          <InfoBox
                            icon={<Sparkles size={16} />}
                            label="Sites"
                            value={`${siteCount} assigned`}
                          />
                        </div>

                        <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-3">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            Keycloak User ID
                          </p>
                          <p className="mt-1 break-all text-xs text-slate-300">
                            {user.keycloakUserId || "-"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function MetricCard({
  icon,
  title,
  value,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-xl backdrop-blur-xl">
      <div className="inline-flex rounded-2xl border border-white/10 bg-white/10 p-3 text-cyan-200">
        {icon}
      </div>
      <p className="mt-4 text-sm text-slate-400">{title}</p>
      <h3 className="mt-1 text-xl font-semibold text-white">{value}</h3>
      <p className="mt-1 text-sm text-slate-300">{subtitle}</p>
    </div>
  );
}

function InfoBox({
  icon,
  label,
  value,
  status,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  status?: "success" | "muted";
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}
        <p className="text-xs font-medium uppercase tracking-wide">{label}</p>
      </div>
      <p
        className={`mt-2 text-sm font-medium ${
          status === "success"
            ? "text-emerald-200"
            : status === "muted"
              ? "text-slate-300"
              : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}