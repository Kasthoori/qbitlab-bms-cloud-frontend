import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, UserCircle } from "lucide-react";
import { BmsApi, type CurrentUserDto } from "@/api/bms";
import { keycloak } from "@/keycloak";
import DashboardNotificationIcons from "@/components/Dashboard/DashboardNotificationIcons";

export default function Topbar() {
  const [user, setUser] = useState<CurrentUserDto | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  /**
   * Loads the logged-in BMS user from the backend.
   *
   * This is used only for showing the display name, email and role label
   * in the top-right user dropdown.
   */
  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      try {
        const data = await BmsApi.getCurrentUser();

        if (!cancelled) {
          setUser(data);
        }
      } catch (err) {
        console.error("Failed to load current user", err);
      }
    }

    loadUser();

    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Closes the user dropdown when clicking outside the menu.
   *
   * This prevents the dropdown from staying open while the user clicks
   * another part of the dashboard.
   */
  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!menuRef.current) return;

      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const displayName = user?.name || user?.username || "User";

  const allowedRoles = [
    "ADMIN",
    "BMS_ADMIN",
    "SITE_MANAGER",
    "TECHNICIAN",
    "FACILITY_MANAGER",
  ];

  const rawRole =
    user?.roles
      ?.map((role) => role.replace("ROLE_", ""))
      .find((role) => allowedRoles.includes(role)) || "";

  const roleLabelMap: Record<string, string> = {
    ADMIN: "Admin",
    BMS_ADMIN: "Admin",
    SITE_MANAGER: "Site Manager",
    TECHNICIAN: "Technician",
    FACILITY_MANAGER: "Facility Manager",
  };

  const roleLabel = roleLabelMap[rawRole] || rawRole;

  async function handleLogout() {
    try {
      await keycloak.logout({
        redirectUri: window.location.origin,
      });
    } catch (err) {
      console.error("Logout failed", err);
    }
  }

  return (
    <header className="relative z-[200] flex h-16 items-center justify-between overflow-visible border-b border-white/10 bg-white/5 px-6 text-white backdrop-blur-xl">
      <h1 className="text-lg font-semibold text-white">
        Building Management System
      </h1>

      <div className="flex items-center gap-3 overflow-visible">
        {/* 
          Dashboard notification icons:
          - Bell icon shows failure/open-alert count.
          - Message icon shows message/action count.
          - Each dropdown item links to the relevant dashboard/site location.
        */}
        <DashboardNotificationIcons />

        <div className="relative overflow-visible" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 transition hover:bg-white/10"
          >
            <span className="hidden text-sm text-slate-300 sm:inline">
              {user
                ? `Welcome ${displayName}${roleLabel ? ` ${roleLabel}` : ""}`
                : "Loading..."}
            </span>

            <UserCircle className="text-slate-300" />

            <ChevronDown
              className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${
                menuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          <div
            className={`absolute right-0 top-full z-[9999] mt-2 w-64 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/95 shadow-2xl backdrop-blur-xl transition-all duration-300 ease-out ${
              menuOpen
                ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
                : "pointer-events-none -translate-y-2 scale-95 opacity-0"
            }`}
          >
            <div className="border-b border-white/10 px-4 py-3">
              <p className="text-sm font-medium text-white">{displayName}</p>

              <p className="text-xs text-slate-400">
                {user?.email || "No email"}
              </p>

              {roleLabel && (
                <p className="mt-1 text-xs text-cyan-300">{roleLabel}</p>
              )}
            </div>

            <div className="p-2">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-red-300 transition hover:bg-red-500/10"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}