import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth, isValidUUID } from '@/lib/auth'
import type { VocabularyTerm, ApiResponse } from '@/types/database'

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
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Invalid ID format' },
        { status: 400 }
      )
    }

    // Verify show belongs to user
    const { data: show } = await supabase
      .from('shows')
      .select('id')
      .eq('id', showId)
      .eq('user_id', userId)
      .single()

    if (!show) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Show not found' },
        { status: 404 }
      )
    }

    const { data: terms, error } = await supabase
      .from('vocabulary_terms')
      .select('id, show_id, term, alternatives, occurrence_count, created_at, updated_at')
      .eq('show_id', showId)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json<ApiResponse<VocabularyTermResponse[]>>(
      { data: terms || [], error: null }
    )
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      )
    }
    console.error('Error fetching vocabulary:', error)
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
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
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Invalid ID format' },
        { status: 400 }
      )
    }

    const { term, alternatives = [] } = body

    if (!term) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'term is required' },
        { status: 400 }
      )
    }

    // Verify show belongs to user
    const { data: show } = await supabase
      .from('shows')
      .select('id')
      .eq('id', showId)
      .eq('user_id', userId)
      .single()

    if (!show) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Show not found' },
        { status: 404 }
      )
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
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json<ApiResponse<VocabularyTermResponse>>(
      { data: newTerm, error: null },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      )
    }
    console.error('Error creating vocabulary term:', error)
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
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
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Invalid ID format' },
        { status: 400 }
      )
    }

    if (!termId) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'term_id is required' },
        { status: 400 }
      )
    }

    // Verify show belongs to user
    const { data: show } = await supabase
      .from('shows')
      .select('id')
      .eq('id', showId)
      .eq('user_id', userId)
      .single()

    if (!show) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Show not found' },
        { status: 404 }
      )
    }

    const { error } = await supabase
      .from('vocabulary_terms')
      .delete()
      .eq('id', termId)
      .eq('show_id', showId)

    if (error) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json<ApiResponse<{ deleted: true }>>(
      { data: { deleted: true }, error: null }
    )
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      )
    }
    console.error('Error deleting vocabulary term:', error)
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
