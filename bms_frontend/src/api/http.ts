import { keycloak } from "../keycloak";
import { BACKEND_URL } from "../utils/config";

const BASE_URL = BACKEND_URL;

console.log("KEYCLOAK IMPORT IN http.ts:", keycloak);

type ApiOptions = {
  method?: string;
  body?: BodyInit | null;
  headers?: Record<string, string>;
  auth?: boolean; // default true
};

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { auth = true, headers, body, ...rest } = options;

  if (auth) {
    if (!keycloak) {
      throw new Error(
        "Keycloak is undefined in http.ts. This usually means wrong import path or circular dependency."
      );
    }

    try {
      await keycloak.updateToken(30);
    } catch (e) {
      await keycloak.login();
      throw e;
    }

    if (!keycloak.token) {
      throw new Error("No Keycloak access token available. User is not authenticated.");
    }
  }

  const isFormData = body instanceof FormData;

  const finalHeaders: Record<string, string> = {
    ...(headers ?? {}),
    ...(auth ? { Authorization: `Bearer ${keycloak.token}` } : {}),
  };

  // Only set JSON content type for non-FormData requests
  if (!isFormData) {
    finalHeaders["Content-Type"] = "application/json";
  }

  console.log("API CALL:", `${BASE_URL}${path}`);
  console.log("AUTH HEADER EXISTS?", !!finalHeaders.Authorization);
  console.log("IS FORMDATA?", isFormData);

  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    body,
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