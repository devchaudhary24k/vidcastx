/**
 * An array of routes that are used for authentication.
 * These routes will redirect login users to settings.
 * @type {string[]}
 */
export const authRoutes = [
  '/auth/login',
  '/auth/register',
  '/auth/error',
  '/auth/reset',
  '/auth/forgot-password',
  '/auth/reset-password',
];

/**
 * An array of routes that are protected and require authentication.
 * These routes will redirect users to the login page if they are not authenticated.
 * @type {string[]}
 */
export const protectedRoutes = ['/dashboard'];

/**
 * The default redirect path after logging in.
 * @type {string}
 */
export const DEFAULT_LOGIN_REDIRECT = '/dashboard';
