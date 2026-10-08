import { readAuthToken } from "@/lib/session";

export const API_BASE_URL = import.meta.env.VITE_API_URL || "";

export interface ApiHeaderOptions {
  json?: boolean;
  accept?: boolean;
  token?: string | null;
}

/**
 * Builds consistent request headers including Bearer token.
 */
export function createApiHeaders({
  json = false,
  accept = false,
  token = readAuthToken(),
}: ApiHeaderOptions = {}): Record<string, string> {
  return {
    ...(accept ? { Accept: "application/json" } : {}),
    ...(json ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * Normalizes backend error responses into a human-readable error message.
 */
export function getApiErrorMessage(error: any, fallback: string): string {
  if (!error) return fallback;
  const detail = error?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => (typeof item === "string" ? item : item?.msg))
      .filter((value): value is string => typeof value === "string");
    if (messages.length) return messages.join(" ");
  }
  if (typeof detail?.message === "string") return detail.message;
  if (typeof error?.message === "string") return error.message;
  return fallback;
}

let activeRefreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = typeof window !== "undefined" ? localStorage.getItem("auth_refresh_token") || sessionStorage.getItem("auth_refresh_token") : null;
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) {
      // Refresh token expired or revoked
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_refresh_token");
        sessionStorage.removeItem("auth_token");
        sessionStorage.removeItem("auth_refresh_token");
      }
      return null;
    }
    const data = await res.json();
    const newAccessToken = data.access_token;
    const newRefreshToken = data.refresh_token || refreshToken;
    if (newAccessToken && typeof window !== "undefined") {
      if (localStorage.getItem("auth_token")) {
        localStorage.setItem("auth_token", newAccessToken);
        if (newRefreshToken) localStorage.setItem("auth_refresh_token", newRefreshToken);
      } else {
        sessionStorage.setItem("auth_token", newAccessToken);
        if (newRefreshToken) sessionStorage.setItem("auth_refresh_token", newRefreshToken);
      }
    }
    return newAccessToken;
  } catch {
    return null;
  }
}

/**
 * Typed HTTP request wrapper with standardized JSON error unwrapping and automatic 401 token refresh.
 */
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit & { jsonBody?: unknown; _retry?: boolean } = {}
): Promise<T> {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;
  const headers = createApiHeaders({
    json: Boolean(options.jsonBody),
    accept: true,
  });

  const config: RequestInit = {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {}),
    },
  };

  if (options.jsonBody !== undefined) {
    config.body = JSON.stringify(options.jsonBody);
  }

  let response = await fetch(url, config);

  // Automatic 401 Token Refresh & Request Retry
  if (response.status === 401 && !options._retry && !endpoint.includes("/api/auth/")) {
    if (!activeRefreshPromise) {
      activeRefreshPromise = refreshAccessToken().finally(() => {
        activeRefreshPromise = null;
      });
    }

    const newAccessToken = await activeRefreshPromise;
    if (newAccessToken) {
      const retryHeaders = createApiHeaders({
        json: Boolean(options.jsonBody),
        accept: true,
        token: newAccessToken,
      });
      const retryConfig: RequestInit = {
        ...options,
        _retry: true,
        headers: {
          ...retryHeaders,
          ...(options.headers || {}),
        },
      } as any;
      if (options.jsonBody !== undefined) {
        retryConfig.body = JSON.stringify(options.jsonBody);
      }
      response = await fetch(url, retryConfig);
    }
  }

  if (!response.ok) {
    let errorJson: any = null;
    try {
      errorJson = await response.json();
    } catch {
      // response is not JSON
    }
    const message = getApiErrorMessage(
      errorJson,
      `Request failed with status ${response.status}: ${response.statusText}`
    );
    throw new Error(message);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
}
