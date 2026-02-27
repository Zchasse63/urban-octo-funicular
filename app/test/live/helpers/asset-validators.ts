/**
 * Structural validators for all generated asset types.
 *
 * Each validator checks that the asset's parsed content has the expected
 * shape, field types, and platform-specific constraints.
 */

interface ValidationResult {
  passed: boolean;
  assetType: string;
  issues: string[];
}

type Validator = (content: string, metadata: unknown) => ValidationResult;

function ok(assetType: string): ValidationResult {
  return { passed: true, assetType, issues: [] };
}

function fail(assetType: string, issues: string[]): ValidationResult {
  return { passed: false, assetType, issues };
}

/**
 * Try to parse the content as JSON. Assets store their raw AI response
 * in metadata.raw_response, and the primary text in content.
 */
function tryParse(content: string): unknown | null {
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function checkStringField(obj: Record<string, unknown>, field: string): string | null {
  if (!obj[field] || typeof obj[field] !== 'string') return `Missing or invalid field: ${field}`;
  if ((obj[field] as string).trim().length === 0) return `Empty field: ${field}`;
  return null;
}

function checkArrayField(obj: Record<string, unknown>, field: string, minLen = 1): string | null {
  if (!Array.isArray(obj[field])) return `Missing or not an array: ${field}`;
  if (obj[field].length < minLen) return `Array ${field} too short (${obj[field].length} < ${minLen})`;
  return null;
}

// ─── Validators by asset type ────────────────────────────────────────

const validators: Record<string, Validator> = {
  show_notes: (content) => {
    const issues: string[] = [];
    if (content.length < 100) issues.push('Show notes too short (< 100 chars)');
    if (!content.includes('#') && !content.includes('**')) {
      issues.push('Show notes lack markdown formatting');
    }
    return issues.length ? fail('show_notes', issues) : ok('show_notes');
  },

  episode_titles: (content) => {
    const issues: string[] = [];
    const parsed = tryParse(content);
    if (parsed && Array.isArray(parsed)) {
      if (parsed.length < 3) issues.push(`Too few titles: ${parsed.length}`);
    } else if (typeof content === 'string') {
      // Might be stored as newline-separated titles
      const lines = content.split('\n').filter(l => l.trim().length > 0);
      if (lines.length < 3) issues.push(`Too few titles: ${lines.length}`);
    }
    return issues.length ? fail('episode_titles', issues) : ok('episode_titles');
  },

  key_takeaways: (content) => {
    const issues: string[] = [];
    if (content.length < 50) issues.push('Key takeaways too short');
    return issues.length ? fail('key_takeaways', issues) : ok('key_takeaways');
  },

  chapter_markers: (content) => {
    const issues: string[] = [];
    const parsed = tryParse(content);
    if (parsed && Array.isArray(parsed)) {
      if (parsed.length < 2) issues.push(`Too few chapters: ${parsed.length}`);
      for (const ch of parsed) {
        if (typeof ch === 'object' && ch !== null) {
          const c = ch as Record<string, unknown>;
          if (!c.title) issues.push('Chapter missing title');
          if (c.startTime === undefined && c.start_time === undefined) {
            issues.push('Chapter missing startTime');
          }
        }
      }
    } else if (content.length < 20) {
      issues.push('Chapter markers content too short');
    }
    return issues.length ? fail('chapter_markers', issues) : ok('chapter_markers');
  },

  blog_post: (content) => {
    const issues: string[] = [];
    if (content.length < 300) issues.push('Blog post too short (< 300 chars)');
    if (!content.includes('#') && !content.includes('**')) {
      issues.push('Blog post lacks markdown formatting');
    }
    return issues.length ? fail('blog_post', issues) : ok('blog_post');
  },

  newsletter_email: (content) => {
    const issues: string[] = [];
    if (content.length < 100) issues.push('Newsletter too short');
    return issues.length ? fail('newsletter_email', issues) : ok('newsletter_email');
  },

  press_release: (content) => {
    const issues: string[] = [];
    if (content.length < 200) issues.push('Press release too short');
    return issues.length ? fail('press_release', issues) : ok('press_release');
  },

  transcript_summary: (content) => {
    const issues: string[] = [];
    if (content.length < 50) issues.push('Summary too short');
    return issues.length ? fail('transcript_summary', issues) : ok('transcript_summary');
  },

  seo_description: (content) => {
    const issues: string[] = [];
    if (content.length < 50) issues.push('SEO description too short');
    // seo_description asset generates a full SEO package (title, keywords, meta desc, etc.)
    if (content.length > 3000) issues.push('SEO description too long (> 3000 chars)');
    return issues.length ? fail('seo_description', issues) : ok('seo_description');
  },

  linkedin_post: (content) => {
    const issues: string[] = [];
    if (content.length < 50) issues.push('LinkedIn post too short');
    if (content.length > 3000) issues.push('LinkedIn post too long (> 3000 chars)');
    return issues.length ? fail('linkedin_post', issues) : ok('linkedin_post');
  },

  linkedin_post_host: (content) => validators.linkedin_post(content, null),
  linkedin_post_guest: (content) => {
    const result = validators.linkedin_post(content, null);
    return { ...result, assetType: 'linkedin_post_guest' };
  },

  linkedin_article: (content) => {
    const issues: string[] = [];
    if (content.length < 500) issues.push('LinkedIn article too short (< 500 chars)');
    return issues.length ? fail('linkedin_article', issues) : ok('linkedin_article');
  },

  twitter_thread: (content) => {
    const issues: string[] = [];
    const parsed = tryParse(content);
    if (parsed && Array.isArray(parsed)) {
      if (parsed.length < 3) issues.push(`Thread too short: ${parsed.length} tweets`);
      for (let i = 0; i < parsed.length; i++) {
        const tweet = typeof parsed[i] === 'string' ? parsed[i] : (parsed[i] as Record<string, unknown>)?.text;
        if (typeof tweet === 'string' && tweet.length > 280) {
          issues.push(`Tweet ${i + 1} exceeds 280 chars (${tweet.length})`);
        }
      }
    } else if (content.length < 100) {
      issues.push('Twitter thread content too short');
    }
    return issues.length ? fail('twitter_thread', issues) : ok('twitter_thread');
  },

  twitter_single: (content) => {
    const issues: string[] = [];
    if (content.length < 10) issues.push('Tweet too short');
    // Individual tweets in a list — check first one
    const parsed = tryParse(content);
    if (parsed && Array.isArray(parsed)) {
      for (const t of parsed) {
        const text = typeof t === 'string' ? t : (t as Record<string, unknown>)?.text;
        if (typeof text === 'string' && text.length > 280) {
          issues.push(`Tweet exceeds 280 chars (${text.length})`);
        }
      }
    }
    return issues.length ? fail('twitter_single', issues) : ok('twitter_single');
  },

  instagram_carousel: (content) => {
    const issues: string[] = [];
    if (content.length < 100) issues.push('Instagram carousel too short');
    return issues.length ? fail('instagram_carousel', issues) : ok('instagram_carousel');
  },

  instagram_caption: (content) => {
    const issues: string[] = [];
    if (content.length < 30) issues.push('Instagram caption too short');
    if (content.length > 2200) issues.push('Instagram caption exceeds 2200 chars');
    return issues.length ? fail('instagram_caption', issues) : ok('instagram_caption');
  },

  instagram_reel_script: (content) => {
    const issues: string[] = [];
    if (content.length < 50) issues.push('Reel script too short');
    return issues.length ? fail('instagram_reel_script', issues) : ok('instagram_reel_script');
  },

  tiktok_hooks: (content) => {
    const issues: string[] = [];
    if (content.length < 20) issues.push('TikTok hooks too short');
    return issues.length ? fail('tiktok_hooks', issues) : ok('tiktok_hooks');
  },

  tiktok_script: (content) => {
    const issues: string[] = [];
    if (content.length < 50) issues.push('TikTok script too short');
    return issues.length ? fail('tiktok_script', issues) : ok('tiktok_script');
  },

  youtube_description: (content) => {
    const issues: string[] = [];
    if (content.length < 100) issues.push('YouTube description too short');
    return issues.length ? fail('youtube_description', issues) : ok('youtube_description');
  },

  youtube_shorts_script: (content) => {
    const issues: string[] = [];
    if (content.length < 30) issues.push('Shorts script too short');
    return issues.length ? fail('youtube_shorts_script', issues) : ok('youtube_shorts_script');
  },

  youtube_title_tags: (content) => {
    const issues: string[] = [];
    if (content.length < 20) issues.push('YouTube title/tags too short');
    return issues.length ? fail('youtube_title_tags', issues) : ok('youtube_title_tags');
  },

  quote_cards: (content) => {
    const issues: string[] = [];
    if (content.length < 20) issues.push('Quote cards too short');
    return issues.length ? fail('quote_cards', issues) : ok('quote_cards');
  },

  audiogram_clips: (content) => {
    const issues: string[] = [];
    if (content.length < 20) issues.push('Audiogram clips too short');
    return issues.length ? fail('audiogram_clips', issues) : ok('audiogram_clips');
  },

  infographic_outline: (content) => {
    const issues: string[] = [];
    if (content.length < 50) issues.push('Infographic outline too short');
    return issues.length ? fail('infographic_outline', issues) : ok('infographic_outline');
  },

  discussion_questions: (content) => {
    const issues: string[] = [];
    if (content.length < 30) issues.push('Discussion questions too short');
    return issues.length ? fail('discussion_questions', issues) : ok('discussion_questions');
  },

  poll_ideas: (content) => {
    const issues: string[] = [];
    if (content.length < 30) issues.push('Poll ideas too short');
    return issues.length ? fail('poll_ideas', issues) : ok('poll_ideas');
  },

  call_to_action: (content) => {
    const issues: string[] = [];
    if (content.length < 20) issues.push('CTA too short');
    return issues.length ? fail('call_to_action', issues) : ok('call_to_action');
  },

  guest_bio_short: (content) => {
    const issues: string[] = [];
    if (content.length < 30) issues.push('Guest bio too short');
    return issues.length ? fail('guest_bio_short', issues) : ok('guest_bio_short');
  },

  guest_promo_kit: (content) => {
    const issues: string[] = [];
    if (content.length < 100) issues.push('Guest promo kit too short');
    return issues.length ? fail('guest_promo_kit', issues) : ok('guest_promo_kit');
  },

  podcast_teaser: (content) => {
    const issues: string[] = [];
    if (content.length < 30) issues.push('Podcast teaser too short');
    return issues.length ? fail('podcast_teaser', issues) : ok('podcast_teaser');
  },

  cross_promo_script: (content) => {
    const issues: string[] = [];
    if (content.length < 50) issues.push('Cross promo script too short');
    return issues.length ? fail('cross_promo_script', issues) : ok('cross_promo_script');
  },

  medium_article: (content) => {
    const issues: string[] = [];
    if (content.length < 500) issues.push('Medium article too short (< 500 chars)');
    return issues.length ? fail('medium_article', issues) : ok('medium_article');
  },

  substack_post: (content) => {
    const issues: string[] = [];
    if (content.length < 500) issues.push('Substack post too short (< 500 chars)');
    return issues.length ? fail('substack_post', issues) : ok('substack_post');
  },

  ai_summary_short: (content) => {
    const issues: string[] = [];
    if (content.length < 30) issues.push('AI summary too short');
    return issues.length ? fail('ai_summary_short', issues) : ok('ai_summary_short');
  },

  ai_summary_detailed: (content) => {
    const issues: string[] = [];
    if (content.length < 100) issues.push('Detailed summary too short');
    return issues.length ? fail('ai_summary_detailed', issues) : ok('ai_summary_detailed');
  },

  highlight_reel: (content) => {
    const issues: string[] = [];
    if (content.length < 20) issues.push('Highlight reel too short');
    return issues.length ? fail('highlight_reel', issues) : ok('highlight_reel');
  },
};

/**
 * Validate a single asset. Returns validation result.
 */
export function validateAsset(
  assetType: string,
  content: string,
  metadata: unknown = null
): ValidationResult {
  const validator = validators[assetType];
  if (!validator) {
    return {
      passed: true,
      assetType,
      issues: [`No validator defined for ${assetType} — skipping structural check`],
    };
  }
  return validator(content, metadata);
}

/**
 * Validate all assets. Returns a summary.
 */
export function validateAllAssets(
  assets: Array<{ asset_type: string; content: string; metadata: unknown }>
): {
  results: ValidationResult[];
  passCount: number;
  failCount: number;
  failures: string[];
} {
  const results = assets.map(a => validateAsset(a.asset_type, a.content, a.metadata));
  const failures = results.filter(r => !r.passed);

  return {
    results,
    passCount: results.filter(r => r.passed).length,
    failCount: failures.length,
    failures: failures.map(f => `${f.assetType}: ${f.issues.join(', ')}`),
  };
}

/**
 * Check that the expected asset types were all generated.
 */
export function assertAssetCoverage(
  expectedTypes: string[],
  actualAssets: Array<{ asset_type: string }>
): { passed: boolean; missing: string[]; extra: string[] } {
  const actualTypes = new Set(actualAssets.map(a => a.asset_type));
  const missing = expectedTypes.filter(t => !actualTypes.has(t));
  const extra = [...actualTypes].filter(t => !expectedTypes.includes(t));

  return {
    passed: missing.length === 0,
    missing,
    extra,
  };
}
