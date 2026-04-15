/**
 * Trigger.dev-safe Taddy guest enrichment.
 *
 * The normal Taddy cache layer (`@/lib/taddy/cache.ts`) uses the Next.js
 * SSR cookie-bound Supabase client (`createClient()` from
 * `@/lib/supabase/server`). That client reads and writes request cookies,
 * so calling it from a Trigger.dev task crashes with:
 *
 *   Error: cookies() was called outside a request scope.
 *
 * This helper bypasses the cache layer entirely. It calls the Taddy
 * GraphQL client directly (singleton, env-based, no SSR) and writes
 * results to `guest_appearances` via the Trigger-safe admin client. The
 * end-user-visible effect is the same: once an episode finishes
 * processing, the guest's other appearances show up in the UI.
 *
 * Design:
 *   - Fire-and-forget: never throws to the caller. Every path is wrapped.
 *   - No-op if Taddy credentials are missing. Safe in local dev.
 *   - Uses the normalized-name upsert pattern from the existing cache
 *     layer so rows dedupe with whatever the search path already wrote.
 *   - Queries Taddy with `searchEpisodes(guestName)` (same approach the
 *     pre-interview and experts flows use) — this is the only call we
 *     can make without already knowing a guest UUID.
 */

import { logger } from "@trigger.dev/sdk";
import { getTriggerClient } from "@/lib/supabase/trigger-client";
import { getTaddyClient, isTaddyAvailable } from "@/lib/taddy/client";
import type { TaddyEpisode } from "@/lib/taddy/types";

const MAX_APPEARANCES_PER_GUEST = 50;
const BATCH_SIZE = 50;

interface EnrichGuestParams {
  guestName: string;
  userId: string;
  episodeId: string;
}

/**
 * Normalize a guest name for deduplication. Keep this in lock-step with
 * `normalizeName` in `@/lib/taddy/cache.ts` — the two implementations
 * must produce identical output or rows won't dedupe across code paths.
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^(dr\.?|mr\.?|mrs\.?|ms\.?|prof\.?)\s+/i, "")
    .replace(/\s+(jr\.?|sr\.?|ii|iii|iv|phd|md|esq\.?)$/i, "");
}

/**
 * Filter Taddy episodes down to the ones that actually list this guest
 * in the `persons` array. The search API returns episodes that mention
 * the name in text, which is noisy; we want explicit credits only.
 */
function matchingEpisodes(episodes: TaddyEpisode[], guestName: string): TaddyEpisode[] {
  const target = normalizeName(guestName);
  return episodes.filter((episode) => {
    if (!episode.persons || episode.persons.length === 0) return false;
    return episode.persons.some(
      (person) => person.name && normalizeName(person.name) === target
    );
  });
}

/**
 * Best-effort Taddy guest enrichment for a newly-processed episode.
 * Callers should NOT await this — kick it off and move on.
 */
export async function enrichGuestFromTaddy(params: EnrichGuestParams): Promise<void> {
  const { guestName, userId, episodeId } = params;

  if (!guestName || !userId) {
    return;
  }

  if (!isTaddyAvailable()) {
    logger.info("Taddy credentials not configured — skipping guest enrichment", {
      episodeId,
      guestName,
    });
    return;
  }

  try {
    const client = getTaddyClient();

    logger.info("Starting Taddy guest enrichment", { episodeId, guestName });

    const response = await client.searchEpisodes(guestName, {
      limitPerPage: 25,
      page: 1,
    });
    const rawEpisodes = response.search.podcastEpisodes || [];
    const confirmed = matchingEpisodes(rawEpisodes, guestName);

    logger.info("Taddy search returned appearances", {
      episodeId,
      guestName,
      rawCount: rawEpisodes.length,
      confirmedCount: confirmed.length,
    });

    if (confirmed.length === 0) {
      return;
    }

    const normalized = normalizeName(guestName);
    const appearances = confirmed
      .slice(0, MAX_APPEARANCES_PER_GUEST)
      .flatMap((episode) => {
        const persons = (episode.persons || []).filter(
          (p) => p.name && normalizeName(p.name) === normalized
        );

        return persons.map((person) => ({
          user_id: userId,
          guest_name: person.name,
          guest_name_normalized: normalized,
          guest_image_url: person.img || null,
          guest_profile_url: person.href || null,
          role: person.role?.toLowerCase() || "guest",
          episode_taddy_uuid: episode.uuid,
          podcast_taddy_uuid: episode.podcastSeries?.uuid || null,
          podcast_name: episode.podcastSeries?.name || null,
          episode_name: episode.name,
          date_published: episode.datePublished
            ? new Date(episode.datePublished * 1000).toISOString()
            : null,
          duration_seconds: episode.duration || null,
          audio_url: episode.audioUrl || null,
          source: "taddy_trigger_enrichment",
        }));
      });

    if (appearances.length === 0) {
      return;
    }

    // Use the Trigger-safe Supabase client (no cookies() calls).
    const supabase = getTriggerClient();

    for (let i = 0; i < appearances.length; i += BATCH_SIZE) {
      const batch = appearances.slice(i, i + BATCH_SIZE);
      const { error } = await supabase
        .from("guest_appearances")
        .upsert(batch, {
          onConflict: "guest_name_normalized,episode_taddy_uuid",
          ignoreDuplicates: true,
        });

      if (error) {
        logger.warn("Failed to upsert guest_appearances batch (continuing)", {
          episodeId,
          batchStart: i,
          batchSize: batch.length,
          error: error.message,
        });
      }
    }

    logger.info("Taddy guest enrichment complete", {
      episodeId,
      guestName,
      appearancesWritten: appearances.length,
    });
  } catch (err) {
    logger.warn("Taddy guest enrichment failed", {
      episodeId,
      guestName,
      error: err instanceof Error ? err.message : "Unknown",
    });
  }
}
