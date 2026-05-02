import { motion } from "framer-motion";
import { ShieldCheck, Sparkles, Users } from "lucide-react";
import UserForm from "../UserManagement/UserForm";

export default function UserManagementPage() {
  return (
    <div className="min-h-full bg-[radial-gradient(circle_at_top_right,rgba(6,182,212,0.10),transparent_22%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.10),transparent_24%),linear-gradient(180deg,#020617_0%,#0f172a_45%,#111827_100%)] px-4 py-6 md:px-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mx-auto max-w-7xl"
      >
        <div className="mb-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-100">
              <Sparkles size={14} />
              AI Glass User Access
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-4xl">
              Create platform users with secure Keycloak + local BMS sync
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 md:text-base">
              Register Admins, BMS Admins, Technicians, and Facility Managers with
              role aware validation, tenant and site mapping, and notification settings.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <MetricCard
              icon={<Users size={18} />}
              title="Role Based"
              value="4 Roles"
              subtitle="Synced with backend enum"
            />
            <MetricCard
              icon={<ShieldCheck size={18} />}
              title="Secure Flow"
              value="Keycloak + DB"
              subtitle="One creation flow"
            />
            <MetricCard
              icon={<Sparkles size={18} />}
              title="UX Style"
              value="Glass UI"
              subtitle="Modern BMS admin page"
            />
          </div>
        </div>

        <UserForm />
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