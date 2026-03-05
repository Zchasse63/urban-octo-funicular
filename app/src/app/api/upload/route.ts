import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
return errorResponse('Internal server error', 500)
import { SUPPORTED_AUDIO_FORMATS, PROCESSING } from '@/lib/constants';

const EPISODES_BUCKET = 'episodes';

export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!SUPPORTED_AUDIO_FORMATS.includes(file.type as typeof SUPPORTED_AUDIO_FORMATS[number])) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed types: ${SUPPORTED_AUDIO_FORMATS.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > PROCESSING.maxFileSize) {
      return NextResponse.json(
        { error: `File too large. Maximum size: ${PROCESSING.maxFileSize / 1024 / 1024}MB` },
        { status: 413 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const uuid = crypto.randomUUID();
    const extension = file.name.split('.').pop() || 'mp3';
    const filePath = `${uuid}-${timestamp}.${extension}`;

    // Upload to Supabase Storage using admin client
    const supabase = createAdminClient();
    const fileBuffer = await file.arrayBuffer();

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(EPISODES_BUCKET)
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600',
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      );
    }

    // Generate signed URL (valid 24 hours)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(EPISODES_BUCKET)
      .createSignedUrl(filePath, 86400);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error('Signed URL error:', signedUrlError);
      return NextResponse.json(
        { error: 'Failed to generate signed URL' },
        { status: 500 }
      );
    }

    // Get public URL for storage
    const { data: publicUrlData } = supabase.storage
      .from(EPISODES_BUCKET)
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      filePath,
      signedUrl: signedUrlData.signedUrl,
      publicUrl: publicUrlData.publicUrl,
      fileSize: file.size,
      mimeType: file.type,
    });
  } catch (error) {
    console.error('Upload error:', error);
return errorResponse('Internal server error', 500)
  }
}
