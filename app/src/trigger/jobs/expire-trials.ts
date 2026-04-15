/**
 * Expire Trials Scheduled Task
 *
 * Runs daily at 00:00 UTC. Performs two state transitions on the users table:
 *
 *   1. Trials that have run out  →  trial_expired
 *      Condition: subscription_status = 'trialing' AND trial_ends_at < now()
 *
 *   2. past_due grace period done →  canceled
 *      Condition: subscription_status = 'past_due' AND past_due_since < (now - 3 days)
 *
 * These are the scheduled half of the subscription state machine — the other
 * half is driven by Stripe webhooks in lib/stripe/webhooks.ts. Together they
 * implement the 5-state access model defined in lib/pricing.ts.
 *
 * Safety properties:
 *   - Idempotent: re-running the task matches zero rows after the first run
 *   - Service-role client: bypasses RLS to operate on all users
 *   - Errors are logged and thrown so Trigger.dev retries on failure
 */

import { schedules, logger } from "@trigger.dev/sdk";
import { getTriggerClient } from "@/lib/supabase/trigger-client";
import { GRACE_PERIOD_DAYS } from "@/lib/pricing";

export const expireTrialsTask = schedules.task({
  id: "expire-trials",
  cron: "0 0 * * *", // 00:00 UTC daily
  run: async () => {
    const supabase = getTriggerClient();
    const now = new Date();

    // 1. Expired trials → trial_expired
    const { error: trialError, count: trialCount } = await supabase
      .from("users")
      .update({ subscription_status: "trial_expired" }, { count: "exact" })
      .eq("subscription_status", "trialing")
      .lt("trial_ends_at", now.toISOString())
      .select("id");

    if (trialError) {
      logger.error("Failed to expire trials", { error: trialError.message });
      throw new Error(`Failed to expire trials: ${trialError.message}`);
    }

    logger.info("Trials expired", { count: trialCount ?? 0 });

    // 2. past_due grace period done → canceled
    const gracePeriodCutoff = new Date(now);
    gracePeriodCutoff.setDate(gracePeriodCutoff.getDate() - GRACE_PERIOD_DAYS);

    const { error: pastDueError, count: pastDueCount } = await supabase
      .from("users")
      .update({ subscription_status: "canceled" }, { count: "exact" })
      .eq("subscription_status", "past_due")
      .lt("past_due_since", gracePeriodCutoff.toISOString())
      .select("id");

    if (pastDueError) {
      logger.error("Failed to cancel past-due users", { error: pastDueError.message });
      throw new Error(`Failed to cancel past-due users: ${pastDueError.message}`);
    }

    logger.info("Past-due users canceled after grace period", {
      count: pastDueCount ?? 0,
      gracePeriodDays: GRACE_PERIOD_DAYS,
    });

    return {
      trialsExpired: trialCount ?? 0,
      pastDueCanceled: pastDueCount ?? 0,
      runAt: now.toISOString(),
    };
  },
});
