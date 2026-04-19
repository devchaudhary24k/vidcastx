import { createFileRoute } from "@tanstack/react-router";

import { OnboardingWrapper } from "#app/features/onboarding";

export const Route = createFileRoute("/_protected/onboarding")({
  component: OnboardingPage,
});

function OnboardingPage() {
  return <OnboardingWrapper />;
}
