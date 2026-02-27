/**
 * Podcasting 2.0 Module
 *
 * Generates standard Podcasting 2.0 RSS tags from data PodBrain
 * already produces (transcripts, viral moments, chapters, metadata).
 */

export {
  generatePersonTags,
  generateSoundbiteTags,
  generateChaptersJson,
} from './tag-generators';

export type {
  PersonTag,
  TranscriptTag,
  SoundbiteTag,
  ChaptersTag,
  FundingTag,
  PodrollItem,
  MediumTag,
  TxtTag,
  LocationTag,
} from './tag-generators';

export { generateVTT } from './vtt-generator';
export type { TranscriptSegment as VTTTranscriptSegment } from './vtt-generator';

export { generateRSSSnippet } from './rss-snippet';
export type { RSSEnhancement } from './rss-snippet';

export { extractLocations, formatLocationTag } from './location-extractor';
export type { PodcastLocation } from './location-extractor';

export { generateValueTag, validateValueTag } from './value-tag';
export type { ValueTag, ValueRecipient } from './value-tag';
