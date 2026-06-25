/* eslint-disable @typescript-eslint/no-explicit-any */
import { BmsApi, type CreateHvacRequest, type HvacDto } from "@/api/bms";
import {
  AlertCircle,
  CheckCircle2,
  Cpu,
  RadioTower,
} from "lucide-react";
import {
  useMemo,
  useState,
  type Dispatch,
  type FC,
  type SetStateAction,
  type SubmitEventHandler,
} from "react";

import {
  BmsFormModal,
  BmsFormModalFooter,
  BmsInput,
  BmsModalMessage,
  BmsSelect,
} from "@/components/UI";

type UpdateHvacModalProps = {
  open: boolean;
  tenantId: string;
  siteId: string;
  hvacId: string;
  hvac: HvacDto;
  form: CreateHvacRequest;
  setForm: Dispatch<SetStateAction<CreateHvacRequest>>;
  onClose: () => void;
  onUpdated: () => void;
};

const UpdateHvacModal: FC<UpdateHvacModalProps> = ({
  open,
  tenantId,
  siteId,
  hvacId,
  form,
  setForm,
  onClose,
  onUpdated,
}) => {
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const canSubmit = useMemo(() => {
    return (
      !!form.hvacName.trim() &&
      !!form.deviceId.trim() &&
      !!form.protocol &&
      !!form.unitType
    );
  }, [form]);

  const setField = <K extends keyof CreateHvacRequest>(
    key: K,
    value: CreateHvacRequest[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validate = (): string | null => {
    if (!form.hvacName.trim()) return "HVAC name is required.";
    if (!form.deviceId.trim()) return "Device ID is required.";
    if (!form.protocol) return "Protocol is required.";
    if (!form.unitType) return "Unit type is required.";
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

      await BmsApi.updateHvac(tenantId, siteId, hvacId, form);

      setSuccess(true);
      onUpdated?.();

      setTimeout(() => {
        handleClose();
      }, 1200);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update HVAC. Please try again.";

      setErr(String(message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <BmsFormModal
      open={open}
      eyebrow="Update HVAC"
      title={form.hvacName || "HVAC Details"}
      icon={<Cpu className="h-5 w-5" />}
      saving={saving}
      onClose={handleClose}
      subtitle={
        <p>
          HVAC ID:
          <span className="ml-1 break-all font-medium text-slate-200">
            {hvacId}
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
            HVAC updated successfully.
          </BmsModalMessage>
        )}

        <div className="grid grid-cols-1 gap-4">
          <BmsInput
            label="HVAC Name"
            value={form.hvacName}
            onChange={(event) => setField("hvacName", event.target.value)}
            disabled={saving}
            placeholder="e.g., AHU - Level 2"
          />

          <BmsInput
            label="Device ID"
            value={form.deviceId}
            onChange={(event) => setField("deviceId", event.target.value)}
            disabled={saving}
            placeholder="e.g., hvac-1"
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <BmsSelect
              label={
                <span className="inline-flex items-center gap-2">
                  <RadioTower className="h-4 w-4 text-cyan-300" />
                  Protocol
                </span>
              }
              value={form.protocol}
              onChange={(event) =>
                setField(
                  "protocol",
                  event.target.value as CreateHvacRequest["protocol"]
                )
              }
              disabled={saving}
            >
              <option value="BACNET">BACNET</option>
              <option value="MODBUS">MODBUS</option>
              <option value="SIMULATOR">SIMULATOR</option>
            </BmsSelect>

            <BmsSelect
              label="Unit Type"
              value={form.unitType}
              onChange={(event) =>
                setField(
                  "unitType",
                  event.target.value as CreateHvacRequest["unitType"]
                )
              }
              disabled={saving}
            >
              <option value="AHU">AHU</option>
              <option value="VRF">VRF</option>
              <option value="FCU">FCU</option>
              <option value="CHILLER">CHILLER</option>
              <option value="OTHER">OTHER</option>
            </BmsSelect>
          </div>
        </div>

        <BmsFormModalFooter
          saving={saving}
          canSubmit={canSubmit}
          submitLabel="Update HVAC"
          savingLabel="Saving..."
          onCancel={handleClose}
        />
      </form>
    </BmsFormModal>
  );
};

export default UpdateHvacModal;