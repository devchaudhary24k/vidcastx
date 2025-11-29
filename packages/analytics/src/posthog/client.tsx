"use client";

import type { PostHog } from "posthog-js";
import type { ReactNode } from "react";
import { useEffect } from "react";
import posthog from "posthog-js";
import { PostHogProvider as PostHogProviderRaw } from "posthog-js/react";

import { clientKeys } from "../env/client";

type PostHogProviderProps = {
  readonly children: ReactNode;
};

export const PostHogProvider = (
  properties: Omit<PostHogProviderProps, "client">,
) => {
  useEffect(() => {
    posthog.init(clientKeys().NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: "/ingest",
      ui_host: clientKeys().NEXT_PUBLIC_POSTHOG_HOST,
      person_profiles: "identified_only",
      capture_pageview: false, // Disable automatic pageview capture, as we capture manually
      capture_pageleave: true, // Overrides the `capture_pageview` setting
    }) as PostHog;
  }, []);

  return <PostHogProviderRaw client={posthog} {...properties} />;
};

export { usePostHog as useAnalytics } from "posthog-js/react";
