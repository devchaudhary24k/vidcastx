import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@/database';
import * as schema from '@/database/schema';
import { resend } from '@/mail/resend';

export const auth = betterAuth({
  /**
   * Database adapter for better-auth to use.
   * Through this adapter, better-auth will interact with the database.
   */
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      ...schema,
    },
  }),

  /**
   * Email and password authentication configuration.
   * This will enable email and password authentication.
   */
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    autoSignIn: false,
    sendResetPassword: async ({ url, user, token }, request) => {
      await resend.emails.send({
        to: user.email,
        from: 'no-reply@pixelactstudios.com',
        subject: 'Reset your password',
        text: `Click the link to reset your password: ${url}`,
      });
    },
  },

  /**
   * Rate limiting configuration.
   * This will enable rate limiting for all requests.
   */
  rateLimit: {
    window: 10, // time window in seconds
    max: 100, // max requests in the window
    storage: 'memory',
    enabled: false, // Change this to true to enable rate limiting
  },

  /**
   * Session configuration.
   * This will enable session management for all requests.
   */
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day (every 1 day the session expiration is updated)

    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ url, user, token }, request) => {
      await resend.emails.send({
        to: user.email,
        from: 'no-reply@pixelactstudios.com',
        subject: 'Verify your email address',
        text: `Click the link to verify your email: ${url}`,
      });
    },
  },
});
