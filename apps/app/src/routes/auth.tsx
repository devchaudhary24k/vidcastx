import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { DEFAULT_LOGIN_REDIRECT } from "#app/constants/route";
import { getSession } from "#app/lib/auth.functions";

export const Route = createFileRoute("/auth")({
  beforeLoad: async () => {
    const session = await getSession();

    // Already authenticated — redirect to dashboard
    if (session) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error -- TanStack Router's redirect() throws a special redirect object
      throw redirect({ to: DEFAULT_LOGIN_REDIRECT });
    }
  },

  component: () => <Outlet />,
});
