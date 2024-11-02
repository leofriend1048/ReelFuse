import { NextRequest, NextResponse } from 'next/server';
import ffmpeg from 'fluent-ffmpeg';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);

const supabaseUrl = 'https://uwfllbptpdqoovbeizya.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3ZmxsYnB0cGRxb292YmVpenlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTk3NTA2NzUsImV4cCI6MjAxNTMyNjY3NX0._fCp3gc4vEDj9k5jme3Jo_cSA3tPhzOPcodcH3Gb65w';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
  },
});

// Helper to convert "HH:MM:SS.mmm" or "MM:SS.mmm" into seconds
function timeToSeconds(time: string): number {
  const [timeComponent, milliseconds = '0'] = time.split('.');
  const parts = timeComponent.split(':');
  const ms = parseFloat(`0.${milliseconds}`);

  // Handle cases where the time is in MM:SS.mmm format
  if (parts.length === 2) {
    const minutes = parseFloat(parts[0]);
    const seconds = parseFloat(parts[1]);

    if (isNaN(minutes) || isNaN(seconds) || isNaN(ms)) {
      console.error(`Error converting time to seconds. Invalid parts: ${parts}, ms: ${ms}`);
      throw new Error(`Error converting time to seconds. Invalid parts: ${parts}, ms: ${ms}`);
    }

    return minutes * 60 + seconds + ms;
  }

  // Handle cases where the time is in HH:MM:SS.mmm format
  if (parts.length === 3) {
    const hours = parseFloat(parts[0]);
    const minutes = parseFloat(parts[1]);
    const seconds = parseFloat(parts[2]);

    if (isNaN(hours) || isNaN(minutes) || isNaN(seconds) || isNaN(ms)) {
      console.error(`Error converting time to seconds. Invalid parts: ${parts}, ms: ${ms}`);
      throw new Error(`Error converting time to seconds. Invalid parts: ${parts}, ms: ${ms}`);
    }

    return hours * 3600 + minutes * 60 + seconds + ms;
  }

  // If neither format matches, log an error
  console.error(`Invalid time format: ${time}`);
  throw new Error(`Invalid time format: ${time}`);
}

// Fetch the video from the CDN with retries
async function fetchWithRetry(url: string, retries: number = 3): Promise<Buffer> {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Attempting to fetch video from URL: ${url}`);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch video from CDN: ${response.statusText}`);
      console.log(`Fetched video successfully. Status: ${response.status}`);
      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      console.error(
        `Retry ${i + 1} for fetching video: ${error instanceof Error ? error.message : String(error)}`
      );
      if (i === retries -1) throw error;
    }
  }
  throw new Error('All retries failed for fetching video');
}

// Trim video based on timestamps using temporary files with millisecond precision
async function trimVideo(
  videoBuffer: Buffer,
  start: string,
  duration: number
): Promise<Buffer> {
  console.log(`Trimming video from ${start} with duration ${duration}`);

  const inputFilePath = path.join('/tmp', `input-${uuidv4()}.mp4`);
  const outputFilePath = path.join('/tmp', `output-${uuidv4()}.mp4`);

  await writeFile(inputFilePath, videoBuffer);

  const trimmedBuffer: Buffer = await new Promise((resolve, reject) => {
    ffmpeg(inputFilePath)
      .setStartTime(start)
      .setDuration(duration)
      .outputOptions(['-vsync 0']) // Add this to maintain frame accuracy
      .output(outputFilePath)
      .on('start', (commandLine) => {
        console.log(`Spawned FFMpeg with command: ${commandLine}`);
      })
      .on('error', (err) => {
        console.error(`FFMpeg error during trimming: ${err.message}`);
        reject(new Error(`FFMpeg error: ${err.message}`));
      })
      .on('end', async () => {
        console.log(`Successfully trimmed video from ${start} with duration ${duration}`);
        try {
          const data = fs.readFileSync(outputFilePath);
          resolve(data);
        } catch (err: any) {
          reject(new Error(`Failed to read trimmed video: ${err.message}`));
        } finally {
          await unlink(inputFilePath);
          await unlink(outputFilePath);
        }
      })
      .run();
  });

  return trimmedBuffer;
}

// Upload to Supabase with retries
async function uploadToSupabaseWithRetry(
  fileBuffer: Buffer,
  fileName: string,
  retries: number = 3
): Promise<string | null> {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Uploading video to Supabase with filename: ${fileName}`);
      const { data, error } = await supabase.storage
        .from('modular_clips')
        .upload(`trimmed/${fileName}`, fileBuffer, {
          contentType: 'video/mp4',
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        throw new Error(`Supabase upload error: ${error.message}`);
      }

      console.log(`Video uploaded successfully: ${fileName}`);
      const publicURL = `${supabaseUrl}/storage/v1/object/public/modular_clips/trimmed/${fileName}`;
      console.log(`Public URL for video: ${publicURL}`);
      return publicURL;
    } catch (error) {
      console.error(
        `Retry ${i + 1} for uploading video: ${error instanceof Error ? error.message : String(error)}`
      );
      if (i === retries -1) throw error;
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { videoUrl, timestamps } = await req.json();
    console.log(`Received video URL: ${videoUrl}`);
    console.log(`Timestamps provided: ${JSON.stringify(timestamps)}`);

    const videoBuffer = Buffer.from(await fetchWithRetry(videoUrl));

    // Correctly extract timestampsArray
    let timestampsArray = timestamps.timestamps;

    // Check if timestampsArray is defined
    if (!timestampsArray) {
      throw new Error('Invalid timestamps format. Expected a "timestamps" property.');
    }

    // If timestampsArray is not an array, wrap it in an array
    if (!Array.isArray(timestampsArray)) {
      timestampsArray = [timestampsArray];
    }

    console.log(`Processing ${timestampsArray.length} timestamp range(s)...`);

    type TimestampRange = {
      start: string;
      end: string;
    };

    const processingPromises = timestampsArray.map(async ({ start, end }: TimestampRange) => {
      
      try {
        console.log(`Processing timestamp range: ${start} - ${end}`);

        if (!start || !end) {
          throw new Error('Start or end time is missing in timestamp.');
        }

        const startSeconds = timeToSeconds(start);
        const endSeconds = timeToSeconds(end);
        const duration = endSeconds - startSeconds;

        console.log(`Duration calculated as: ${duration}`);
        if (duration <= 0) throw new Error(`Invalid duration: ${duration}`);

        const trimmedVideo = await trimVideo(videoBuffer, start, duration);
        const fileName = `${Date.now()}-${start.replace(/[:\.]/g, '-')}-${end.replace(/[:\.]/g, '-')}.mp4`;
        return await uploadToSupabaseWithRetry(trimmedVideo, fileName);
      } catch (error) {
        console.error(
          `Failed to process timestamp range ${start} - ${end}: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
        return null;
      }
    });

    const videoUrls = (await Promise.all(processingPromises)).filter(Boolean);

    if (videoUrls.length === 0) {
      console.log(`No videos successfully processed.`);
      return NextResponse.json({ success: false, error: 'No videos successfully processed.' });
    }

    return NextResponse.json({ success: true, videoUrls });
  } catch (error: any) {
    console.error('Error trimming videos:', error);
    return NextResponse.json({ success: false, error: error.message });
  }
}