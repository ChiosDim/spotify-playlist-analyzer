import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: import.meta.env.MODE === "production" ? 0.2 : 1.0,
  tracePropagationTargets: ["localhost", /^https:\/\/.*\.fly\.dev\/api/],
  enabled: Boolean(import.meta.env.VITE_SENTRY_DSN),
});
