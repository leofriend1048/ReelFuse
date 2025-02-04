'use server'
import ffmpeg from 'fluent-ffmpeg';

export async function calculateVideoDuration(videoUrl: string): Promise<string> {
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