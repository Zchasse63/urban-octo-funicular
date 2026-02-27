import * as Sentry from "@sentry/nextjs";

/**
 * Next.js Instrumentation Hook
 *
 * Runs once when the server starts. Used for:
 * - Sentry SDK initialization (server + edge runtimes)
 * - Environment variable validation
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }

  // Validate environment variables on server startup
  const { logEnvValidation } = await import("@/lib/env");
  logEnvValidation();
}

// Capture errors from Server Components, middleware, and proxies
export const onRequestError = Sentry.captureRequestError;
