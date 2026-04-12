import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/dashboard/team/members")({
  component: MembersPage,
});

function MembersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Members</h1>
        <p className="text-muted-foreground">Manage team members and their roles.</p>
      </div>
    </div>
  );
}
