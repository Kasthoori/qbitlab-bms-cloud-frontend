import { Cpu } from "lucide-react";
import { BmsConfirmDeleteModal } from "@/components/UI";

type ConfirmDeleteHvacModalProps = {
  open: boolean;

  tenantId: string;
  siteId: string;

  hvacId: string;
  hvacName?: string;

  deleting?: boolean;
  error?: string | null;
  success?: boolean;

  onClose: () => void;
  onConfirmDelete: () => Promise<void> | void;
};

const ConfirmDeleteHvacModal = ({
  open,
  hvacId,
  hvacName,
  deleting = false,
  error,
  success,
  onClose,
  onConfirmDelete,
}: ConfirmDeleteHvacModalProps) => {
  return (
    <BmsConfirmDeleteModal
      open={open}
      eyebrow="Delete HVAC"
      title="Confirm HVAC Deletion"
      entityLabel="HVAC"
      entityName={hvacName ?? hvacId}
      entityIdLabel="HVAC ID"
      entityId={hvacId}
      icon={<Cpu className="h-5 w-5" />}
      description="This will permanently delete this HVAC from the site. This action cannot be undone."
      deleting={deleting}
      error={error}
      success={success}
      successMessage="HVAC deleted successfully."
      cancelLabel="Cancel"
      confirmLabel="Delete HVAC"
      deletingLabel="Deleting..."
      onClose={onClose}
      onConfirmDelete={onConfirmDelete}
    />
  );
};

export default ConfirmDeleteHvacModal;