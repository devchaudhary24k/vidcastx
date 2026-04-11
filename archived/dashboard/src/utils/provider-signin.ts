import { DEFAULT_LOGIN_REDIRECT } from "@dashboard/constants/route";
import { auth } from "@dashboard/lib/auth";

export const providerSignIn = async (provider: "github" | "discord") => {
  await auth.signIn.social({ provider, callbackURL: DEFAULT_LOGIN_REDIRECT });
};
