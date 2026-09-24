import { useState, useEffect, useRef, useCallback, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { ThemeProvider } from "@/context/ThemeContext";
import { UserProfileInfo } from "@/features/dashboard";
import { AuthResponse } from "@/features/auth";
import ErrorBoundary from "@/components/ErrorBoundary";
import { SettingsProfileData } from "@/features/settings";
import { API_BASE_URL } from "@/lib/api";
import {
  clearAuthStorage,
  readAuthToken,
  readAuthUser,
  updateStoredAuthUser,
} from "@/lib/session";

import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { TopProgressBar } from "@/components/ui/TopProgressBar";

// Route Code-Splitting: Lazy load pages to keep initial bundle tiny and fast
const SignInPage = lazy(() => import("@/pages/SignInPage"));
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const SampleRequestsPage = lazy(() => import("@/pages/SampleRequestsPage"));
const MembersPage = lazy(() => import("@/pages/MembersPage"));
const CreativeWorkPage = lazy(() => import("@/pages/CreativeWorkPage"));
const WorkInProgressPage = lazy(() => import("@/pages/WorkInProgressPage"));
const NotificationsPage = lazy(() => import("@/pages/NotificationsPage"));
const SamplingFeasibilityPage = lazy(() => import("@/pages/SamplingFeasibilityPage"));
const SampTeamWorkPage = lazy(() => import("@/pages/SampTeamWorkPage"));
const StudioWorkPage = lazy(() => import("@/pages/StudioWorkPage"));
const CostingWorkPage = lazy(() => import("@/pages/CostingWorkPage"));

function AppRoutes() {
  // Restore session synchronously from localStorage on first render.
  // This is the KEY fix: no async, no useEffect needed for init — avoids React StrictMode double-run race.
  const [currentUser, setCurrentUser] = useState<UserProfileInfo | null>(() => {
    const token = readAuthToken();
    const storedUser = readAuthUser<UserProfileInfo>();
    if (!token || !storedUser) return null;
    return {
      name: storedUser.name || "User",
      userid: storedUser.userid,
      email: storedUser.email || "",
      role: storedUser.role || "user",
      sub_role: storedUser.sub_role,
    };
  });

  const navigate = useNavigate();
  const focusDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Poll /api/auth/me to detect if a non-admin account has been frozen or had its token expired.
   * Uses AbortSignal so the request is cancelled on component unmount (React StrictMode safe).
   */
  const checkActiveSession = useCallback(
    async (signal?: AbortSignal) => {
      if (!currentUser) return;
      // Admin accounts are never frozen — skip entirely
      if (currentUser.role?.toLowerCase() === "admin" || currentUser.userid === "admin") return;

      const tok = readAuthToken();
      if (!tok) return;

      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${tok}` },
          signal,
        });

        if (signal?.aborted) return;

        if (res.status === 403) {
          const data = await res.json().catch(() => null);
          if (data?.error?.code === "ACCOUNT_DISABLED") {
            clearAuthStorage();
            setCurrentUser(null);
            navigate("/signin", { replace: true });
            alert("Your account has been frozen by the administrator. You have been logged out.");
          }
          return;
        }

        if (res.status === 401) {
          // Token expired — clear session and redirect
          clearAuthStorage();
          setCurrentUser(null);
          navigate("/signin", { replace: true });
        }
      } catch {
        // AbortError or network failure — do NOT force logout
      }
    },
    [currentUser, navigate]
  );

  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.role?.toLowerCase() === "admin" || currentUser.userid === "admin") return;

    const controller = new AbortController();

    // First check after 15s — gives the page time to settle after login/refresh
    const firstTimer = setTimeout(() => checkActiveSession(controller.signal), 15000);
    // Subsequent checks every 60s
    const interval = setInterval(() => checkActiveSession(controller.signal), 60000);

    // Debounced focus handler: waits 3s before checking to avoid rapid tab-switch false positives
    const handleFocus = () => {
      if (focusDebounceRef.current) clearTimeout(focusDebounceRef.current);
      focusDebounceRef.current = setTimeout(() => checkActiveSession(controller.signal), 3000);
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      controller.abort();
      clearTimeout(firstTimer);
      clearInterval(interval);
      if (focusDebounceRef.current) clearTimeout(focusDebounceRef.current);
      window.removeEventListener("focus", handleFocus);
    };
  }, [currentUser, checkActiveSession]);

  const handleSignInSuccess = (response: AuthResponse) => {
    setCurrentUser({
      name: response.user.name,
      userid: response.user.userid,
      email: response.user.email,
      role: response.user.role,
      sub_role: response.user.sub_role,
    });
    navigate("/dashboard", { replace: true });
  };

  const handleLogout = () => {
    clearAuthStorage();
    setCurrentUser(null);
    navigate("/signin", { replace: true });
  };

  const handleUserUpdated = (profile: SettingsProfileData) => {
    const updatedUser = { ...currentUser, ...profile };
    setCurrentUser(updatedUser);
    updateStoredAuthUser(updatedUser);
  };

  return (
    <>
      <TopProgressBar />
      <Suspense fallback={<LoadingScreen variant="fullscreen" />}>
        <Routes>
          {/* Root redirect */}
          <Route
            path="/"
            element={currentUser ? <Navigate to="/dashboard" replace /> : <Navigate to="/signin" replace />}
          />

          {/* Sign-in — redirect to dashboard if already logged in */}
          <Route
            path="/signin"
            element={currentUser ? <Navigate to="/dashboard" replace /> : <SignInPage onSignInSuccess={handleSignInSuccess} />}
          />

          <Route path="/login" element={<Navigate to="/signin" replace />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={currentUser ? <DashboardPage user={currentUser} onLogout={handleLogout} tabTitle="Dashboard" /> : <Navigate to="/signin" replace />}
          />
          <Route
            path="/settings"
            element={currentUser ? <SettingsPage user={currentUser} onLogout={handleLogout} onUserUpdated={handleUserUpdated} /> : <Navigate to="/signin" replace />}
          />
          <Route
            path="/sample-requests"
            element={currentUser ? <SampleRequestsPage user={currentUser} onLogout={handleLogout} /> : <Navigate to="/signin" replace />}
          />
          <Route
            path="/sample-requests/new"
            element={currentUser ? <SampleRequestsPage user={currentUser} onLogout={handleLogout} isCreateRoute /> : <Navigate to="/signin" replace />}
          />
          <Route
            path="/sample-requests/feasibility-check"
            element={currentUser ? <SampleRequestsPage user={currentUser} onLogout={handleLogout} isFeasibilityRoute /> : <Navigate to="/signin" replace />}
          />
          <Route
            path="/sample-requests/program-planning"
            element={currentUser ? <SampleRequestsPage user={currentUser} onLogout={handleLogout} isPlanningRoute /> : <Navigate to="/signin" replace />}
          />
          <Route
            path="/sample-requests/add-product"
            element={currentUser ? <SampleRequestsPage user={currentUser} onLogout={handleLogout} isAddProductRoute /> : <Navigate to="/signin" replace />}
          />
          <Route
            path="/sample-requests/design-request"
            element={currentUser ? <SampleRequestsPage user={currentUser} onLogout={handleLogout} isDesignRequestRoute /> : <Navigate to="/signin" replace />}
          />
          <Route
            path="/sample-requests/draft-workspace"
            element={currentUser ? <SampleRequestsPage user={currentUser} onLogout={handleLogout} isDraftWorkspaceRoute /> : <Navigate to="/signin" replace />}
          />
          <Route path="/marketing-work" element={<Navigate to="/sample-requests" replace />} />
          <Route path="/sales" element={<Navigate to="/sample-requests" replace />} />
          
          {/* Creative Work routes */}
          <Route
            path="/creative-work"
            element={currentUser ? <CreativeWorkPage user={currentUser} onLogout={handleLogout} /> : <Navigate to="/signin" replace />}
          />
          <Route path="/overview" element={<Navigate to="/creative-work" replace />} />

          {/* Studio Work routes */}
          <Route
            path="/studio-work"
            element={currentUser ? <StudioWorkPage user={currentUser} onLogout={handleLogout} /> : <Navigate to="/signin" replace />}
          />
          <Route path="/products" element={<Navigate to="/studio-work" replace />} />

          {/* SAMP Team Work routes */}
          <Route
            path="/samp-team-work"
            element={currentUser ? <SampTeamWorkPage user={currentUser} onLogout={handleLogout} /> : <Navigate to="/signin" replace />}
          />
          <Route
            path="/sampling/feasibility"
            element={currentUser ? <SamplingFeasibilityPage user={currentUser} onLogout={handleLogout} /> : <Navigate to="/signin" replace />}
          />
          <Route path="/tags" element={<Navigate to="/samp-team-work" replace />} />

          {/* Costing Team routes */}
          <Route
            path="/costing-team"
            element={currentUser ? <CostingWorkPage user={currentUser} onLogout={handleLogout} /> : <Navigate to="/signin" replace />}
          />
          <Route path="/costing" element={<Navigate to="/costing-team" replace />} />
          <Route path="/costing-work" element={<Navigate to="/costing-team" replace />} />

          {/* Analytics route */}
          <Route
            path="/analytics"
            element={currentUser ? <WorkInProgressPage user={currentUser} onLogout={handleLogout} title="Analytics" moduleKey="analytics" /> : <Navigate to="/signin" replace />}
          />

          {/* Members route */}
          <Route
            path="/members"
            element={currentUser ? <MembersPage user={currentUser} onLogout={handleLogout} /> : <Navigate to="/signin" replace />}
          />

          {/* Help & Support route */}
          <Route
            path="/help"
            element={currentUser ? <WorkInProgressPage user={currentUser} onLogout={handleLogout} title="Help & Support" moduleKey="help" /> : <Navigate to="/signin" replace />}
          />
          {/* Notifications route */}
          <Route
            path="/notifications"
            element={currentUser ? <NotificationsPage user={currentUser} onLogout={handleLogout} /> : <Navigate to="/signin" replace />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <ErrorBoundary>
          <AppRoutes />
        </ErrorBoundary>
      </BrowserRouter>
    </ThemeProvider>
  );
}
