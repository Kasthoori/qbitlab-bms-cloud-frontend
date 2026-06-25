import { Building2 } from "lucide-react";
import { BmsConfirmDeleteModal } from "@/components/UI";

type ConfirmDeleteTenantModalProps = {
  open: boolean;
  tenantId: string;
  tenantName?: string;
  deleting?: boolean;

  error?: string | null;
  success?: boolean;

  onClose: () => void;
  onConfirmDelete: () => Promise<void> | void;
};

const ConfirmDeleteTenantModal = ({
  open,
  tenantId,
  tenantName,
  deleting = false,
  error,
  success,
  onClose,
  onConfirmDelete,
}: ConfirmDeleteTenantModalProps) => {
  return (
    <BmsConfirmDeleteModal
      open={open}
      eyebrow="Delete Tenant"
      title="Confirm Tenant Deletion"
      entityLabel="Tenant"
      entityName={tenantName ?? tenantId}
      entityIdLabel="Tenant ID"
      entityId={tenantId}
      icon={<Building2 className="h-5 w-5" />}
      description="This will permanently delete this tenant and may affect sites, HVACs, mappings, floor plans, telemetry views, and maintenance workflows under it."
      deleting={deleting}
      error={error}
      success={success}
      successMessage="Tenant deleted successfully."
      cancelLabel="Cancel"
      confirmLabel="Delete Tenant"
      deletingLabel="Deleting..."
      onClose={onClose}
      onConfirmDelete={onConfirmDelete}
    />
  );
};

export default ConfirmDeleteTenantModal;