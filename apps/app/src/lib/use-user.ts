import { auth } from "#app/lib/auth";

export const useUser = () => {
  return auth.useSession();
};
