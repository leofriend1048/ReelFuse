import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export const runtime = 'nodejs';

function isValidVideoUrl(input: string): boolean {
  try {
    const url = new URL(input);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function processVideoBuffer(buffer: Buffer) {
  const header = Buffer.from("mvhd");
  const start = buffer.indexOf(header) + 16;
  const timeScale = buffer.readUInt32BE(start);
  const duration = buffer.readUInt32BE(start + 4);

  const lengthSeconds = Math.floor(duration / timeScale);
  const lengthMS = Math.floor((duration / timeScale) * 1000);

  return {
    ms: lengthMS,
    seconds: lengthSeconds,
    timeScale: timeScale,
    duration: duration,
  };
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export async function GET(request: NextRequest) {
  try {
    const videoUrl = request.nextUrl.searchParams.get('videoUrl');

    if (!videoUrl) {
      return NextResponse.json(
        { error: 'videoUrl parameter is required' },
        { status: 400 }
      );
    }

    if (!isValidVideoUrl(videoUrl)) {
      return NextResponse.json(
        { error: 'Invalid video URL provided' },
        { status: 400 }
      );
    }

    // Download video from the URL
    const response = await axios.get(videoUrl, {
      responseType: 'arraybuffer',
      responseEncoding: 'binary',
    });

    // Check status
    if (response.status !== 200) {
      throw new Error(`Failed to download the video: HTTP ${response.status}`);
    }

    const contentType = response.headers['content-type'];
    if (!contentType?.startsWith('video/')) {
      return NextResponse.json(
        { error: 'The URL does not point to a video resource' },
        { status: 400 }
      );
    }

    // Process the video buffer
    const videoBuffer = Buffer.from(response.data);
    const durationInfo = processVideoBuffer(videoBuffer);
    
    return NextResponse.json({
      duration: formatDuration(durationInfo.seconds)
    });

  } catch (error) {
    console.error('Error getting video duration:', error);
    
    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        { error: `Failed to fetch video: ${error.message}` },
        { status: error.response?.status || 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process video duration' },
      { status: 500 }
    );
  }
}