import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth, isValidUUID } from '@/lib/auth'
import { errorResponse, successResponse, handleApiError } from '@/lib/api/helpers'
import type { VocabularyTerm } from '@/types/database'

// Omit the large embedding vector from API responses
type VocabularyTermResponse = Omit<VocabularyTerm, 'embedding'>

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth()
    const supabase = await createClient()
    const { id: showId } = await params

    if (!isValidUUID(showId)) {
      return errorResponse('Invalid ID format', 400)
    }

    // Verify show belongs to user
    const { data: show } = await supabase
      .from('shows')
      .select('id')
      .eq('id', showId)
      .eq('user_id', userId)
      .single()

    if (!show) {
      return errorResponse('Show not found', 404)
    }

    const { data: terms, error } = await supabase
      .from('vocabulary_terms')
      .select('id, show_id, term, alternatives, occurrence_count, created_at, updated_at')
      .eq('show_id', showId)
      .order('created_at', { ascending: false })

    if (error) {
      return errorResponse(error.message, 500)
    }

    return successResponse(terms || [])
  } catch (error) {
    return handleApiError(error, 'fetching vocabulary')
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth()
    const supabase = await createClient()
    const { id: showId } = await params
    const body = await request.json()

    if (!isValidUUID(showId)) {
      return errorResponse('Invalid ID format', 400)
    }

    const { term, alternatives = [] } = body

    if (!term) {
      return errorResponse('term is required', 400)
    }

    // Verify show belongs to user
    const { data: show } = await supabase
      .from('shows')
      .select('id')
      .eq('id', showId)
      .eq('user_id', userId)
      .single()

    if (!show) {
      return errorResponse('Show not found', 404)
    }

    const { data: newTerm, error } = await supabase
      .from('vocabulary_terms')
      .insert({
        show_id: showId,
        term,
        alternatives,
        occurrence_count: 0,
      })
      .select('id, show_id, term, alternatives, occurrence_count, created_at, updated_at')
      .single()

    if (error) {
      return errorResponse(error.message, 500)
    }

    return successResponse(newTerm, 201)
  } catch (error) {
    return handleApiError(error, 'creating vocabulary term')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth()
    const supabase = await createClient()
    const { id: showId } = await params
    const { searchParams } = new URL(request.url)
    const termId = searchParams.get('term_id')

    if (!isValidUUID(showId)) {
      return errorResponse('Invalid ID format', 400)
    }

    if (!termId) {
      return errorResponse('term_id is required', 400)
    }

    // Verify show belongs to user
    const { data: show } = await supabase
      .from('shows')
      .select('id')
      .eq('id', showId)
      .eq('user_id', userId)
      .single()

    if (!show) {
      return errorResponse('Show not found', 404)
    }

    const { error } = await supabase
      .from('vocabulary_terms')
      .delete()
      .eq('id', termId)
      .eq('show_id', showId)

    if (error) {
      return errorResponse(error.message, 500)
    }

    return successResponse({ deleted: true })
  } catch (error) {
    return handleApiError(error, 'deleting vocabulary term')
  }
}
