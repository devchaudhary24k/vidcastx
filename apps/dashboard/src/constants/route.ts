/**
 * An array of routes that are used for authentication.
 * These routes will redirect login users to settings.
 */
export const authRoutes: string[] = [
  "/auth/login",
  "/auth/signup",
  "/auth/error",
  "/auth/forgot-password",
];

/**
 * An array of route prefixes that are protected and require authentication.
 * These routes and all their sub-routes will redirect users to the login page if they are not authenticated.
 */
export const protectedRoutes: string[] = [
  "/dashboard",
  "onboarding",
  "/account",
  "/settings",
];

/**
 * The default redirect path after logging in.
 */
export const DEFAULT_LOGIN_REDIRECT: string = "/dashboard";
