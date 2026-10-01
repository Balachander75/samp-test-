import { useState, Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ThemeProvider } from "@/context/ThemeContext";
import { SignInPage, UserProfile, AuthResponse } from "@/features/auth";
import { readAuthToken, readAuthUser, clearAuthStorage } from "@/lib/session";
import { AppShell, getNavigationTitle } from "@/layouts";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

// Route-level code splitting for performance and zero initial bloat
const OperationsOverview = lazy(() => import("@/features/dashboard/OperationsOverview"));
const SampleRequestsDesk = lazy(() => import("@/features/sample-requests/SampleRequestsDesk"));
const ProgramPlanningWorkspace = lazy(() => import("@/features/sample-requests/components/ProgramPlanningWorkspace"));
const ProductStagingWorkspace = lazy(() => import("@/features/sample-requests/components/ProductStagingWorkspace"));
const SamplingTeamDesk = lazy(() => import("@/features/samp-team/SamplingTeamDesk"));
const CreativeWorkDesk = lazy(() => import("@/features/creative/CreativeWorkDesk"));
const StudioWorkDesk = lazy(() => import("@/features/studio/StudioWorkDesk"));
const CostingTeamDesk = lazy(() => import("@/features/costing/CostingTeamDesk"));

// Low-CLS industrial skeleton loader matching ERP table & ribbon metrics
function DeskSkeletonLoader() {
  return (
    <div className="flex-1 flex flex-col h-full bg-[#fafafa] dark:bg-[#08090d] animate-pulse select-none">
      <div className="h-14 border-b border-zinc-200 dark:border-white/[0.08] px-6 flex items-center justify-between bg-white dark:bg-[#0f1118]">
        <div className="h-4 w-52 bg-zinc-200 dark:bg-zinc-800 rounded" />
        <div className="flex items-center gap-2">
          <div className="h-8.5 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
          <div className="h-8.5 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
        </div>
      </div>
      <div className="h-12 border-b border-zinc-200 dark:border-white/[0.07] bg-white dark:bg-[#0f1118] px-6 flex items-center gap-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-5 w-28 bg-zinc-200/60 dark:bg-zinc-800/60 rounded" />
        ))}
      </div>
      <div className="p-6 space-y-3 flex-1 overflow-hidden">
        <div className="h-9 w-full bg-zinc-100 dark:bg-zinc-850 rounded-md" />
        <div className="space-y-2 pt-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-11 w-full bg-zinc-100 dark:bg-zinc-900 rounded-md border border-zinc-200/60 dark:border-white/[0.04]"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ActiveModuleView({
  user,
}: {
  user: UserProfile;
}) {
  const location = useLocation();

  return (
    <ErrorBoundary variant="page">
    <Suspense fallback={<DeskSkeletonLoader />}>
      {(() => {
        // Executive Operations Overview (Dashboard Landing)
        if (location.pathname === "/dashboard" || location.pathname === "/") {
          return <OperationsOverview user={user} />;
        }

        // Seasonal Program Planning Workspace
        if (location.pathname === "/sample-requests/program-planning") {
          return <ProgramPlanningWorkspace user={user} />;
        }

        // Product Staging Workspace (Marketing Request Flow - Step 2)
        if (
          location.pathname === "/sample-requests/product-staging" ||
          location.pathname === "/sample-requests/add-product"
        ) {
          return <ProductStagingWorkspace user={user} />;
        }

        // SAMP Team Work Desk (Sampling Lab)
        if (
          location.pathname === "/samp-team-work" ||
          location.pathname === "/sampling" ||
          location.pathname === "/prototypes"
        ) {
          return <SamplingTeamDesk user={user} />;
        }

        // Creative Work Desk (Graphic & Packaging Artwork)
        if (
          location.pathname === "/creative-work" ||
          location.pathname === "/creative" ||
          location.pathname === "/artwork"
        ) {
          return <CreativeWorkDesk user={user} />;
        }

        // Studio Work Desk (Structural CAD & Dieline Engineering)
        if (
          location.pathname === "/studio-work" ||
          location.pathname === "/studio" ||
          location.pathname === "/cad" ||
          location.pathname === "/prepress"
        ) {
          return <StudioWorkDesk user={user} />;
        }

        // Costing Team Desk (BOM Pricing, Margin Simulator & Quotes)
        if (
          location.pathname === "/costing-team" ||
          location.pathname === "/costing" ||
          location.pathname === "/costing-work" ||
          location.pathname === "/bom"
        ) {
          return <CostingTeamDesk user={user} />;
        }

        // Marketing Work Desk (Sample Requests)
        if (location.pathname === "/sample-requests") {
          return <SampleRequestsDesk user={user} />;
        }

        // Default: Production-quality module placeholder
        const title = getNavigationTitle(location.pathname);
        const now = new Date();
        const dateStr = now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Module Header */}
      <div className="px-6 py-4 border-b border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0f1118] flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[15px] font-bold text-zinc-950 dark:text-zinc-50 tracking-tight">{title}</h1>
            <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-700/50">
              IN DEV
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono mt-0.5">{dateStr} · Navneet ERP · {user.sub_role || user.role}</p>
        </div>
      </div>

      <div className="p-6 space-y-5 max-w-5xl">
        {/* Metric skeleton row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Active Requests", value: "—", tone: "neutral" },
            { label: "Pending Review", value: "—", tone: "warning" },
            { label: "In Progress", value: "—", tone: "neutral" },
            { label: "Completed", value: "—", tone: "positive" },
          ].map((m) => (
            <div
              key={m.label}
              className="rounded border border-zinc-200 dark:border-white/[0.07] bg-white dark:bg-[#0f1018] p-4"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-zinc-400 dark:text-zinc-500 font-mono">{m.label}</p>
              <p className="mt-2 text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-50">{m.value}</p>
              <div className="mt-1.5 h-1 rounded-full bg-zinc-100 dark:bg-zinc-800" />
            </div>
          ))}
        </div>

        {/* Pipeline status skeleton */}
        <div className="rounded border border-zinc-200 dark:border-white/[0.07] bg-white dark:bg-[#0f1018] overflow-hidden">
          <div className="px-4 py-2.5 border-b border-zinc-100 dark:border-white/[0.05] flex items-center justify-between">
            <span className="text-[12px] font-semibold text-zinc-700 dark:text-zinc-300">Pipeline Overview</span>
            <span className="text-[10px] font-mono text-zinc-400">Loading data…</span>
          </div>
          <div className="divide-y divide-zinc-100 dark:divide-white/[0.04]">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-4 py-3 flex items-center gap-4 animate-pulse">
                <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
                <div className="h-3 w-40 bg-zinc-100 dark:bg-zinc-800/60 rounded" />
                <div className="h-3 w-20 bg-zinc-100 dark:bg-zinc-800/60 rounded ml-auto" />
                <div className="h-5 w-16 bg-zinc-100 dark:bg-zinc-800/60 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Info card */}
        <div className="rounded border border-dashed border-zinc-200 dark:border-zinc-800 p-8 text-center">
          <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{title} is being configured</p>
          <p className="text-[12px] text-zinc-400 dark:text-zinc-500 mt-1">
            This module will be designed based on your team's specific workflow requirements.
          </p>
        </div>
      </div>
    </div>
  );
})()}
    </Suspense>
    </ErrorBoundary>
  );
}


import { autoSaveStagedProductsToDraft } from "@/features/sample-requests/utils/autoSaveDraft";
import type { StagedProductItem } from "@/features/sample-requests/components/ProductStagingWorkspace";

function AppShellRouteWrapper({
  user,
  onLogout,
}: {
  user: UserProfile;
  onLogout: () => void;
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    // If user is currently in the Product Staging flow and clicks another section in the sidebar:
    const isStagingRoute =
      location.pathname === "/sample-requests/product-staging" ||
      location.pathname === "/sample-requests/add-product";

    if (isStagingRoute && path !== location.pathname) {
      const cachedStaged = sessionStorage.getItem("samp_active_staged_products");
      const cachedProgram = sessionStorage.getItem("samp_active_program_form");

      if (cachedStaged) {
        try {
          const items: StagedProductItem[] = JSON.parse(cachedStaged);
          if (Array.isArray(items) && items.length > 0) {
            // Immediately clear sessionStorage to prevent duplicate submissions
            sessionStorage.removeItem("samp_active_staged_products");
            sessionStorage.removeItem("samp_active_program_form");

            const programContext = cachedProgram ? JSON.parse(cachedProgram) : null;
            const progTitle = programContext?.programName || programContext?.customer || "Program";

            // Fire auto-save in background
            autoSaveStagedProductsToDraft(items, programContext, user).then((res) => {
              if (res.success) {
                window.dispatchEvent(
                  new CustomEvent("app:show-toast", {
                    detail: {
                      message: `✓ Auto-saved ${res.count} staged product(s) for "${res.programName || res.customer}" directly to Drafts.`,
                      tone: "success",
                    },
                  })
                );
              }
            }).catch((err) => {
              console.error("Auto-save draft error:", err);
            });

            // Instant toast notification while transitioning to other section
            window.dispatchEvent(
              new CustomEvent("app:show-toast", {
                detail: {
                  message: `Auto-saving ${items.length} product(s) for "${progTitle}" to Draft queue...`,
                  tone: "info",
                },
              })
            );

            // If navigating to sample requests, redirect directly to Draft stage tab
            if (path === "/sample-requests") {
              navigate("/sample-requests", { state: { stage: "draft", refresh: Date.now() } });
              return;
            }
          }
        } catch (e) {
          console.error("Failed to parse staged products on navigation:", e);
        }
      }
    }

    navigate(path);
  };

  return (
    <AppShell
      user={user}
      onLogout={onLogout}
      currentPath={location.pathname}
      onNavigate={handleNavigate}
    >
      <ActiveModuleView user={user} />
    </AppShell>
  );
}

function AppRoutes() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const token = readAuthToken();
    const user = readAuthUser<UserProfile>();
    return token && user ? user : null;
  });

  const handleSignInSuccess = (response: AuthResponse) => {
    setCurrentUser(response.user);
  };

  const handleLogout = () => {
    clearAuthStorage();
    setCurrentUser(null);
  };

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route
          path="/signin"
          element={
            currentUser ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <SignInPage onSignInSuccess={handleSignInSuccess} />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            currentUser ? (
              <AppShellRouteWrapper user={currentUser} onLogout={handleLogout} />
            ) : (
              <Navigate to="/signin" replace />
            )
          }
        />
        <Route
          path="/sample-requests"
          element={
            currentUser ? (
              <AppShellRouteWrapper user={currentUser} onLogout={handleLogout} />
            ) : (
              <Navigate to="/signin" replace />
            )
          }
        />
        <Route
          path="/sample-requests/program-planning"
          element={
            currentUser ? (
              <AppShellRouteWrapper user={currentUser} onLogout={handleLogout} />
            ) : (
              <Navigate to="/signin" replace />
            )
          }
        />
        <Route
          path="/sample-requests/product-staging"
          element={
            currentUser ? (
              <AppShellRouteWrapper user={currentUser} onLogout={handleLogout} />
            ) : (
              <Navigate to="/signin" replace />
            )
          }
        />
        <Route
          path="/sample-requests/add-product"
          element={
            currentUser ? (
              <AppShellRouteWrapper user={currentUser} onLogout={handleLogout} />
            ) : (
              <Navigate to="/signin" replace />
            )
          }
        />
        <Route
          path="/creative-work"
          element={
            currentUser ? (
              <AppShellRouteWrapper user={currentUser} onLogout={handleLogout} />
            ) : (
              <Navigate to="/signin" replace />
            )
          }
        />
        <Route
          path="/studio-work"
          element={
            currentUser ? (
              <AppShellRouteWrapper user={currentUser} onLogout={handleLogout} />
            ) : (
              <Navigate to="/signin" replace />
            )
          }
        />
        <Route
          path="/samp-team-work"
          element={
            currentUser ? (
              <AppShellRouteWrapper user={currentUser} onLogout={handleLogout} />
            ) : (
              <Navigate to="/signin" replace />
            )
          }
        />
        <Route
          path="/costing-team"
          element={
            currentUser ? (
              <AppShellRouteWrapper user={currentUser} onLogout={handleLogout} />
            ) : (
              <Navigate to="/signin" replace />
            )
          }
        />
        <Route
          path="/plant"
          element={
            currentUser ? (
              <AppShellRouteWrapper user={currentUser} onLogout={handleLogout} />
            ) : (
              <Navigate to="/signin" replace />
            )
          }
        />
        <Route path="/plant-execution" element={<Navigate to="/plant" replace />} />
        <Route path="/plant-work" element={<Navigate to="/plant" replace />} />
        <Route
          path="/analytics"
          element={
            currentUser ? (
              <AppShellRouteWrapper user={currentUser} onLogout={handleLogout} />
            ) : (
              <Navigate to="/signin" replace />
            )
          }
        />
        <Route
          path="/members"
          element={
            currentUser ? (
              <AppShellRouteWrapper user={currentUser} onLogout={handleLogout} />
            ) : (
              <Navigate to="/signin" replace />
            )
          }
        />
        <Route
          path="/settings"
          element={
            currentUser ? (
              <AppShellRouteWrapper user={currentUser} onLogout={handleLogout} />
            ) : (
              <Navigate to="/signin" replace />
            )
          }
        />
        <Route
          path="/help"
          element={
            currentUser ? (
              <AppShellRouteWrapper user={currentUser} onLogout={handleLogout} />
            ) : (
              <Navigate to="/signin" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to={currentUser ? "/dashboard" : "/signin"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary variant="page">
        <AppRoutes />
      </ErrorBoundary>
    </ThemeProvider>
  );
}
