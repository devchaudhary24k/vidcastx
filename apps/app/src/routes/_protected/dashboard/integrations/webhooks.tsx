import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/dashboard/integrations/webhooks")({
  component: WebhooksPage,
});

function WebhooksPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Webhooks</h1>
        <p className="text-muted-foreground">Configure webhook endpoints.</p>
      </div>
    </div>
  );
}
