-- ─── Add 'scheduled' to episode_status enum ───────────────────────────────────
--
-- The scheduling feature (api/episodes/[id]/schedule/route.ts) writes
-- status='scheduled' when a user schedules an episode for future publication.
-- The original episode_status enum (migration 0001) only allows
-- pending|processing|completed|failed, so any call to the schedule endpoint
-- fails with a Postgres enum violation at runtime.
--
-- Postgres only allows ALTER TYPE ADD VALUE outside a transaction block,
-- so this migration uses the IF NOT EXISTS form to remain idempotent.

ALTER TYPE episode_status ADD VALUE IF NOT EXISTS 'scheduled';
