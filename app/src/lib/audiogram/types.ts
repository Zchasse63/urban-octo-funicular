/**
 * Audiogram Generation Types
 *
 * Audiograms are short video clips with waveform visualization overlaid
 * on a background image, used to promote podcast episodes on social media.
 *
 * This module defines the configuration and result types for the audiogram
 * generation pipeline. See README.md for full implementation details.
 */

export interface AudiogramConfig {
  /** Episode ID to generate audiogram from */
  episodeId: string;
  /** Start time in seconds within the episode audio */
  startTime: number;
  /** Duration in seconds (15-60) */
  duration: number;
  /** Optional overlay quote text */
  text?: string;
  /** Background image URL (falls back to show artwork) */
  backgroundImageUrl?: string;
  /** Output video format */
  outputFormat: 'mp4' | 'webm';
  /** Video dimensions */
  dimensions: { width: number; height: number };
  /** Visual style preset */
  style: 'minimal' | 'waveform' | 'captions';
}

export interface AudiogramResult {
  /** Unique identifier for this audiogram */
  id: string;
  /** Public URL to the generated video file */
  url: string;
  /** Output format */
  format: string;
  /** Duration in seconds */
  duration: number;
  /** File size in bytes */
  fileSize: number;
  /** ISO 8601 timestamp of generation */
  generatedAt: string;
}

/**
 * Common social media dimension presets
 */
export const AUDIOGRAM_PRESETS = {
  /** Instagram Feed / Facebook - 1:1 square */
  square: { width: 1080, height: 1080 },
  /** Instagram Story / TikTok / Reels - 9:16 portrait */
  portrait: { width: 1080, height: 1920 },
  /** YouTube / Twitter - 16:9 landscape */
  landscape: { width: 1920, height: 1080 },
} as const;

/**
 * Validation constraints for audiogram configuration
 */
export const AUDIOGRAM_CONSTRAINTS = {
  /** Minimum clip duration in seconds */
  minDuration: 15,
  /** Maximum clip duration in seconds */
  maxDuration: 60,
  /** Maximum overlay text length */
  maxTextLength: 280,
  /** Supported output formats */
  supportedFormats: ['mp4', 'webm'] as const,
} as const;
