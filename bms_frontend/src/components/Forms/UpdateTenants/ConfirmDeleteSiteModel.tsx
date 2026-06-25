import { Building2 } from "lucide-react";
import { BmsConfirmDeleteModal } from "@/components/UI";

type ConfirmDeleteSiteModalProps = {
  open: boolean;

  tenantId: string;
  siteId: string;
  siteName?: string;

  deleting?: boolean;
  error?: string | null;
  success?: boolean;

  onClose: () => void;
  onConfirmDelete: () => Promise<void> | void;
};

const ConfirmDeleteSiteModal = ({
  open,
  siteId,
  siteName,
  deleting = false,
  error,
  success,
  onClose,
  onConfirmDelete,
}: ConfirmDeleteSiteModalProps) => {
  return (
    <BmsConfirmDeleteModal
      open={open}
      eyebrow="Delete Site"
      title="Confirm Site Deletion"
      entityLabel="Site"
      entityName={siteName ?? siteId}
      entityIdLabel="Site ID"
      entityId={siteId}
      icon={<Building2 className="h-5 w-5" />}
      description="This will permanently delete this site and may affect HVACs, mappings, floor plans, telemetry views, and maintenance records under it."
      deleting={deleting}
      error={error}
      success={success}
      successMessage="Site deleted successfully."
      cancelLabel="Cancel"
      confirmLabel="Delete Site"
      deletingLabel="Deleting..."
      onClose={onClose}
      onConfirmDelete={onConfirmDelete}
    />
  );
};

export default ConfirmDeleteSiteModal;