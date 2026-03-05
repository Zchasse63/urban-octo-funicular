import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth, isValidUUID } from '@/lib/auth';
import { errorResponse, successResponse, handleApiError } from '@/lib/api/helpers';

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
      return errorResponse('Invalid webhook ID format', 400);
    }

    const supabase = await createClient();

    // Delete the webhook (RLS ensures user can only delete their own)
    const { error } = await supabase
      .from('webhooks')
      .delete()
      .eq('id', webhookId)
      .eq('user_id', userId);

    if (error) {
console.error('Error deleting webhook:', error);
return errorResponse('Internal server error', 500)
    }

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error, 'deleting webhook');
  }
}
