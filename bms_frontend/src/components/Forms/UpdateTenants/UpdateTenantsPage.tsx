import { useMemo, useState, type FC } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Sparkles } from "lucide-react";
import BmsCard from "./BmsCard";

async function deleteTenant(tenantId: string) {
  const res = await fetch(`/api/tenants/${tenantId}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const UpdateTenantsPage: FC<{ tenants: any[]; refetch: () => void }> = ({
  tenants,
  refetch,
}) => {
  const nav = useNavigate();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const cards = useMemo(() => tenants ?? [], [tenants]);

  async function onDelete(tenantId: string, tenantName?: string) {
    const ok = window.confirm(
      `Delete tenant "${tenantName ?? tenantId}"? This cannot be undone.`
    );
    if (!ok) return;

    try {
      setDeletingId(tenantId);
      await deleteTenant(tenantId);
      await refetch();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">
              <Sparkles className="h-4 w-4" />
              Tenant Administration
            </div>

            <h1 className="mt-3 text-3xl font-bold text-white">
              Update Tenant Information
            </h1>

            <p className="mt-2 max-w-2xl text-slate-400">
              Open tenant records, edit account details, and manage site access
              with the same AI-ready glass experience across QbitLab BMS.
            </p>
          </div>

          <button
            type="button"
            onClick={() => nav("/onboarding")}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 px-5 py-3 text-sm font-semibold text-white transition hover:scale-[1.02]"
          >
            <Plus className="h-4 w-4" />
            New Tenant Setup
          </button>
        </div>
      </div>

      {cards.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-slate-300 backdrop-blur-xl">
          No tenants found.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-3">
          {cards.map((t) => {
            const title = t.tenantName ?? t.name ?? "Unnamed Tenant";
            const created = t.createdAt
              ? new Date(t.createdAt).toLocaleString()
              : "Not available";

            return (
              <BmsCard
                key={t.tenantId}
                title="Tenant Record"
                subtitle={title}
                meta={`Tenant ID: ${t.tenantId}\nCreated: ${created}`}
                badge="Active"
                actions={[
                  {
                    label: "Open Sites",
                    variant: "secondary",
                    onClick: () => nav(`/admin/tenants/${t.tenantId}/sites`),
                  },
                  {
                    label: "Edit Tenant",
                    variant: "primary",
                    onClick: () => nav(`/admin/tenants/${t.tenantId}/edit`),
                  },
                  {
                    label: deletingId === t.tenantId ? "Deleting..." : "Delete",
                    variant: "danger",
                    disabled: deletingId === t.tenantId,
                    onClick: () => onDelete(t.tenantId, t.tenantName ?? t.name),
                  },
                ]}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UpdateTenantsPage;