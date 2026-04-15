import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, UserCircle } from "lucide-react";
import { BmsApi, type CurrentUserDto } from "@/api/bms";
import { keycloak } from "@/keycloak";

export default function Topbar() {
  const [user, setUser] = useState<CurrentUserDto | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const data = await BmsApi.getCurrentUser();
        setUser(data);
      } catch (err) {
        console.error("Failed to load current user", err);
      }
    }

    loadUser();
  }, []);

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

  const allowedRoles = ["ADMIN", "BMS_ADMIN", "TECHNICIAN", "FACILITY_MANAGER"];

  const rawRole =
    user?.roles
      ?.map((role) => role.replace("ROLE_", ""))
      .find((role) => allowedRoles.includes(role)) || "";

  const roleLabelMap: Record<string, string> = {
    ADMIN: "Admin",
    BMS_ADMIN: "Admin",
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
    <header className="relative z-[200] h-16 bg-white/5 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-6 text-white overflow-visible">
      <h1 className="text-lg font-semibold text-white">
        Building Management System
      </h1>

      <div className="relative overflow-visible" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 hover:bg-white/10 transition"
        >
          <span className="text-sm text-slate-300 hidden sm:inline">
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
          className={`absolute right-0 top-full mt-2 w-64 rounded-2xl border border-white/10 bg-slate-900/95 backdrop-blur-xl shadow-2xl z-[9999] overflow-hidden transition-all duration-300 ease-out ${
            menuOpen
              ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
              : "opacity-0 -translate-y-2 scale-95 pointer-events-none"
          }`}
        >
          <div className="border-b border-white/10 px-4 py-3">
            <p className="text-sm font-medium text-white">{displayName}</p>
            <p className="text-xs text-slate-400">{user?.email || "No email"}</p>
            {roleLabel && (
              <p className="mt-1 text-xs text-cyan-300">{roleLabel}</p>
            )}
          </div>

          <div className="p-2">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-red-300 hover:bg-red-500/10 transition"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}