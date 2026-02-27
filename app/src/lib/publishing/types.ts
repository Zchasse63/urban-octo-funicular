/**
 * Publishing Platform Integration Types
 *
 * Defines types for OAuth connections to YouTube, Spotify, and Apple Podcasts.
 * These are scaffold types for future cross-platform publishing integration.
 *
 * TODO: Implement OAuth flows:
 * - YouTube: Requires Google Cloud Console project with YouTube Data API v3
 * - Spotify: Requires Spotify Developer Console app with podcast management scope
 * - Apple: Requires Apple Developer account with Podcasts Connect API access
 */

export type PublishingPlatform = 'youtube' | 'spotify' | 'apple';

export interface PublishingConnection {
  /** Platform identifier */
  platform: PublishingPlatform;
  /** Whether the platform is currently connected */
  connected: boolean;
  /** OAuth access token (encrypted in storage) */
  accessToken?: string;
  /** OAuth refresh token (encrypted in storage) */
  refreshToken?: string;
  /** ISO 8601 expiration timestamp for the access token */
  expiresAt?: string;
  /** Display name of the connected account */
  accountName?: string;
}

export interface PublishingResult {
  /** Platform the content was published to */
  platform: PublishingPlatform;
  /** Whether the publish operation succeeded */
  success: boolean;
  /** URL of the published content (if successful) */
  url?: string;
  /** Error message (if failed) */
  error?: string;
}

/**
 * Platform-specific configuration requirements
 */
export interface PlatformConfig {
  platform: PublishingPlatform;
  displayName: string;
  oauthUrl: string;
  scopes: string[];
  setupInstructions: string;
}

/**
 * Platform configuration registry (for reference)
 */
export const PLATFORM_CONFIGS: Record<PublishingPlatform, PlatformConfig> = {
  youtube: {
    platform: 'youtube',
    displayName: 'YouTube',
    oauthUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    scopes: ['https://www.googleapis.com/auth/youtube.upload'],
    setupInstructions:
      'Requires a Google Cloud Console project with YouTube Data API v3 enabled. ' +
      'Create OAuth 2.0 credentials and configure the redirect URI.',
  },
  spotify: {
    platform: 'spotify',
    displayName: 'Spotify',
    oauthUrl: 'https://accounts.spotify.com/authorize',
    scopes: ['user-read-private'],
    setupInstructions:
      'Requires a Spotify Developer Console application. ' +
      'Note: Spotify podcast management API access may require special approval.',
  },
  apple: {
    platform: 'apple',
    displayName: 'Apple Podcasts',
    oauthUrl: 'https://appleid.apple.com/auth/authorize',
    scopes: [],
    setupInstructions:
      'Requires an Apple Developer account with access to the Podcasts Connect API. ' +
      'API keys must be generated in App Store Connect.',
  },
};
