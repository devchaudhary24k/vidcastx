import { createFileRoute } from "@tanstack/react-router";
import { AuthHeader, SignupForm } from "#app/features/auth";

export const Route = createFileRoute("/auth/signup")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <AuthHeader />
        <SignupForm />
      </div>
    </div>
  );
}
