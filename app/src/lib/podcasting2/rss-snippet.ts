/**
 * RSS Snippet Generator
 *
 * Compiles all Podcasting 2.0 tag structures into copyable XML snippets,
 * separated into channel-level and item-level tags.
 *
 * Namespace: xmlns:podcast="https://podcastindex.org/namespace/1.0"
 */

import type {
  PersonTag,
  TranscriptTag,
  SoundbiteTag,
  ChaptersTag,
  FundingTag,
  MediumTag,
  TxtTag,
  PodrollItem,
  LocationTag,
} from './tag-generators';

// ─── Output Interface ────────────────────────────────────────────────────────

export interface RSSEnhancement {
  /** Channel-level tags (apply to the whole podcast feed) */
  channelTags: string;
  /** Item-level tags (apply to a specific episode) */
  itemTags: string;
  /** Combined snippet with comments for display */
  fullSnippet: string;
}

// ─── Main Generator ──────────────────────────────────────────────────────────

export function generateRSSSnippet(params: {
  persons?: PersonTag[];
  transcript?: TranscriptTag;
  soundbites?: SoundbiteTag[];
  chapters?: ChaptersTag;
  funding?: FundingTag;
  podroll?: PodrollItem[];
  medium?: MediumTag;
  txt?: TxtTag[];
  locations?: LocationTag[];
}): RSSEnhancement {
  const itemLines: string[] = [];
  const channelLines: string[] = [];

  // Person tags (item-level)
  if (params.persons) {
    for (const p of params.persons) {
      const attrs = [`role="${p.role}"`];
      if (p.group) attrs.push(`group="${p.group}"`);
      if (p.img) attrs.push(`img="${escapeXml(p.img)}"`);
      if (p.href) attrs.push(`href="${escapeXml(p.href)}"`);
      itemLines.push(
        `<podcast:person ${attrs.join(' ')}>${escapeXml(p.name)}</podcast:person>`
      );
    }
  }

  // Transcript tag (item-level)
  if (params.transcript) {
    const attrs = [
      `url="${escapeXml(params.transcript.url)}"`,
      `type="${params.transcript.type}"`,
    ];
    if (params.transcript.language) {
      attrs.push(`language="${params.transcript.language}"`);
    }
    if (params.transcript.rel) {
      attrs.push(`rel="${params.transcript.rel}"`);
    }
    itemLines.push(`<podcast:transcript ${attrs.join(' ')} />`);
  }

  // Soundbite tags (item-level)
  if (params.soundbites) {
    for (const sb of params.soundbites) {
      const titleContent = sb.title ? escapeXml(sb.title) : '';
      itemLines.push(
        `<podcast:soundbite startTime="${sb.startTime}" duration="${sb.duration}">${titleContent}</podcast:soundbite>`
      );
    }
  }

  // Chapters tag (item-level)
  if (params.chapters) {
    itemLines.push(
      `<podcast:chapters url="${escapeXml(params.chapters.url)}" type="${params.chapters.type}" />`
    );
  }

  // Funding tag (channel-level)
  if (params.funding) {
    channelLines.push(
      `<podcast:funding url="${escapeXml(params.funding.url)}">${escapeXml(params.funding.message)}</podcast:funding>`
    );
  }

  // Medium tag (channel-level)
  if (params.medium) {
    channelLines.push(`<podcast:medium>${params.medium.value}</podcast:medium>`);
  }

  // Txt tags (channel-level)
  if (params.txt) {
    for (const t of params.txt) {
      const purposeAttr = t.purpose
        ? ` purpose="${escapeXml(t.purpose)}"`
        : '';
      channelLines.push(
        `<podcast:txt${purposeAttr}>${escapeXml(t.value)}</podcast:txt>`
      );
    }
  }

  // Podroll (channel-level)
  if (params.podroll && params.podroll.length > 0) {
    channelLines.push('<podcast:podroll>');
    for (const item of params.podroll) {
      const attrs: string[] = [];
      if (item.feedGuid)
        attrs.push(`feedGuid="${escapeXml(item.feedGuid)}"`);
      if (item.feedUrl)
        attrs.push(`feedUrl="${escapeXml(item.feedUrl)}"`);
      if (item.title) attrs.push(`title="${escapeXml(item.title)}"`);
      channelLines.push(
        `  <podcast:remoteItem ${attrs.join(' ')} />`
      );
    }
    channelLines.push('</podcast:podroll>');
  }

  // Location tags (item-level)
  if (params.locations) {
    for (const loc of params.locations) {
      const attrs: string[] = [];
      if (loc.geo) attrs.push(`geo="${escapeXml(loc.geo)}"`);
      if (loc.osm) attrs.push(`osm="${escapeXml(loc.osm)}"`);
      const attrStr = attrs.length > 0 ? ' ' + attrs.join(' ') : '';
      itemLines.push(
        `<podcast:location${attrStr}>${escapeXml(loc.name)}</podcast:location>`
      );
    }
  }

  const channelTags = channelLines.join('\n');
  const itemTags = itemLines.join('\n');

  const parts: string[] = [
    '<!-- Podcasting 2.0 Namespace: xmlns:podcast="https://podcastindex.org/namespace/1.0" -->',
  ];

  if (channelTags) {
    parts.push('');
    parts.push(`<!-- Channel-level tags (add inside <channel>) -->`);
    parts.push(channelTags);
  }

  if (itemTags) {
    parts.push('');
    parts.push(`<!-- Item-level tags (add inside <item>) -->`);
    parts.push(itemTags);
  }

  return {
    channelTags,
    itemTags,
    fullSnippet: parts.join('\n'),
  };
}

// ─── XML Escape Utility ──────────────────────────────────────────────────────

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
