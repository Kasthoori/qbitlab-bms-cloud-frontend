type Protocol = "http" | "https";

function env(name: string): string{

    const v = import.meta.env[name];
    if (!v) throw new Error(`Missing env var: ${name}`);
    return v;

}

function safeHostname(): string {
    // Works in Browser; avoids "Window is not defined" in tests/build tooling.

    if (typeof window !== "undefined" && window.location?.hostname) {
        return window.location.hostname;
    }

    return "localhost";
}

const protocol = env("VITE_PROTOCOL") as Protocol;
const apiPort = env("VITE_API_PORT");
const keycloakPort = env("VITE_KEYCLOAK_PORT");

export const CONFIG = {

    hostname: safeHostname(),
    protocol,

    apiBaseUrl: `${protocol}://${safeHostname()}:${apiPort}`,
    keycloakUrl: `${protocol}://${safeHostname()}:${keycloakPort}`,

    keycloakRealm: env("VITE_KEYCLOAK_REALM"),
    keycloakClientId: env("VITE_KEYCLOAK_CLIENT_ID"),
} as const;