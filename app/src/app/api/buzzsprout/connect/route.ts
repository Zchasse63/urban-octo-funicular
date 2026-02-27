import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { BuzzsproutClient } from '@/lib/buzzsprout/client';
import { encryptCredentials } from '@/lib/buzzsprout/encryption';
import { requireAuth } from '@/lib/auth';
import { getUserTier, getTierLimits } from '@/lib/tier-limits';

export async function POST(request: NextRequest) {

  try {
    const { userId } = await requireAuth();

    // ── Tier gate: Buzzsprout integration requires Pro or Agency ──
    const tier = await getUserTier(userId);
    const limits = getTierLimits(tier);
    if (!limits.features.buzzsproutIntegration) {
      return NextResponse.json(
        { error: 'Buzzsprout integration requires a Pro or Agency plan. Upgrade to connect hosting platforms.' },
        { status: 403 }
      );
    }

    const { api_token, show_id } = await request.json();

    if (!api_token || typeof api_token !== 'string' || api_token.length > 200) {
      return NextResponse.json(
        { error: 'Invalid api_token' },
        { status: 400 }
      );
    }

    if (show_id !== undefined && show_id !== null && (typeof show_id !== 'string' || show_id.length > 100)) {
      return NextResponse.json(
        { error: 'Invalid show_id' },
        { status: 400 }
      );
    }

    const client = new BuzzsproutClient(api_token);

    try {
      await client.getPodcasts();
    } catch (error) {
      console.error('Buzzsprout API validation failed:', error);
      return NextResponse.json(
        { error: 'Invalid Buzzsprout API token' },
        { status: 401 }
      );
    }

    const encryptedCredentials = encryptCredentials({ api_token });

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('hosting_connections')
      .insert({
        user_id: userId,
        provider: 'buzzsprout',
        credentials: encryptedCredentials,
        show_id: show_id || null,
        status: 'active',
      })
      .select('id')
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to save connection' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Connect error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const { userId } = await requireAuth();
    const supabase = await createClient();

    const { error } = await supabase
      .from('hosting_connections')
      .delete()
      .eq('user_id', userId)
      .eq('provider', 'buzzsprout');

    if (error) {
      console.error('Delete error:', error);
      return NextResponse.json(
        { error: 'Failed to delete connection' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Disconnect error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
