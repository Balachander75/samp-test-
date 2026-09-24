import { useState } from "react";
import { SignInCredentials, AuthState, AuthResponse } from "../types";
import { API_BASE_URL } from "@/lib/api";
import { persistAuthSession } from "@/lib/session";

export function useSignInForm(onSuccessCallback?: (response: AuthResponse) => void) {
  const [credentials, setCredentials] = useState<SignInCredentials>({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [state, setState] = useState<AuthState>({
    isLoading: false,
    isSuccess: false,
    error: null,
    user: null,
  });

  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (field: keyof SignInCredentials, value: string | boolean) => {
    setCredentials((prev) => ({ ...prev, [field]: value }));
    if (state.error) {
      setState((prev) => ({ ...prev, error: null }));
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = credentials.email.trim();
    if (!trimmedInput || !credentials.password) {
      setState((prev) => ({ ...prev, error: "Please enter your email/username and password." }));
      return;
    }

    setState({ isLoading: true, isSuccess: false, error: null, user: null });

    try {
      const payload = {
        email: trimmedInput,
        username: trimmedInput,
        password: credentials.password,
        remember_me: credentials.rememberMe,
      };

      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      // Check for error responses
      if (!response.ok || data.ok === false) {
        let errorMessage = "Authentication failed. Please check your credentials.";
        if (response.status === 429 || data?.error?.code === "TOO_MANY_REQUESTS") {
          errorMessage = data?.error?.message || "Too many failed login attempts. Please wait a few minutes before trying again.";
        } else if (response.status === 403 || data?.error?.code === "ACCOUNT_DISABLED") {
          errorMessage = "This account has been frozen by the administrator. Access is disabled.";
        } else if (data?.error?.message) {
          errorMessage = data.error.message;
        } else if (typeof data?.detail === "string") {
          errorMessage = data.detail;
        } else if (Array.isArray(data?.detail) && data.detail[0]?.msg) {
          errorMessage = data.detail[0].msg;
        } else if (data?.message) {
          errorMessage = data.message;
        }
        setState({ isLoading: false, isSuccess: false, error: errorMessage, user: null });
        return;
      }

      // Handle both JWT schema and token/username response formats
      const token = data.access_token || data.token || "";
      const user = data.user || {
        id: data.id || 1,
        name: data.name || (data.username ? data.username.charAt(0).toUpperCase() + data.username.slice(1) : "Admin"),
        userid: data.userid || data.username || "admin",
        email: data.email || (data.username ? `${data.username}@example.com` : "admin@example.com"),
        role: data.role || "admin",
        is_active: true,
        created_at: new Date().toISOString(),
      };

      const normalizedAuth: AuthResponse = {
        access_token: token,
        token_type: data.token_type || "bearer",
        expires_in: data.expires_in || 86400,
        user,
      };

      persistAuthSession(token, user, credentials.rememberMe);

      setState({
        isLoading: false,
        isSuccess: true,
        error: null,
        user,
      });

      if (onSuccessCallback) {
        onSuccessCallback(normalizedAuth);
      }
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error && err.message.includes("Failed to fetch")
          ? "Unable to connect to backend server. Please make sure the backend is running at http://127.0.0.1:8000."
          : "An unexpected error occurred during sign in.";
      setState({ isLoading: false, isSuccess: false, error: errorMsg, user: null });
    }
  };

  return {
    credentials,
    state,
    showPassword,
    handleInputChange,
    togglePasswordVisibility,
    handleSubmit,
  };
}
