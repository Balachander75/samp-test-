import React from "react";
import { UserProfileInfo, DashboardLayout } from "@/features/dashboard";
import { SamplingFeasibilityView } from "@/features/sample-requests/components/SamplingFeasibilityView";
import ErrorBoundary from "@/components/ErrorBoundary";

export interface SamplingFeasibilityPageProps {
  user?: UserProfileInfo | null;
  onLogout?: () => void;
}

export const SamplingFeasibilityPage: React.FC<SamplingFeasibilityPageProps> = ({
  user,
  onLogout,
}) => {
  return (
    <DashboardLayout
      user={user}
      onLogout={onLogout}
      title="SAMP Team — Feasibility"
      subtitle="Review and respond to manufacturing feasibility check requests routed to the sampling team."
    >
      <ErrorBoundary>
        <SamplingFeasibilityView currentUser={user} />
      </ErrorBoundary>
    </DashboardLayout>
  );
};

export default SamplingFeasibilityPage;
