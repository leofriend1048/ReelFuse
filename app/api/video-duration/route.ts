import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

async function getVideoMetadata(url: string) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    if (!response.ok) throw new Error('Failed to fetch video metadata');
    
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('video/')) {
      throw new Error('URL does not point to a video resource');
    }

    // Some servers provide Content-Duration header
    const contentDuration = response.headers.get('content-duration');
    if (contentDuration) {
      const seconds = parseFloat(contentDuration);
      return { durationInSeconds: seconds };
    }

    // For streaming services or when duration isn't available
    return { error: 'Video duration not available from metadata' };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to fetch video metadata' };
  }
}

export async function POST(req: NextRequest) {
  try {
    const { videoUrl } = await req.json();

    if (!videoUrl) {
      return NextResponse.json(
        { error: 'Video URL is required' },
        { status: 400 }
      );
    }

    const metadata = await getVideoMetadata(videoUrl);
    
    if ('error' in metadata) {
      return NextResponse.json(
        { error: metadata.error },
        { status: 400 }
      );
    }

    const minutes = Math.floor(metadata.durationInSeconds / 60);
    const seconds = Math.floor(metadata.durationInSeconds % 60);
    const duration = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    return NextResponse.json({ duration });
  } catch (error) {
    console.error('Error processing video duration:', error);
    return NextResponse.json(
      { error: 'Failed to process video duration' },
      { status: 500 }
    );
  }
}