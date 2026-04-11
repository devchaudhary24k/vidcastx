import { createFileRoute, redirect } from "@tanstack/react-router";
import { getSession } from "#app/lib/auth.functions";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const session = await getSession();

    if (session) {
      throw redirect({ to: "/dashboard" });
    } else {
      throw redirect({ to: "/auth/login" });
    }
  },
});
