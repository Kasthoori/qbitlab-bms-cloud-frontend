import { useEffect, useMemo, useState } from "react";
import { useDebounce } from "./useDebounce";

type AvailabilityStatus = "idle" | "checking" | "available" | "exists" | "error";


export function useHvacDeviceIdAvailability(params: {
    protocol: string;
    deviceId: string;
    delayMs?: number;
    enabled?: boolean;
}) {

    const {protocol, deviceId, delayMs = 400, enabled = true} = params;

    const [status, setStatus] = useState<AvailabilityStatus>("idle")
    const debouncedId = useDebounce(deviceId, delayMs);

    useEffect(() => {

        if (!enabled) {
            setStatus("idle");
            return;
        }

        const id = debouncedId.trim();
        if (!protocol || !id) {
            setStatus("idle");
            return;
        }

        const controller = new AbortController();
        setStatus("checking");

        fetch(
            `/api/hvac/config/exists?protocol=${encodeURIComponent(protocol)}&deviceId=${encodeURIComponent(id)}`,
            {signal: controller.signal}
        )
            .then( async (r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json() as Promise<{exists: boolean}>
            })
            .then((data) => {
                setStatus(data.exists ? "exists" : "available");
            })
            .catch((error) => {
                if (error?.name === "AbortError") return;
                setStatus("error");
            });

            return () => controller.abort();

    }, [protocol, debouncedId, enabled]);

    const canSave = useMemo(() => status === "available", [status]);

    return {status, canSave};

}