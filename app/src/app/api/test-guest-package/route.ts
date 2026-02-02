import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DEFAULT_USER_ID } from '@/lib/constants';

export async function GET() {
  try {
    const supabase = await createClient();

    // Create test show
    const { data: show, error: showError } = await supabase
      .from('shows')
      .insert({
        user_id: DEFAULT_USER_ID,
        name: `Guest Package Test Show ${Date.now()}`,
        description: 'Test show for guest package feature',
        default_language: 'en',
      })
      .select()
      .single();

    if (showError) throw showError;

    // Create completed episode with guest data
    const { data: episode, error: episodeError } = await supabase
      .from('episodes')
      .insert({
        show_id: show.id,
        title: 'Test Episode for Guest Package',
        audio_url: 'https://example.com/test.mp3',
        status: 'completed',
        guest_name: 'John Smith',
        guest_email: 'john@example.com',
        guest_bio: 'Tech entrepreneur and AI enthusiast',
        transcript: 'This is a test transcript about AI and podcasting. The guest shared amazing insights about the future of content creation. We discussed how AI tools are revolutionizing the podcasting industry.',
        show_notes: 'Test show notes about AI and podcasting innovations.',
        viral_moments: [{
          timestamp: '00:01:30',
          quote: 'AI will revolutionize content creation',
          context: 'Discussion about AI in content'
        }]
      })
      .select()
      .single();

    if (episodeError) throw episodeError;

    return NextResponse.json({
      success: true,
      message: 'Test episode created successfully',
      data: {
        episode_id: episode.id,
        show_id: show.id,
        guest_package_url: `/episodes/${episode.id}/guest-package`,
        api_url: `/api/episodes/${episode.id}/guest-package`
      }
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
