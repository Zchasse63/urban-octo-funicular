import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth, isValidUUID } from '@/lib/auth';
import type { ApiResponse } from '@/types/database';

/**
 * DELETE /api/webhooks/[id]
 * Delete a webhook
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { id: webhookId } = await params;

    if (!isValidUUID(webhookId)) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Invalid webhook ID format' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Delete the webhook (RLS ensures user can only delete their own)
    const { error } = await supabase
      .from('webhooks')
      .delete()
      .eq('id', webhookId)
      .eq('user_id', userId);

    if (error) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<{ deleted: boolean }>>({
      data: { deleted: true },
      error: null,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Error deleting webhook:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
