import { keycloak } from "../auth/keycloak";
import { CONFIG } from "../config/env";

const API_BASE = CONFIG.apiBaseUrl;

export async function apiGet(path: string) {

    const res = await fetch(`${API_BASE}${path}`, {
        headers: {
            Authorization: `Bearer ${keycloak.token}`,
            "Content-Type": "application/json",
        },
    });

    if (!res.ok) {
        throw new Error(await res.text());
    }

    return res.json();

}