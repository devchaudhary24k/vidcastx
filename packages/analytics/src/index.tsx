import { type ReactNode } from "react";

import { clientKeys } from "./env/client";
import { GoogleAnalytics } from "./google";
import { PostHogProvider } from "./posthog/client";
import { VercelAnalytics } from "./vercel";

type AnalyticsProviderProps = {
  readonly children: ReactNode;
};

const { NEXT_PUBLIC_GA_MEASUREMENT_ID } = clientKeys();

export const AnalyticsProvider = ({ children }: AnalyticsProviderProps) => {
  return (
    <PostHogProvider>
      {children}
      <VercelAnalytics />
      {NEXT_PUBLIC_GA_MEASUREMENT_ID && (
        <GoogleAnalytics gaId={NEXT_PUBLIC_GA_MEASUREMENT_ID} />
      )}
    </PostHogProvider>
  );
};
