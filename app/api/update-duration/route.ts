// app/api/update-duration/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import ffmpeg from 'fluent-ffmpeg';

const supabaseUrl = 'https://uwfllbptpdqoovbeizya.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3ZmxsYnB0cGRxb292YmVpenlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTk3NTA2NzUsImV4cCI6MjAxNTMyNjY3NX0._fCp3gc4vEDj9k5jme3Jo_cSA3tPhzOPcodcH3Gb65w';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
  },
});

interface Video {
  video_url: string;
}

function getVideoDuration(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    ffmpeg(url).ffprobe(0, (err, data) => {
      if (err) {
        reject(err);
      } else {
        // Check if duration is defined
        const duration = data.format.duration;
        if (duration !== undefined) {
          const minutes = Math.floor(duration / 60).toString();
          const seconds = Math.floor(duration % 60).toString().padStart(2, '0');
          resolve(`${minutes}:${seconds}`);
        } else {
          reject(new Error('Duration is undefined'));
        }
      }
    });
  });
}

export async function POST() {
  // Fetch all videos from Supabase
  const { data: videos, error: fetchError } = await supabase
    .from('modular_clips')
    .select('video_url');

  if (fetchError) {
    console.error('Error fetching videos:', fetchError);
    return NextResponse.json({ message: 'Error fetching videos' }, { status: 500 });
  }

  console.log(`Fetched ${videos.length} videos to process.`);

  const updatePromises = videos.map(async (video) => {
    try {
      console.log(`Processing video: ${video.video_url}`);
      const duration = await getVideoDuration(video.video_url);

      const { error: updateError } = await supabase
        .from('modular_clips')
        .update({ duration })
        .match({ video_url: video.video_url });

      if (updateError) {
        console.error(`Error updating video duration for ${video.video_url}:`, updateError);
      } else {
        console.log(`Updated duration for video ${video.video_url} to ${duration}.`);
      }
    } catch (error) {
      console.error(`Error processing video ${video.video_url}:`, error);
    }
  });

  await Promise.all(updatePromises);

  return NextResponse.json({ message: 'Durations updated successfully' });
}
