/**
 * Page Object Model: Episode Detail
 *
 * Wraps the tab bar and common assertions for the /episodes/[id] page.
 * Uses the new data-testids (episode-detail-tabs, episode-tab-*).
 */
import type { Locator, Page } from '@playwright/test'
import { expect } from '@playwright/test'

export type EpisodeTabId =
  | 'show-notes'
  | 'assets'
  | 'transcript'
  | 'guest'
  | 'intelligence'
  | 'rss-tags'

export class EpisodeDetailPage {
  constructor(private readonly page: Page) {}

  async goto(episodeId: string): Promise<void> {
    await this.page.goto(`/episodes/${episodeId}`)
    // Tab bar anchor confirms the detail page mounted (not a redirect or error)
    await expect(this.page.getByTestId('episode-detail-tabs')).toBeVisible({ timeout: 10_000 })
  }

  tabButton(id: EpisodeTabId): Locator {
    return this.page.getByTestId(`episode-tab-${id}`)
  }

  async clickTab(id: EpisodeTabId): Promise<void> {
    await this.tabButton(id).click()
  }

  async expectTitle(expected: string | RegExp): Promise<void> {
    const h1 = this.page.locator('h1').filter({ hasText: expected }).first()
    await expect(h1).toBeVisible()
  }

  /**
   * Regression guard: no Stoicism / Marcus Aurelius mock data should ever
   * surface on this page again. This is the single most important check
   * in the suite — it catches any future reintroduction of MOCK_* constants.
   */
  async expectNoStoicism(): Promise<void> {
    const bodyText = await this.page.locator('body').innerText()
    expect(bodyText).not.toMatch(/Stoic/i)
    expect(bodyText).not.toMatch(/Marcus Aurelius/i)
    expect(bodyText).not.toMatch(/Meditations/i)
  }

  // ── core-paid-flow extensions ─────────────────────────────────────────

  /**
   * The Download ZIP anchor on the Assets tab. Only rendered when at
   * least one generated_asset row exists for the episode. Tests that
   * need to exercise the 0-assets path should assert this locator is
   * NOT visible instead of clicking.
   */
  downloadZipLink(): Locator {
    return this.page.locator('a[href*="/api/episodes/"][href$="/assets/download"]')
  }

  generateAllRemainingButton(): Locator {
    return this.page.getByRole('button', { name: /Generate All Remaining/i })
  }

  regenerateShowNotesButton(): Locator {
    return this.page.getByRole('button', { name: 'Regenerate' })
  }

  /**
   * The first transcript segment's timestamp text. Tests use this to
   * guard against BUG #29 regression (treating milliseconds as seconds).
   */
  firstTranscriptTimestamp(): Locator {
    return this.page.locator('text=/^\\d{2}:\\d{2}$/').first()
  }

  /**
   * BUG #11 regression guard: show-notes markdown should never render
   * the literal "[0:53](0:53)" pattern in the DOM. If it does, the
   * markdown pipeline is broken again.
   */
  async assertNoBrokenTimestampLinks(): Promise<void> {
    const bodyText = await this.page.locator('body').innerText()
    expect(
      bodyText,
      'BUG #11 regression: literal [N:NN](N:NN) markdown is rendering unparsed'
    ).not.toMatch(/\[\d+:\d+\]\(\d+:\d+\)/)
  }
}
