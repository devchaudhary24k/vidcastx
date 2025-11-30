import { PostHog } from "posthog-node";

import "server-only";

import { clientKeys } from "../env/client";

export const analytics = new PostHog(clientKeys().NEXT_PUBLIC_POSTHOG_KEY, {
  host: clientKeys().NEXT_PUBLIC_POSTHOG_HOST,

  // Don't batch events and flush immediately - we're running in a serverless environment
  flushAt: 1,
  flushInterval: 0,
});
