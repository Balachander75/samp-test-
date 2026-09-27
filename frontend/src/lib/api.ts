import { readAuthToken } from "@/lib/session";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "";

interface ApiHeaderOptions {
  json?: boolean;
  accept?: boolean;
  token?: string | null;
}

/** Build consistent request headers without forcing callers into a new response API. */
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
