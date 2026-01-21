import type { HvacUnitConfig } from "../types/HvacUnitConfig";
import { api } from "./http";

// const BASE_URL = 'http://192.168.68.58:8084'; // Spring Boot IP

export function fetchHvacConfigs(): Promise<HvacUnitConfig[]> {

    // const res = await fetch(`${BASE_URL}/api/hvac/config`);
    // if (!res.ok) throw new Error('Failed to fetch HVAC config');
    // return res.json();

    return api<HvacUnitConfig[]>("/api/hvac/config", {
        method: "GET",
        auth: true,
    })
}

export function createHvacConfig(input: HvacUnitConfig): Promise<HvacUnitConfig> {

    // const res = await fetch(`${BASE_URL}/api/hvac/config`, {

    //     method: 'POST',
    //     headers: {
    //         'Content-Type': 'application/json'
    //     },
    //     body: JSON.stringify(input),
    // });

    // if (!res.ok) throw new Error('Failed to create HVAC config');
    // return res.json();

    return api<HvacUnitConfig>("/api/hvac/config", {
        method: "POST",
        body: JSON.stringify(input),
        auth: true,
    })
}