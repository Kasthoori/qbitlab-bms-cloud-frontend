import { useEffect, type FC } from "react";

import { BmsInput } from "@/components/UI";

import { useHvacDeviceIdAvailability } from "../../hooks/useHvacDeviceIdAvailability";

type HvacDeviceIdFieldProps = {
  id?: string;
  protocol: string;
  deviceId: string;
  onDeviceIdChange: (v: string) => void;
  onCanSaveChange?: (canSave: boolean) => void;
};

const HvacDeviceIdField: FC<HvacDeviceIdFieldProps> = ({
  id,
  protocol,
  deviceId,
  onDeviceIdChange,
  onCanSaveChange,
}) => {
  const { status, canSave } = useHvacDeviceIdAvailability({
    protocol,
    deviceId,
    enabled: protocol === "BACNET",
  });

  useEffect(() => {
    onCanSaveChange?.(canSave);
  }, [canSave, onCanSaveChange]);

  return (
    <div className="space-y-2">
      <BmsInput
        id={id}
        value={deviceId}
        onChange={(event) => onDeviceIdChange(event.target.value)}
        placeholder="__MOCK_DEVICE_ID__"
      />

      {status === "checking" && (
        <p className="text-xs font-medium text-cyan-300">Checking...</p>
      )}

      {status === "available" && (
        <p className="text-xs font-medium text-emerald-300">
          Device ID is available.
        </p>
      )}

      {status === "exists" && (
        <p className="text-xs font-medium text-rose-300">
          Device ID already exists.
        </p>
      )}

      {status === "error" && (
        <p className="text-xs font-medium text-rose-300">
          Error checking Device ID.
        </p>
      )}
    </div>
  );
};

export default HvacDeviceIdField;