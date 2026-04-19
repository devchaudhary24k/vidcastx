import { DEFAULT_LOGIN_REDIRECT } from "#app/constants/route";
import { env } from "#app/env";
import { auth } from "#app/lib/auth";

const callbackURL = `${env.VITE_APP_URL}${DEFAULT_LOGIN_REDIRECT}`;

/**
 * Client-side function to handle social sign in via Better Auth.
 * This will redirect the browser to the respective OAuth provider.
 */
export const providerSignIn = async (provider: "github" | "discord") => {
  await auth.signIn.social({ provider, callbackURL });
};

/**
 * Client-side function to handle email/password sign in via Better Auth.
 * Returns the response which can be handled by the UI to show errors or invalidate router.
 */
export const emailSignIn = async (email: string, password: string) => {
  return await auth.signIn.email({
    email,
    password,
    callbackURL,
  });
};

/**
 * Client-side function to handle email/password sign up via Better Auth.
 */
export const emailSignUp = async (data: { name: string; email: string; password: string }) => {
  return await auth.signUp.email({
    ...data,
    callbackURL,
  });
};
