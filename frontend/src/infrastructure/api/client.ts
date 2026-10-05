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

/**
 * Typed HTTP request wrapper with standardized JSON error unwrapping.
 */
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit & { jsonBody?: unknown } = {}
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

  const response = await fetch(url, config);

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
