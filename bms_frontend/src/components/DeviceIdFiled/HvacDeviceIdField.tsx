import { useEffect, type FC } from "react";
import { useHvacDeviceIdAvailability } from "../../hooks/useHvacDeviceIdAvailability";

type HvacDeviceIdFieldProps = {
    protocol: string;
    deviceId: string;
    onDeviceIdChange: (v: string) => void;
    onCanSaveChange?: (canSave: boolean) => void; // optional if parent needs it
};

const HvacDeviceIdField: FC<HvacDeviceIdFieldProps> = ({
    protocol,
    deviceId,
    onDeviceIdChange,
    onCanSaveChange,
}) => {

    const {status, canSave} = useHvacDeviceIdAvailability({
        protocol,
        deviceId,
        enabled: protocol === "BACNET",
    });

    useEffect(() => {
        onCanSaveChange?.(canSave);

    }, [canSave, onCanSaveChange]);

    return (
        <div>
            <input
                value={deviceId}
                onChange={(e) => onDeviceIdChange(e.target.value)}
                placeholder="BACnet Device Instance (e.g., 12345)"
            />

            {status === "checking" && <div>Checking...</div>}
            {status === "available" && <div style={{color: "green"}}>Device ID is available.</div>}
            {status === "exists" && <div style={{color: "red"}}>Device ID already exists.</div>}
            {status === "error" && <div style={{color: "red"}}>Error checking Device ID.</div>}
        </div>
    );
};

export default HvacDeviceIdField;