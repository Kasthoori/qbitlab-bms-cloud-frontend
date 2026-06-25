/* eslint-disable @typescript-eslint/no-explicit-any */
import { BmsApi, type CreateTenantRequest, type TenantDto } from "@/api/bms";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  MapPin,
} from "lucide-react";
import { useMemo, useState, type FC, type SubmitEventHandler } from "react";

import {
  BmsFormModal,
  BmsFormModalFooter,
  BmsInput,
  BmsModalMessage,
} from "@/components/UI";

type UpdateTenantModelProps = {
  open: boolean;
  tenantId: string;
  tenantTitle?: string;
  tenant: TenantDto;
  onClose: () => void;
  onCreated?: () => void;
};

const UpdateTenantModel: FC<UpdateTenantModelProps> = (props) => {
  if (!props.open) return null;

  return <UpdateTenantModelInner key={props.tenantId} {...props} />;
};

const UpdateTenantModelInner: FC<UpdateTenantModelProps> = ({
  open,
  tenantId,
  tenantTitle,
  tenant,
  onClose,
  onCreated,
}) => {
  const initialForm = useMemo<CreateTenantRequest>(
    () => ({
      name: tenant.name ?? tenant.tenantName ?? "",
      country: tenant.country ?? "",
      addressLine1: tenant.addressLine1 ?? "",
      city: tenant.city ?? "",
      postcode: tenant.postcode ?? "",
      timezone: tenant.timezone ?? "Pacific/Auckland",
    }),
    [tenant]
  );

  const [form, setForm] = useState<CreateTenantRequest>(initialForm);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const canSubmit =
    Boolean(tenantId) &&
    Boolean(form.name.trim()) &&
    Boolean(form.country.trim()) &&
    Boolean(form.addressLine1.trim()) &&
    Boolean(form.city.trim()) &&
    Boolean(form.postcode.trim());

  const setField = <K extends keyof CreateTenantRequest>(
    key: K,
    value: CreateTenantRequest[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validate = (): string | null => {
    if (!tenantId) return "Missing tenantId. Please open the form again.";
    if (!form.name.trim()) return "Tenant name is required.";
    if (!form.country.trim()) return "Country is required.";
    if (!form.addressLine1.trim()) return "Address line 1 is required.";
    if (!form.city.trim()) return "City is required.";
    if (!form.postcode.trim()) return "Postcode is required.";
    return null;
  };

  const handleClose = () => {
    if (saving) return;
    setErr(null);
    setSuccess(false);
    onClose();
  };

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();

    const validationError = validate();

    if (validationError) {
      setErr(validationError);
      return;
    }

    try {
      setSaving(true);
      setErr(null);
      setSuccess(false);

      await BmsApi.updateTenantInfo(tenantId, form);

      setSuccess(true);

      setTimeout(() => {
        setSuccess(false);
        setErr(null);
        onClose();
        onCreated?.();
      }, 1200);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update tenant. Please try again.";

      setErr(String(message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <BmsFormModal
      open={open}
      eyebrow="Update Tenant"
      title={form.name || "Tenant Details"}
      icon={<Building2 className="h-5 w-5" />}
      saving={saving}
      onClose={handleClose}
      subtitle={
        <p>
          Tenant:
          <span className="ml-1 break-all font-medium text-slate-200">
            {tenantTitle ?? tenantId}
          </span>
        </p>
      }
    >
      <form onSubmit={handleSubmit}>
        {err && (
          <BmsModalMessage
            type="error"
            icon={<AlertCircle className="h-4 w-4" />}
          >
            {err}
          </BmsModalMessage>
        )}

        {success && (
          <BmsModalMessage
            type="success"
            icon={<CheckCircle2 className="h-4 w-4" />}
          >
            Tenant updated successfully.
          </BmsModalMessage>
        )}

        <div className="grid grid-cols-1 gap-4">
          <BmsInput
            label="Tenant Name"
            value={form.name}
            onChange={(event) => setField("name", event.target.value)}
            disabled={saving}
            placeholder="e.g., QbitLabs Facilities"
          />

          <BmsInput
            label="Country"
            value={form.country}
            onChange={(event) => setField("country", event.target.value)}
            disabled={saving}
            placeholder="e.g., New Zealand"
          />

          <BmsInput
            label="Address Line 1"
            value={form.addressLine1}
            onChange={(event) => setField("addressLine1", event.target.value)}
            disabled={saving}
            placeholder="e.g., 123 Lincoln Road"
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <BmsInput
              label="City"
              value={form.city}
              onChange={(event) => setField("city", event.target.value)}
              disabled={saving}
              placeholder="e.g., Auckland"
            />

            <BmsInput
              label="Postcode"
              value={form.postcode}
              onChange={(event) => setField("postcode", event.target.value)}
              disabled={saving}
              placeholder="e.g., 0612"
            />
          </div>

          <BmsInput
            label={
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 text-cyan-300" />
                Timezone
              </span>
            }
            value={form.timezone}
            onChange={(event) => setField("timezone", event.target.value)}
            disabled={saving}
            placeholder="e.g., Pacific/Auckland"
          />
        </div>

        <BmsFormModalFooter
          saving={saving}
          canSubmit={canSubmit}
          submitLabel="Update Tenant"
          savingLabel="Updating..."
          onCancel={handleClose}
        />
      </form>
    </BmsFormModal>
  );
};

export default UpdateTenantModel;