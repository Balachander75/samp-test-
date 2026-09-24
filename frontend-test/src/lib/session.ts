type AuthUser = { userid?: unknown };

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

function getStorages(): Storage[] {
  if (typeof window === "undefined") return [];
  return [window.localStorage, window.sessionStorage];
}

function safelyRead(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

/** Remove every persisted authentication value from both storage scopes. */
export function clearAuthStorage(): void {
  for (const storage of getStorages()) {
    try {
      storage.removeItem(TOKEN_KEY);
      storage.removeItem(USER_KEY);
    } catch {
      // Storage can be unavailable in privacy-restricted browser contexts.
    }
  }
}

/** Read a valid JWT from the remembered session before the tab session. */
export function readAuthToken(): string | null {
  const raw = getStorages()
    .map((storage) => safelyRead(storage, TOKEN_KEY))
    .find((value) => value && value !== "null" && value !== "undefined" && value.trim());

  if (!raw) return null;

  const token = raw.trim().replace(/^["']|["']$/g, "");
  if (token.split(".").length !== 3) {
    clearAuthStorage();
    return null;
  }
  return token;
}

/** Read the profile from whichever scope owns the current authentication session. */
export function readAuthUser<T extends AuthUser>(): T | null {
  for (const storage of getStorages()) {
    const raw = safelyRead(storage, USER_KEY);
    if (!raw || raw === "null" || raw === "undefined") continue;

    try {
      const user = JSON.parse(raw) as T;
      if (user && typeof user === "object" && "userid" in user && user.userid) {
        return user;
      }
    } catch {
      // Continue to the other storage scope when stale JSON is encountered.
    }
  }
  return null;
}

/** Persist a newly authenticated user in exactly one storage scope. */
export function persistAuthSession(token: string, user: object, rememberMe: boolean): void {
  clearAuthStorage();
  const storage = rememberMe ? window.localStorage : window.sessionStorage;
  storage.setItem(TOKEN_KEY, token);
  storage.setItem(USER_KEY, JSON.stringify(user));
}

/** Keep the current profile in sync without changing the session lifetime. */
export function updateStoredAuthUser(user: object): void {
  const serialized = JSON.stringify(user);
  for (const storage of getStorages()) {
    try {
      if (storage.getItem(USER_KEY)) storage.setItem(USER_KEY, serialized);
    } catch {
      // A profile update remains valid in memory when browser storage is blocked.
    }
  }
}
