import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE, // "development" or "production"
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: 1.0, // Capture 100% of transactions (adjust in production)
  tracePropagationTargets: [
    "localhost",
    /^https:\/\/your-backend\.fly\.dev\/api/, // Replace with your production backend URL
  ],
});
