"use client";

import { auth as authClient } from "./auth";

// Client-side user fetch hook
export const useUser = () => {
  return authClient.useSession();
};
