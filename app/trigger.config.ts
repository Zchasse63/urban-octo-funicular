import { defineConfig } from "@trigger.dev/sdk";

export default defineConfig({
  // Project reference from the Trigger.dev dashboard
  project: "podbrain",

  // Directory containing the job files
  dirs: ["./src/trigger/jobs"],

  // Maximum duration for jobs (in seconds)
  // 4-hour audio files need longer processing time
  maxDuration: 1800, // 30 minutes max

  // Retry configuration
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 60000,
      factor: 2,
    },
  },
});
