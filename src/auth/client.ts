import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: 'http://localhost:3000',
  fetchOptions: {
    onError: async (context) => {
      const { response } = context;
      if (response.status === 429) {
        const retryAfter = response.headers.get('X-Retry-After');
        console.log(`Rate limit exceeded. Retry after ${retryAfter} seconds`);
      }
    },
  },
});

export const {
  signIn,
  signOut,
  signUp,
  useSession,
  resetPassword,
  forgetPassword,
} = authClient;
