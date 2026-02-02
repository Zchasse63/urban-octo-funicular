import { NextRequest, NextResponse } from 'next/server';
import { getBuzzsproutClient } from '@/lib/buzzsprout/helpers';
import { DEFAULT_USER_ID } from '@/lib/constants';
import DOMPurify from 'isomorphic-dompurify';

function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre'
    ],
    ALLOWED_ATTR: ['href', 'title', 'target'],
    ALLOW_DATA_ATTR: false,
  });
}

export async function POST(request: NextRequest) {
  try {
    const { episode_id, buzzsprout_episode_id, notes } = await request.json();

    // episode_id is the internal PodBrain episode ID (optional for validation)
    // buzzsprout_episode_id is the Buzzsprout episode ID (required)
    // notes is the show notes content (required)

    if (!buzzsprout_episode_id || typeof buzzsprout_episode_id !== 'string' || buzzsprout_episode_id.length > 100) {
      return NextResponse.json(
        { error: 'Invalid buzzsprout_episode_id' },
        { status: 400 }
      );
    }

    if (!notes || typeof notes !== 'string' || notes.length > 100000) {
      return NextResponse.json(
        { error: 'Invalid or missing notes' },
        { status: 400 }
      );
    }

    const sanitizedNotes = sanitizeHtml(notes);

    const client = await getBuzzsproutClient(DEFAULT_USER_ID);

    // Get all user's podcasts to find the one containing this episode
    const userPodcasts = await client.getPodcasts();

    // Search across all podcasts to find which one contains the episode
    let targetPodcastId: string | null = null;
    for (const podcast of userPodcasts) {
      const episodes = await client.getEpisodes(podcast.id.toString());
      const hasEpisode = episodes.some(e => e.id.toString() === buzzsprout_episode_id);
      if (hasEpisode) {
        targetPodcastId = podcast.id.toString();
        break;
      }
    }

    if (!targetPodcastId) {
      return NextResponse.json(
        { error: 'Episode not found in any of your podcasts' },
        { status: 403 }
      );
    }

    const updatedEpisode = await client.updateEpisode(targetPodcastId, buzzsprout_episode_id, {
      description: sanitizedNotes,
    });

    return NextResponse.json({
      success: true,
      episode: updatedEpisode,
    });
  } catch (error) {
    console.error('Push notes error:', error);

    if (error instanceof Error && error.message === 'No Buzzsprout connection found') {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to push show notes' },
      { status: 500 }
    );
  }
}
