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
}
