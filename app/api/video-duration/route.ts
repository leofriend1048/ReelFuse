import { NextRequest, NextResponse } from 'next/server';
import ffmpeg from 'fluent-ffmpeg';

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

    const duration = await calculateVideoDuration(videoUrl);
    
    return NextResponse.json({ duration });
  } catch (error) {
    console.error('Error processing video duration:', error);
    return NextResponse.json(
      { error: 'Failed to process video duration' },
      { status: 500 }
    );
  }
}

async function calculateVideoDuration(videoUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoUrl, (err, metadata) => {
      if (err) {
        console.error('Error retrieving video duration:', err);
        return reject(err);
      }

      const durationInSeconds = metadata.format.duration;
      if (durationInSeconds === undefined) {
        return reject(new Error('Duration is undefined'));
      }
      
      const minutes = Math.floor(durationInSeconds / 60);
      const seconds = Math.floor(durationInSeconds % 60);
      const formattedDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      
      console.log(`Calculated video duration: ${formattedDuration}`);
      resolve(formattedDuration);
    });
  });
}