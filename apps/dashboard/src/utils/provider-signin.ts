import { auth } from "@/lib/auth";

export const providerSignIn = async (provider: "github" | "discord") => {
  await auth.signIn.social({ provider });
};
