/* eslint-disable @typescript-eslint/no-explicit-any */
import { keycloak } from "../keycloak";
import { BACKEND_URL } from "../utils/config";
import { navigateTo } from "../utils/navigation";

const BASE_URL = BACKEND_URL.replace(/\/+$/, "");

type ApiOptions = {
  method?: string;
  body?: BodyInit | null;
  headers?: Record<string, string>;
  auth?: boolean;
  handle403Redirect?: boolean;
};

type ApiError = {
  status: number;
  message: string;
  body?: unknown;
};

function buildApiUrl(path: string): string {
  const cleanPath = `/${path}`.replace(/\/+/g, "/");
  return `${BASE_URL}${cleanPath}`;
}

export async function api<T>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const {
    auth = true,
    headers,
    body,
    handle403Redirect = true,
    ...rest
  } = options;

  if (auth) {
    if (!keycloak) {
      throw new Error("Keycloak not initialized");
    }

    try {
      await keycloak.updateToken(30);
    } catch (e) {
      await keycloak.login();
      throw e;
    }

    if (!keycloak.token) {
      throw new Error("No access token");
    }
  }

  const isFormData = body instanceof FormData;

  const finalHeaders: Record<string, string> = {
    ...(headers ?? {}),
    ...(auth && keycloak?.token
      ? { Authorization: `Bearer ${keycloak.token}` }
      : {}),
  };

  if (!isFormData && body != null && !finalHeaders["Content-Type"]) {
    finalHeaders["Content-Type"] = "application/json";
  }

  const url = buildApiUrl(path);

  console.log("API Request URL:", url);

  const res = await fetch(url, {
    ...rest,
    method: rest.method ?? "GET",
    body,
    headers: finalHeaders,
  });

  if (res.status === 401) {
    await keycloak.login();
    throw { status: 401, message: "Unauthorized" } as ApiError;
  }

  if (res.status === 403) {
    if (handle403Redirect && window.location.pathname !== "/access-denied") {
      navigateTo("/access-denied");
    }

    throw {
      status: 403,
      message: "Forbidden",
    } as ApiError;
  }

  if (!res.ok) {
    let errorBody: unknown;
    let message = `Request failed (${res.status})`;

    try {
      errorBody = await res.json();

      if (
        errorBody &&
        typeof errorBody === "object" &&
        "message" in errorBody
      ) {
        message = (errorBody as any).message;
      }
    } catch {
      const text = await res.text().catch(() => "");
      errorBody = text;

      if (text) {
        message = text;
      }
    }

    throw {
      status: res.status,
      message,
      body: errorBody,
    } as ApiError;
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const contentType = res.headers.get("Content-Type") ?? "";

  if (!contentType.includes("application/json")) {
    return undefined as T;
  }

  return (await res.json()) as T;
}