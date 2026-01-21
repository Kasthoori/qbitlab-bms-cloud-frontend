import { keycloak } from "../keycloak";
import { BACKEND_URL } from "../utils/config";

const BASE_URL = BACKEND_URL
 

type ApiOptions = RequestInit & {
  auth?: boolean; // default true
};

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { auth = true, headers, ...rest } = options;

  if (auth) {
    try {
      await keycloak.updateToken(30);
    } catch (e) {
      // refresh failed -> session likely expired
      await keycloak.login();
      throw e;
    }

    if (!keycloak.token) {
      // IMPORTANT: don't send request without token
      throw new Error("No Keycloak access token available. User is not authenticated.");
    }
  }

  // Build headers so Authorization cannot be overridden
  const finalHeaders: Record<string, string> = {
    ...(headers as Record<string, string> ?? {}),
    "Content-Type": "application/json",
    ...(auth ? { Authorization: `Bearer ${keycloak.token}` } : {}),
  };

  console.log("API CALL:", `${BASE_URL}${path}`);
  console.log("AUTH HEADER EXISTS?", !!finalHeaders.Authorization);

  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed (${res.status})`);
  }

  const contentType = res.headers.get("Content-Type") ?? "";
  if (!contentType.includes("application/json")) {
    // @ts-expect-error allow void returns
    return undefined;
  }

  return (await res.json()) as T;
}
