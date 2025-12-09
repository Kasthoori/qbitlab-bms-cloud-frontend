import { useState, type FC } from "react";
import type { HvacUnitConfig, Protocol } from "../../types/HvacUnitConfig";

const defaultConfig: HvacUnitConfig = {
    deviceId: '',
    unitName: '',
    building: '',
    floor: '',
    room: '',
    protocol: 'SIMULATOR',
    enabled: true,
};

export const HvacConfigForm:FC = () => {

    const [form, setForm] = useState<HvacUnitConfig>(defaultConfig);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    
}