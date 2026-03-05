import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth, isValidUUID } from '@/lib/auth';
import { errorResponse, successResponse, handleApiError } from '@/lib/api/helpers';
import { analyzeSEO, type SEOAnalysisResult } from '@/lib/seo/analyzer';
import {
  generatePodcastEpisodeSchema,
  type PodcastEpisodeSchema,
} from '@/lib/seo/schema-generator';
import type { Episode, SEOAnalysis } from '@/types/database';

interface SEOResponse {
  analysis: SEOAnalysisResult;
  schema: PodcastEpisodeSchema;
  episode: {
    id: string;
    title: string | null;
    description: string | null;
    seo_score: number | null;
  };
}

interface SEOFixRequest {
  fixId: string;
  title?: string;
  description?: string;
  showNotes?: string;
  showNotesHtml?: string;
}

/**
 * GET /api/episodes/[id]/seo
 * Get SEO analysis and schema for an episode
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { id: episodeId } = await params;

    if (!isValidUUID(episodeId)) {
      return errorResponse('Invalid ID format', 400);
    }

    const supabase = await createClient();

    // Fetch the episode with show data
    const { data: episode, error: fetchError } = await supabase
      .from('episodes')
      .select(`
        *,
        shows!inner(id, user_id, name, artwork_url)
      `)
      .eq('id', episodeId)
      .eq('shows.user_id', userId)
      .single();

    if (fetchError || !episode) {
      return errorResponse('Episode not found', 404);
    }

    // Run SEO analysis on show notes
    const showNotes = episode.show_notes || '';
    const showNotesHtml = episode.show_notes_html || showNotes;
    const analysis = analyzeSEO(showNotes, showNotesHtml);

    // Generate schema markup
    const showData = Array.isArray(episode.shows) ? episode.shows[0] : episode.shows;
    const schema = generatePodcastEpisodeSchema({
      episode: episode as Episode,
      showName: showData?.name || 'Unknown Show',
      showArtworkUrl: showData?.artwork_url || undefined,
    });

    const response: SEOResponse = {
      analysis,
      schema,
      episode: {
        id: episode.id,
        title: episode.title,
        description: episode.description,
        seo_score: analysis.overallScore,
      },
    };

    console.error('Error getting SEO analysis:', error);
return errorResponse('Internal server error', 500)
    );
  } catch (error) {
    return handleApiError(error, 'getting SEO analysis');
  }
}

/**
 * POST /api/episodes/[id]/seo
 * Apply an SEO fix to the episode
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { id: episodeId } = await params;

    if (!isValidUUID(episodeId)) {
      return errorResponse('Invalid ID format', 400);
    }

    const body: SEOFixRequest = await request.json();
    const supabase = await createClient();

    // Verify episode exists and user has access
    const { data: episode, error: fetchError } = await supabase
      .from('episodes')
      .select(`
        *,
        shows!inner(user_id)
      `)
      .eq('id', episodeId)
      .eq('shows.user_id', userId)
      .single();

    if (fetchError || !episode) {
      return errorResponse('Episode not found', 404);
    }

    // Build update object based on what was provided
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.title !== undefined) {
      updateData.title = body.title;
    }

    if (body.description !== undefined) {
      updateData.description = body.description;
    }

    if (body.showNotes !== undefined) {
      updateData.show_notes = body.showNotes;
    }

    if (body.showNotesHtml !== undefined) {
      updateData.show_notes_html = body.showNotesHtml;
    }

    // Apply the update
    const { error: updateError } = await supabase
      .from('episodes')
      .update(updateData)
      .eq('id', episodeId);

    if (updateError) {
console.error('Error applying SEO fix:', updateError);
return errorResponse('Internal server error', 500)
    }

    // Re-analyze SEO after fix
    const newShowNotes = (body.showNotes ?? episode.show_notes) || '';
    const newShowNotesHtml = (body.showNotesHtml ?? episode.show_notes_html) || newShowNotes;
    const newAnalysis = analyzeSEO(newShowNotes, newShowNotesHtml);

    // Update SEO score in database
    const seoAnalysis: SEOAnalysis = {
      keyword_density: newAnalysis.keywordDensityMap,
      readability_score: newAnalysis.factors.readability.score,
      header_structure: newAnalysis.factors.headerStructure.score >= 80,
      suggestions: newAnalysis.suggestions.map(s => s.title),
      estimated_position: null,
    };

    await supabase
      .from('episodes')
      .update({
        seo_score: newAnalysis.overallScore,
        seo_analysis: seoAnalysis,
      })
      .eq('id', episodeId);

    return successResponse({
      success: true,
      newScore: newAnalysis.overallScore,
      fixId: body.fixId,
    });
  } catch (error) {
    console.error('Error applying SEO fix:', error);
return errorResponse('Internal server error', 500)
  }
}

/**
 * PUT /api/episodes/[id]/seo
 * Regenerate SEO analysis and update score
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { id: episodeId } = await params;

    if (!isValidUUID(episodeId)) {
      return errorResponse('Invalid ID format', 400);
    }

    const supabase = await createClient();

    // Fetch the episode
    const { data: episode, error: fetchError } = await supabase
      .from('episodes')
      .select(`
        *,
        shows!inner(user_id, name, artwork_url)
      `)
      .eq('id', episodeId)
      .eq('shows.user_id', userId)
      .single();

    if (fetchError || !episode) {
      return errorResponse('Episode not found', 404);
    }

    // Run fresh SEO analysis
    const showNotes = episode.show_notes || '';
    const showNotesHtml = episode.show_notes_html || showNotes;
    const analysis = analyzeSEO(showNotes, showNotesHtml);

    // Build SEO analysis for database
    const seoAnalysis: SEOAnalysis = {
      keyword_density: analysis.keywordDensityMap,
      readability_score: analysis.factors.readability.score,
      header_structure: analysis.factors.headerStructure.score >= 80,
      suggestions: analysis.suggestions.map(s => s.title),
      estimated_position: null,
    };

    // Generate fresh schema
    const showData = Array.isArray(episode.shows) ? episode.shows[0] : episode.shows;
    const schema = generatePodcastEpisodeSchema({
      episode: episode as Episode,
      showName: showData?.name || 'Unknown Show',
      showArtworkUrl: showData?.artwork_url || undefined,
    });

    // Update episode with new SEO data
    const { error: updateError } = await supabase
      .from('episodes')
      .update({
        seo_score: analysis.overallScore,
        seo_analysis: seoAnalysis,
        schema_markup: schema,
        updated_at: new Date().toISOString(),
      })
      .eq('id', episodeId);

    if (updateError) {
console.error('Error updating SEO analysis:', updateError);
return errorResponse('Internal server error', 500)
    }

    return successResponse<SEOResponse>({
      analysis,
      schema,
      episode: {
        id: episode.id,
        title: episode.title,
        description: episode.description,
        seo_score: analysis.overallScore,
      },
    });
  } catch (error) {
    console.error('Error regenerating SEO analysis:', error);
return errorResponse('Internal server error', 500)
  }
}
