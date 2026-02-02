import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const PLACEHOLDER_USER_ID = '00000000-0000-0000-0000-000000000001';

export async function GET() {
  try {
    const supabase = await createClient();

    // Create a test show
    const { data: show, error: showError } = await supabase
      .from('shows')
      .insert({
        user_id: PLACEHOLDER_USER_ID,
        name: `Test Show ${Date.now()}`,
        description: 'A test show created by the test-db endpoint',
        default_language: 'en',
      })
      .select()
      .single();

    if (showError) {
      return NextResponse.json(
        { success: false, error: 'Failed to create show', details: showError },
        { status: 500 }
      );
    }

    // List all shows
    const { data: shows, error: showsListError } = await supabase
      .from('shows')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (showsListError) {
      return NextResponse.json(
        { success: false, error: 'Failed to list shows', details: showsListError },
        { status: 500 }
      );
    }

    // Create a test episode
    const { data: episode, error: episodeError } = await supabase
      .from('episodes')
      .insert({
        show_id: show.id,
        title: `Test Episode ${Date.now()}`,
        audio_url: 'https://example.com/test-audio.mp3',
        status: 'pending',
      })
      .select()
      .single();

    if (episodeError) {
      return NextResponse.json(
        { success: false, error: 'Failed to create episode', details: episodeError },
        { status: 500 }
      );
    }

    // List episodes for the show
    const { data: episodes, error: episodesListError } = await supabase
      .from('episodes')
      .select('*')
      .eq('show_id', show.id)
      .order('created_at', { ascending: false });

    if (episodesListError) {
      return NextResponse.json(
        { success: false, error: 'Failed to list episodes', details: episodesListError },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      data: {
        createdShow: show,
        allShows: shows,
        createdEpisode: episode,
        showEpisodes: episodes,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Unexpected error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
