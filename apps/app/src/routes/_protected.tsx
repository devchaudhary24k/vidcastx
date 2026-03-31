import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getSession } from "#app/lib/auth.functions";

export const Route = createFileRoute("/_protected")({
  beforeLoad: async ({ location }) => {
    const session = await getSession();

    if (!session) throw redirect({ to: "/auth/login", search: { redirect: location.href } });
  },

  component: () => <Outlet />,
});
