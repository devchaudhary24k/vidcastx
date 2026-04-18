import { createFileRoute, redirect } from "@tanstack/react-router";
import { getSession } from "#app/lib/auth.functions";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const session = await getSession();

    if (session) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error -- TanStack Router's redirect() throws a special redirect object
      throw redirect({ to: "/dashboard" });
    } else {
      // eslint-disable-next-line @typescript-eslint/only-throw-error -- TanStack Router's redirect() throws a special redirect object
      throw redirect({ to: "/auth/login" });
    }
  },
});
