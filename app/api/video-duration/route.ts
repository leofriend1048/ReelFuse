import { NextRequest, NextResponse } from 'next/server';
const { getVideoDurationInSeconds } = require('get-video-duration');

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { videoUrl } = await req.json();

    if (!videoUrl) {
      return NextResponse.json(
        { error: 'Video URL is required' },
        { status: 400 }
      );
    }

    const durationInSeconds = await getVideoDurationInSeconds(videoUrl);
    const minutes = Math.floor(durationInSeconds / 60);
    const seconds = Math.floor(durationInSeconds % 60);
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