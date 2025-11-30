import { DEFAULT_LOGIN_REDIRECT } from "@/constants/route";
import { auth } from "@/lib/auth";

export const providerSignIn = async (provider: "github" | "discord") => {
  await auth.signIn.social({ provider, callbackURL: DEFAULT_LOGIN_REDIRECT });
};
