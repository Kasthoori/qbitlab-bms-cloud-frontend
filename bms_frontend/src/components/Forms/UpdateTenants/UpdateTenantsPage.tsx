import { useMemo, useState, type FC } from "react";
import { useNavigate } from "react-router-dom";
import BmsCard from "./BmsCard";


async function deleteTenant(tenantId: string) {
    const res = await fetch(`/api/tenants/${tenantId}`, {method: "DELETE"});
    if (!res.ok) throw new Error(`Delete failed: ${res.status}`)
}


// eslint-disable-next-line @typescript-eslint/no-explicit-any
const UpdateTenantsPage:FC<{tenants: any[]; refetch: () => void}> = ({tenants, refetch}) => {

    const nav = useNavigate();

    const [deletingId, setDeletingId] = useState<string | null>(null);

    const cards = useMemo(() => tenants ?? [], [tenants]);

    async function onDelete(tenantId: string, tenantName?: string) {
    const ok = window.confirm(`Delete tenant "${tenantName ?? tenantId}"? This cannot be undone.`);
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
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {cards.map((t) => {
        const title = t.tenantName ?? "Unnamed Tenant";
        const created = t.createdAt ? new Date(t.createdAt).toLocaleString() : "—";

        return (
          <BmsCard
            key={t.tenantId}
            title="Update Information"
            subtitle={title}
            meta={`Tenant ID: ${t.tenantId} • Created: ${created}`}
            badge="Open"
            actions={[
              {
                label: "Open",
                variant: "primary",
                onClick: () => nav(`/admin/tenants/${t.tenantId}/sites`), // ✅ only open goes to sites
              },
              {
                label: "Edit",
                variant: "secondary",
                onClick: () => nav(`/admin/tenants/${t.tenantId}/edit`), // ✅ edit page (recommended)
              },
              {
                label: deletingId === t.tenantId ? "Deleting..." : "Delete",
                variant: "danger",
                disabled: deletingId === t.tenantId,
                onClick: () => onDelete(t.tenantId, t.tenantName),
              },
            ]}
          />
        );
      })}
    </div>
  );

}

export default UpdateTenantsPage;