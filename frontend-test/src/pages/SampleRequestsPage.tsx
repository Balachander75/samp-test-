import React, { lazy, Suspense } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { UserProfileInfo, DashboardLayout } from "@/features/dashboard";
import { SampleRequestsView } from "@/features/sample-requests/components/SampleRequestsView";
import ErrorBoundary from "@/components/ErrorBoundary";

const CreateSampleRequestPage = lazy(() =>
  import("@/features/sample-requests/components/CreateSampleRequestPage").then((module) => ({
    default: module.CreateSampleRequestPage,
  })),
);
const AddProductPage = lazy(() =>
  import("@/features/sample-requests/components/AddProductPage").then((module) => ({
    default: module.AddProductPage,
  })),
);
const DesignRequestPage = lazy(() =>
  import("@/features/sample-requests/components/DesignRequestPage").then((module) => ({
    default: module.DesignRequestPage,
  })),
);
const DraftWorkspacePage = lazy(() =>
  import("@/features/sample-requests/components/DraftWorkspacePage").then((module) => ({
    default: module.DraftWorkspacePage,
  })),
);
const FeasibilityCheckPage = lazy(() =>
  import("@/features/sample-requests/components/FeasibilityCheckPage").then((module) => ({
    default: module.FeasibilityCheckPage,
  })),
);
const ProgramPlanningPage = lazy(() =>
  import("@/features/sample-requests/components/ProgramPlanningPage").then((module) => ({
    default: module.ProgramPlanningPage,
  })),
);

import { FlowStepSkeleton } from "@/components/ui/Skeleton";

function FlowLoader() {
  return <FlowStepSkeleton />;
}

export interface SampleRequestsPageProps {
  user?: UserProfileInfo | null;
  onLogout?: () => void;
  isCreateRoute?: boolean;
  isAddProductRoute?: boolean;
  isDesignRequestRoute?: boolean;
  isDraftWorkspaceRoute?: boolean;
  isFeasibilityRoute?: boolean;
  isPlanningRoute?: boolean;
}

export const SampleRequestsPage: React.FC<SampleRequestsPageProps> = ({
  user,
  onLogout,
  isCreateRoute,
  isAddProductRoute,
  isDesignRequestRoute,
  isDraftWorkspaceRoute,
  isFeasibilityRoute,
  isPlanningRoute,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const isCreate = Boolean(isCreateRoute || location.pathname.endsWith("/new"));
  const isFeasibility = Boolean(
    isFeasibilityRoute || location.pathname.endsWith("/feasibility-check")
  );
  const isPlanning = Boolean(
    isPlanningRoute || location.pathname.endsWith("/program-planning")
  );
  const isAddProduct = Boolean(
    isAddProductRoute || location.pathname.endsWith("/add-product")
  );
  const isDesignRequest = Boolean(
    isDesignRequestRoute || location.pathname.endsWith("/design-request")
  );
  const isDraftWorkspace = Boolean(
    isDraftWorkspaceRoute || location.pathname.endsWith("/draft-workspace")
  );

  const isSubRoute = isCreate || isFeasibility || isPlanning || isAddProduct || isDesignRequest || isDraftWorkspace;

  const refreshRef = React.useRef<() => void>(() => {});
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  let pageTitle = "Marketing Work";
  let pageSubtitle =
    "Commercial intake, customer sampling requirements, creative and plant production routing.";

  if (isCreate) {
    pageTitle = "Create New Request";
    pageSubtitle =
      "Choose a creation track to start sample creation, feasibility check, or seasonal line planning.";
  } else if (isFeasibility) {
    pageTitle = "Manufacturing Feasibility Check";
    pageSubtitle =
      "Audit technical parameters, machine capabilities, and custom binding structures.";
  } else if (isPlanning) {
    pageTitle = "Seasonal Program Planning";
    pageSubtitle =
      "Structure seasonal collection goals, target milestones, and planned SKU categories.";
  } else if (isAddProduct) {
    pageTitle = "Add Product";
    pageSubtitle =
      "Search and stage products for batch sample request submission.";
  } else if (isDesignRequest) {
    pageTitle = "Design Request";
    pageSubtitle = "Capture the design brief for the selected customer program.";
  } else if (isDraftWorkspace) {
    pageTitle = "Draft Program Workspace";
    pageSubtitle =
      "Review, edit specifications, add products, and release draft program package.";
  }

  return (
    <DashboardLayout
      user={user}
      onLogout={onLogout}
      title={pageTitle}
      subtitle={pageSubtitle}
      hideHeader={isSubRoute}
      hideHeaderActions={isSubRoute}
      onRefresh={!isSubRoute ? () => refreshRef.current() : undefined}
      isRefreshing={isRefreshing}
    >
      <ErrorBoundary>
        {isCreate ? (
          <Suspense fallback={<FlowLoader />}>
            <CreateSampleRequestPage
              onBack={() => {
                sessionStorage.removeItem("samp_active_program_form");
                navigate("/sample-requests");
              }}
              currentUser={user}
            />
          </Suspense>
        ) : isFeasibility ? (
          <Suspense fallback={<FlowLoader />}>
            <FeasibilityCheckPage
              onBack={() => navigate("/sample-requests/new")}
              currentUser={user}
            />
          </Suspense>
        ) : isPlanning ? (
          <Suspense fallback={<FlowLoader />}>
            <ProgramPlanningPage
              onBack={() => navigate("/sample-requests/new")}
              currentUser={user}
            />
          </Suspense>
        ) : isAddProduct ? (
          <Suspense fallback={<FlowLoader />}>
            <AddProductPage
              onBack={() => navigate("/sample-requests/new", { state: { fromStaging: true } })}
              onDesignOnly={() => navigate("/sample-requests/design-request")}
              currentUser={user}
            />
          </Suspense>
        ) : isDesignRequest ? (
          <Suspense fallback={<FlowLoader />}>
            <DesignRequestPage
              currentUser={user}
              onBack={() => navigate("/sample-requests/add-product")}
            />
          </Suspense>
        ) : isDraftWorkspace ? (
          <Suspense fallback={<FlowLoader />}>
            <DraftWorkspacePage
              currentUser={user}
              onBack={() => navigate("/sample-requests")}
            />
          </Suspense>
        ) : (
          <SampleRequestsView
            user={user}
            onNavigateCreate={() => {
              sessionStorage.removeItem("samp_active_program_form");
              navigate("/sample-requests/new");
            }}
            onRegisterRefresh={(fn) => {
              refreshRef.current = fn;
            }}
            onRefreshingChange={setIsRefreshing}
          />
        )}
      </ErrorBoundary>
    </DashboardLayout>
  );
};

export default SampleRequestsPage;
