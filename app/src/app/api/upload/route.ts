import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { errorResponse } from '@/lib/api/helpers';
import { checkRateLimit } from '@/lib/rate-limit';
import { SUPPORTED_AUDIO_FORMATS, PROCESSING } from '@/lib/constants';

const EPISODES_BUCKET = 'episodes';

interface SignedUploadRequest {
  fileName: string;
  fileSize: number;
  mimeType: string;
}

interface SignedUploadResponse {
  filePath: string;
  token: string;
  uploadUrl: string;
  publicUrl: string;
}

/**
 * POST /api/upload
 *
 * Returns a Supabase pre-signed upload URL so the browser can upload the file
 * directly to Storage. This avoids the Netlify Functions request-body size
 * limit (~6 MB) and execution timeout (10 s) that would otherwise break large
 * audio uploads.
 *
 * The client then uses `supabase.storage.from('episodes').uploadToSignedUrl(...)`
 * with the returned `filePath` and `token`. After upload completes, the client
 * calls `POST /api/episodes` with the `publicUrl` to create the episode record
 * and trigger processing.
 *
 * Request body (JSON):
 * {
 *   "fileName": "interview.mp3",
 *   "fileSize": 13421772,
 *   "mimeType": "audio/mpeg"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth();

    const rl = await checkRateLimit(`upload:${userId}`, 10);
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again shortly.' },
        { status: 429 }
      );
    }

    let body: SignedUploadRequest;
    try {
      body = (await request.json()) as SignedUploadRequest;
    } catch {
      return errorResponse('Invalid JSON body', 400);
    }

    const { fileName, fileSize, mimeType } = body;

    if (!fileName || typeof fileName !== 'string') {
      return errorResponse('fileName is required', 400);
    }
    if (typeof fileSize !== 'number' || fileSize <= 0) {
      return errorResponse('fileSize is required and must be > 0', 400);
    }
    if (!mimeType || typeof mimeType !== 'string') {
      return errorResponse('mimeType is required', 400);
    }

    // Validate file type
    if (!SUPPORTED_AUDIO_FORMATS.includes(mimeType as typeof SUPPORTED_AUDIO_FORMATS[number])) {
      return errorResponse(
        `Invalid file type. Allowed types: ${SUPPORTED_AUDIO_FORMATS.join(', ')}`,
        400
      );
    }

    // Validate file size
    if (fileSize > PROCESSING.maxFileSize) {
      return errorResponse(
        `File too large. Maximum size: ${PROCESSING.maxFileSize / 1024 / 1024}MB`,
        413
      );
    }

    // Generate unique storage path. Strip path separators from the filename
    // to avoid creating unintended subdirectories or escaping the namespace.
    const safeName = fileName.replace(/[/\\]+/g, '_');
    const extension = safeName.includes('.') ? safeName.split('.').pop() : 'mp3';
    const timestamp = Date.now();
    const uuid = crypto.randomUUID();
    const filePath = `${userId}/${uuid}-${timestamp}.${extension}`;

    const supabase = createAdminClient();

    // Generate the signed upload URL — this returns a token the client uses
    // with `uploadToSignedUrl(path, token, file)`.
    const { data: signed, error: signedError } = await supabase.storage
      .from(EPISODES_BUCKET)
      .createSignedUploadUrl(filePath);

    if (signedError || !signed) {
      console.error('createSignedUploadUrl error:', signedError);
      return errorResponse('Failed to create upload URL', 500);
    }

    // Compute the public URL the client will use after the upload completes.
    const { data: publicUrlData } = supabase.storage
      .from(EPISODES_BUCKET)
      .getPublicUrl(filePath);

    return NextResponse.json<SignedUploadResponse>({
      filePath,
      token: signed.token,
      uploadUrl: signed.signedUrl,
      publicUrl: publicUrlData.publicUrl,
    });
  } catch (error) {
    console.error('Upload signed-URL error:', error);
    return errorResponse('Internal server error', 500);
  }
}
