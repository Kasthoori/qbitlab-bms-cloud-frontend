import type { HvacUnitConfig } from "../types/HvacUnitConfig";

const BASE_URL = `http://${window.location.hostname}:8084`; // Spring Boot IP

export async function fetchHvacConfigs(): Promise<HvacUnitConfig[]> {

    const res = await fetch(`${BASE_URL}/api/hvac/config`);
    if (!res.ok) throw new Error('Failed to fetch HVAC config');
    return res.json();
}

export async function createHvacConfig(input: HvacUnitConfig): Promise<HvacUnitConfig> {

    const res = await fetch(`${BASE_URL}/api/hvac/config`, {

        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(input),
    });

    if (!res.ok) throw new Error('Failed to create HVAC config');
    return res.json();
}