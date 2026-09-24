import { TeamMemberItem } from "../types";
import { API_BASE_URL, createApiHeaders } from "@/lib/api";
import { readAuthToken } from "@/lib/session";

const getStoredAuthToken = readAuthToken;
export { getStoredAuthToken };

export async function fetchUsersApi(): Promise<TeamMemberItem[]> {
  try {
    const token = getStoredAuthToken();
    const res = await fetch(`${API_BASE_URL}/api/auth/users`, {
      headers: createApiHeaders({ accept: true, token }),
    });
    if (!res.ok) {
      if (res.status === 401) {
        console.warn("Session expired or missing authentication token.");
      }
      throw new Error(`Failed to fetch users: ${res.statusText}`);
    }
    const data = await res.json();
    return data.map((u: any) => ({
      id: u.id,
      name: u.name,
      userid: u.userid,
      email: u.email,
      role: u.role,
      sub_role: u.sub_role || undefined,
      is_active: Boolean(u.is_active),
      created_at: u.created_at,
    }));
  } catch (err) {
    console.error("Error fetching users from API:", err);
    return [];
  }
}

export async function createUserApi(payload: {
  name: string;
  userid: string;
  email: string;
  password?: string;
  role: string;
  sub_role?: string;
  is_active?: boolean;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const token = getStoredAuthToken();
    if (!token) {
      return { success: false, error: "Authentication session expired. Please sign in again." };
    }
    const res = await fetch(`${API_BASE_URL}/api/auth/users`, {
      method: "POST",
      headers: createApiHeaders({ json: true, token }),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      if (res.status === 401) {
        return { success: false, error: "Your session has expired. Please sign in again." };
      }
      const errData = await res.json().catch(() => ({}));
      const errorMsg =
        errData?.error?.message ||
        (typeof errData?.detail === "string" ? errData.detail : null) ||
        errData?.message ||
        "Failed to create team member.";
      return { success: false, error: errorMsg };
    }
    const data = await res.json();
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || "Network error" };
  }
}

export async function deleteUserApi(userId: number): Promise<{ success: boolean; error?: string }> {
  try {
    const token = getStoredAuthToken();
    if (!token) {
      return { success: false, error: "Authentication session expired. Please sign in again." };
    }
    const res = await fetch(`${API_BASE_URL}/api/auth/users/${userId}`, {
      method: "DELETE",
      headers: createApiHeaders({ token }),
    });

    if (!res.ok) {
      if (res.status === 401) {
        return { success: false, error: "Your session has expired. Please sign in again." };
      }
      const errData = await res.json().catch(() => ({}));
      const errorMsg =
        errData?.error?.message ||
        (typeof errData?.detail === "string" ? errData.detail : null) ||
        errData?.message ||
        "Failed to delete team member.";
      return { success: false, error: errorMsg };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Network error" };
  }
}

export async function updateUserStatusApi(
  userId: number,
  isActive: boolean
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const token = getStoredAuthToken();
    if (!token) {
      return { success: false, error: "Authentication session expired. Please sign in again." };
    }
    const res = await fetch(`${API_BASE_URL}/api/auth/users/${userId}/status`, {
      method: "PATCH",
      headers: createApiHeaders({ json: true, token }),
      body: JSON.stringify({ is_active: isActive }),
    });

    if (!res.ok) {
      if (res.status === 401) {
        return { success: false, error: "Your session has expired. Please sign in again." };
      }
      const errData = await res.json().catch(() => ({}));
      const errorMsg =
        errData?.error?.message ||
        (typeof errData?.detail === "string" ? errData.detail : null) ||
        errData?.message ||
        `Failed to ${isActive ? "activate" : "freeze"} account.`;
      return { success: false, error: errorMsg };
    }
    const data = await res.json();
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || "Network error" };
  }
}

export interface UpdateCurrentUserPayload {
  name: string;
  userid: string;
  email: string;
  current_password?: string;
  new_password?: string;
}

export async function updateCurrentUserApi(
  payload: UpdateCurrentUserPayload,
): Promise<{ success: boolean; user?: TeamMemberItem; error?: string }> {
  try {
    const token = getStoredAuthToken();
    if (!token) {
      return { success: false, error: "Authentication session expired. Please sign in again." };
    }
    const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: "PATCH",
      headers: createApiHeaders({ json: true, accept: true, token }),
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        success: false,
        error: data?.error?.message || data?.detail || "Failed to save account settings.",
      };
    }
    return {
      success: true,
      user: {
        id: data.id,
        name: data.name,
        userid: data.userid,
        email: data.email,
        role: data.role,
        sub_role: data.sub_role || undefined,
        is_active: Boolean(data.is_active),
        created_at: data.created_at,
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}
