import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/dashboard/billing/subscription")({
  component: SubscriptionPage,
});

function SubscriptionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Subscription</h1>
        <p className="text-muted-foreground">View and manage your subscription plan.</p>
      </div>
    </div>
  );
}
