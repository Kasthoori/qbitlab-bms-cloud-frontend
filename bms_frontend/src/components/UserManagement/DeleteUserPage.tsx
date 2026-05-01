import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Search,
  ShieldAlert,
  Trash2,
  User,
  Users,
} from "lucide-react";
import { BmsApi } from "@/api/bms";
import type { BmsUserResponse } from "@/types/userManagement";

const glassCard =
  "rounded-3xl border border-white/10 bg-white/10 shadow-2xl backdrop-blur-xl";

export default function DeleteUserPage() {
  const [users, setUsers] = useState<BmsUserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setLoading(true);
      setErrorMessage(null);

      const result = await BmsApi.getBmsUsers(0, 100);
      setUsers(result.content ?? []);
    } catch (error) {
      console.error(error);
      setErrorMessage("Failed to load users.");
    } finally {
      setLoading(false);
    }
  }

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return users;

    return users.filter((user) => {
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

      return values.some((value) => value.includes(query));
    });
  }, [users, search]);

  async function handleDeleteUser(user: BmsUserResponse) {
    const displayName =
      user.displayName ||
      `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
      user.username ||
      user.email ||
      "this user";

    const confirmed = window.confirm(
      `Are you sure you want to delete ${displayName}?\n\nThis will remove:\n- Local BMS user\n- Tenant and site assignments\n- Keycloak account`
    );

    if (!confirmed) return;

    try {
      setDeletingUserId(user.id);
      setErrorMessage(null);
      setSuccessMessage(null);

      await BmsApi.deleteBmsUser(user.id);

      setUsers((prev) => prev.filter((item) => item.id !== user.id));
      setSuccessMessage(`${displayName} deleted successfully.`);
    } catch (error) {
      console.error(error);
      setErrorMessage("Failed to delete user.");
    } finally {
      setDeletingUserId(null);
    }
  }

  return (
    <div className="min-h-full bg-[radial-gradient(circle_at_top_right,rgba(244,63,94,0.12),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.10),transparent_24%),linear-gradient(180deg,#020617_0%,#0f172a_45%,#111827_100%)] px-4 py-6 md:px-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mx-auto max-w-7xl space-y-6"
      >
        <div className={`${glassCard} p-6`}>
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-300/20 bg-rose-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-rose-100">
            <ShieldAlert size={14} />
            Delete User
          </div>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Remove BMS users safely
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 md:text-base">
            Search for a user, then delete their local BMS record, tenant/site
            assignments, and Keycloak account.
          </p>
        </div>

        <div className={`${glassCard} p-5`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-white">
                <Users size={20} />
                <h2 className="text-xl font-semibold">Users</h2>
              </div>
              <p className="mt-1 text-sm text-slate-400">
                {filteredUsers.length} user{filteredUsers.length === 1 ? "" : "s"} found
              </p>
            </div>

            <div className="w-full max-w-md">
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                <Search className="h-4 w-4 text-slate-300" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by name, email, role..."
                  className="w-full bg-transparent text-sm text-white placeholder:text-slate-400 outline-none"
                />
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="mt-5 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">
              {successMessage}
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
                Try another search keyword.
              </p>
            </div>
          ) : (
            <div className="mt-6 overflow-hidden rounded-3xl border border-white/10">
              <div className="overflow-x-auto">
                <table className="w-full min-w-225 border-collapse">
                  <thead className="bg-white/10">
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                      <th className="px-5 py-4">User</th>
                      <th className="px-5 py-4">Email</th>
                      <th className="px-5 py-4">Role</th>
                      <th className="px-5 py-4">Enabled</th>
                      <th className="px-5 py-4">Assignments</th>
                      <th className="px-5 py-4 text-right">Action</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/10">
                    {filteredUsers.map((user) => {
                      const displayName =
                        user.displayName ||
                        `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
                        user.username ||
                        "-";

                      const isDeleting = deletingUserId === user.id;

                      return (
                        <tr key={user.id} className="bg-white/3 text-sm">
                          <td className="px-5 py-4">
                            <div className="font-medium text-white">{displayName}</div>
                            <div className="mt-1 text-xs text-slate-500">
                              {user.username}
                            </div>
                          </td>

                          <td className="px-5 py-4 text-slate-300">
                            {user.email || "-"}
                          </td>

                          <td className="px-5 py-4">
                            <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-100">
                              {user.role}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                user.enabled
                                  ? "border border-emerald-300/20 bg-emerald-400/10 text-emerald-100"
                                  : "border border-slate-300/20 bg-slate-400/10 text-slate-300"
                              }`}
                            >
                              {user.enabled ? "Enabled" : "Disabled"}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-slate-300">
                            {user.sites?.length ?? 0} site
                            {(user.sites?.length ?? 0) === 1 ? "" : "s"}
                          </td>

                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              disabled={isDeleting}
                              onClick={() => handleDeleteUser(user)}
                              className="inline-flex items-center gap-2 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-100 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isDeleting ? (
                                "Deleting..."
                              ) : (
                                <>
                                  <Trash2 size={16} />
                                  Delete
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-100">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Deleting a user is permanent. It removes the user from Keycloak and
              clears local tenant/site assignments.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}