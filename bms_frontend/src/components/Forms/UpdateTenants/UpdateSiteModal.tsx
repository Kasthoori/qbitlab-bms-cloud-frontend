/* eslint-disable @typescript-eslint/no-explicit-any */
import { BmsApi, type CreateSiteRequest, type SiteDto } from "@/api/bms";
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

type UpdateSiteModelProps = {
  open: boolean;
  siteId: string;
  siteName: string;
  tenantId: string;
  site: SiteDto;
  onClose: () => void;
  onCreated: () => void;
};

const UpdateSiteModal: FC<UpdateSiteModelProps> = (props) => {
  if (!props.open) return null;

  return <UpdateSiteModalInner key={props.siteId} {...props} />;
};

const UpdateSiteModalInner: FC<UpdateSiteModelProps> = ({
  open,
  siteId,
  tenantId,
  site,
  onClose,
  onCreated,
}) => {
  const initialForm = useMemo<CreateSiteRequest>(
    () => ({
      siteName: site.siteName ?? "",
      addressLine1: site.addressLine1 ?? "",
      city: site.city ?? "",
      postcode: site.postcode ?? "",
      timezone: site.timezone ?? "",
    }),
    [site]
  );

  const [form, setForm] = useState<CreateSiteRequest>(initialForm);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const canSubmit =
    Boolean(siteId) &&
    Boolean(form.siteName.trim()) &&
    Boolean(form.addressLine1.trim()) &&
    Boolean(form.city.trim()) &&
    Boolean(form.postcode.trim()) &&
    Boolean(form.timezone.trim());

  const setField = <K extends keyof CreateSiteRequest>(
    key: K,
    value: CreateSiteRequest[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validate = (): string | null => {
    if (!form.siteName.trim()) return "Site name is required.";
    if (!form.addressLine1.trim()) return "Address line 1 is required.";
    if (!form.city.trim()) return "City is required.";
    if (!form.postcode.trim()) return "Postcode is required.";
    if (!form.timezone.trim()) return "Timezone is required.";
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

      await BmsApi.updateSite(tenantId, siteId, form);

      setSuccess(true);
      onCreated?.();

      setTimeout(() => {
        handleClose();
      }, 1200);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update site. Please try again.";

      setErr(String(message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <BmsFormModal
      open={open}
      eyebrow="Update Site"
      title={form.siteName || "Site Details"}
      icon={<Building2 className="h-5 w-5" />}
      saving={saving}
      onClose={handleClose}
      subtitle={
        <p>
          Site ID:
          <span className="ml-1 break-all font-medium text-slate-200">
            {siteId}
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
            Site updated successfully.
          </BmsModalMessage>
        )}

        <div className="grid grid-cols-1 gap-4">
          <BmsInput
            label="Site Name"
            value={form.siteName}
            onChange={(event) => setField("siteName", event.target.value)}
            disabled={saving}
            placeholder="e.g., Auckland Office"
          />

          <BmsInput
            label="Address Line 1"
            value={form.addressLine1}
            onChange={(event) => setField("addressLine1", event.target.value)}
            disabled={saving}
            placeholder="e.g., 42 Queen St"
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
              placeholder="e.g., 1010"
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
          submitLabel="Update Site"
          savingLabel="Updating..."
          onCancel={handleClose}
        />
      </form>
    </BmsFormModal>
  );
};

export default UpdateSiteModal;