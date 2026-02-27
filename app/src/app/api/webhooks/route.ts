import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth, isValidUUID } from '@/lib/auth';
import type { ApiResponse } from '@/types/database';

// ─── Types ──────────────────────────────────────────────────────────────────

interface WebhookRecord {
  id: string;
  user_id: string;
  url: string;
  events: string[];
  secret: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface CreateWebhookBody {
  url: string;
  events: string[];
  secret?: string;
}

const VALID_EVENTS = ['episode.completed', 'episode.failed', 'asset.generated'];

// ─── GET /api/webhooks ─────────────────────────────────────────────────────

export async function GET() {
  try {
    const { userId } = await requireAuth();
    const supabase = await createClient();

    const { data: webhooks, error } = await supabase
      .from('webhooks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<{ webhooks: WebhookRecord[] }>>({
      data: { webhooks: webhooks || [] },
      error: null,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Error fetching webhooks:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ─── POST /api/webhooks ────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const body: CreateWebhookBody = await request.json();

    // Validate URL
    if (!body.url || typeof body.url !== 'string') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'URL is required' },
        { status: 400 }
      );
    }

    try {
      new URL(body.url);
    } catch {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Validate events
    if (!body.events || !Array.isArray(body.events) || body.events.length === 0) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'At least one event is required' },
        { status: 400 }
      );
    }

    const invalidEvents = body.events.filter((e) => !VALID_EVENTS.includes(e));
    if (invalidEvents.length > 0) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: `Invalid events: ${invalidEvents.join(', ')}. Valid events: ${VALID_EVENTS.join(', ')}` },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: webhook, error } = await supabase
      .from('webhooks')
      .insert({
        user_id: userId,
        url: body.url,
        events: body.events,
        secret: body.secret || null,
        active: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<WebhookRecord>>(
      { data: webhook, error: null },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Error creating webhook:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
