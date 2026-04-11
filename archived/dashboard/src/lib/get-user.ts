import { headers } from "next/headers";

import { auth as authServer } from "@vidcastx/auth";

// Server-side user fetch function
export const getUser = async () => {
  return await authServer.api.getSession({
    headers: await headers(),
  });
};
