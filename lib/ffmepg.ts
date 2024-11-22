"use server"
import ffmpeg from 'fluent-ffmpeg';
import { createClient } from '@/utils/supabase/server';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { transcribeAudioFromUrlSRT } from '@/lib/deepgram';

export async function trimOriginalVideoHook(originalFileUrl: string, hooktimestamp: string): Promise<string> {
  const supabase = createClient();
  console.log('Supabase client created.');

  try {
    console.log(`Fetching video from URL: ${originalFileUrl}`);
    const response = await fetch(originalFileUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch video: ${response.statusText}`);
    }
    console.log('Video fetched successfully.');

    console.log('Converting response to Blob.');
    const videoBlob = await response.blob();
    console.log('Video converted to Blob.');

    console.log('Generating random 12-digit code.');
    const randomCode = Math.floor(100000000000 + Math.random() * 900000000000).toString();
    console.log(`Generated random code: ${randomCode}`);

    const fileExtension = 'mp4';
    const fileName = `trimmed_${randomCode}.${fileExtension}`;
    console.log(`File name defined: ${fileName}`);

    const inputFilePath = `/tmp/${randomCode}.${fileExtension}`;
    const outputFilePath = `/tmp/${fileName}`;
    console.log(`Temporary file paths created: input - ${inputFilePath}, output - ${outputFilePath}`);          

    console.log('Saving Blob to temporary file.');
    const arrayBuffer = await videoBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fs = require('fs');
    fs.writeFileSync(inputFilePath, buffer);
    console.log('Blob saved to temporary file.');

    console.log('Converting timestamp to seconds.');
    const seconds = parseFloat(hooktimestamp); 
    if (isNaN(seconds)) {
      throw new Error(`Invalid hooktimestamp: "${hooktimestamp}" cannot be converted to a float.`);
    }
    console.log(`Timestamp converted to seconds: ${seconds}`);

    console.log('Trimming video using ffmpeg.');
    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputFilePath)
        .setStartTime(seconds)
        .output(outputFilePath)
        .on('end', () => {
          console.log('Video trimming completed.');
          resolve();
        })
        .on('error', (error) => {
          console.error('Error trimming video:', error);
          reject(error);
        })
        .run();
    });

    console.log('Reading trimmed video file.');
    const trimmedVideoBuffer = fs.readFileSync(outputFilePath);
    console.log('Trimmed video file read successfully.');

    console.log('Uploading trimmed video to Supabase storage.');
    const supabaseResult = await supabase.storage
      .from('rendered_videos')
      .upload(fileName, trimmedVideoBuffer, {
        contentType: 'video/mp4',
        cacheControl: '604800', // Cache for 7 days
      });
    console.log('Trimmed video uploaded to Supabase storage.');

    if (supabaseResult.error) {
      throw new Error(supabaseResult.error.message);
    }
    console.log('Supabase upload result checked.');

    const trimmedHookVisual1FileUrl = `https://uwfllbptpdqoovbeizya.supabase.co/storage/v1/object/public/rendered_videos/${fileName}`;
    console.log('Constructed URL for trimmed video:', trimmedHookVisual1FileUrl);

    console.log('Cleaning up temporary files.');
    fs.unlinkSync(inputFilePath);
    fs.unlinkSync(outputFilePath);
    console.log('Temporary files cleaned up.');

    return trimmedHookVisual1FileUrl;
  } catch (error) {
    console.error('Error processing video:', error);
    throw error;
  }
}

export async function concatenateVideos(video_url: string, processedVideoUrl: string): Promise<string> {
  const supabase = createClient();
  console.log('Supabase client created.');

  try {
    const tmpDir = '/tmp';
    const input1FilePath = path.join(tmpDir, `${uuidv4()}.mp4`);
    const input2FilePath = path.join(tmpDir, `${uuidv4()}.mp4`);
    const reencoded1FilePath = path.join(tmpDir, `${uuidv4()}_reencoded1.mp4`);
    const reencoded2FilePath = path.join(tmpDir, `${uuidv4()}_reencoded2.mp4`);
    const trimmedSilentAudioFilePath = path.join(tmpDir, `${uuidv4()}_silent.aac`);
    const listFilePath = path.join(tmpDir, `${uuidv4()}.txt`);
    const outputFilePath = path.join(tmpDir, `${uuidv4()}_output.mp4`);

    const preGeneratedSilentAudioFilePath = path.join(process.cwd(), 'public/silence.aac');

    console.log('Fetching video 1:', video_url);
    const response1 = await fetch(video_url);
    const buffer1 = Buffer.from(await response1.arrayBuffer());
    fs.writeFileSync(input1FilePath, buffer1);
    console.log('Video 1 saved to:', input1FilePath);

    console.log('Fetching video 2:', processedVideoUrl);
    const response2 = await fetch(processedVideoUrl);
    const buffer2 = Buffer.from(await response2.arrayBuffer());
    fs.writeFileSync(input2FilePath, buffer2);
    console.log('Video 2 saved to:', input2FilePath);

    console.log('Analyzing video 1 stream information...');
    const video1Duration = await new Promise<number>((resolve, reject) => {
      ffmpeg.ffprobe(input1FilePath, (err, metadata) => {
        if (err) {
          console.error('Error analyzing video 1:', err);
          return reject(err);
        }
        const duration = metadata.format.duration;
        if (typeof duration === 'number') { // Check if duration is a number
          console.log('Video 1 duration:', duration);
          resolve(duration);
        } else {
          reject(new Error('Duration is undefined')); // Reject if duration is not a number
        }
      });
    });

    const hasAudio1 = await new Promise<boolean>((resolve, reject) => {
      ffmpeg.ffprobe(input1FilePath, (err, metadata) => {
        if (err) {
          console.error('Error analyzing video 1:', err);
          return reject(err);
        }
        const hasAudio = metadata.streams.some((stream) => stream.codec_type === 'audio');
        resolve(hasAudio);
      });
    });

    let silentAudioCreated = false;

    // Trim the pre-generated silent audio file to the video duration if needed
    if (!hasAudio1) {
      console.log('Trimming silent audio track to match video 1 duration...');
      await new Promise<void>((resolve, reject) => {
        ffmpeg(preGeneratedSilentAudioFilePath)
          .outputOptions(`-t ${video1Duration.toFixed(2)}`)
          .output(trimmedSilentAudioFilePath)
          .on('end', () => {
            console.log('Silent audio track trimmed successfully:', trimmedSilentAudioFilePath);
            silentAudioCreated = true;
            resolve();
          })
          .on('error', (err) => {
            console.error('Error trimming silent audio track:', err);
            reject(err);
          })
          .run();
      });

      console.log('Adding trimmed silent audio track to video 1...');
      await new Promise<void>((resolve, reject) => { // Specify 'void' as the Promise type
        ffmpeg(input1FilePath)
          .input(trimmedSilentAudioFilePath)
          .outputOptions('-c:v', 'copy')
          .outputOptions('-c:a', 'aac')
          .output(reencoded1FilePath)
          .on('end', () => {
            console.log('Silent audio track added to video 1:', reencoded1FilePath);
            resolve(); // No value is passed to resolve since the type is 'void'
          })
          .on('error', (err) => {
            console.error('Error adding silent audio track to video 1:', err);
            reject(err);
          })
          .run();
      });
    } else {
      console.log('Re-encoding video 1...');
      await new Promise<void>((resolve, reject) => {
        ffmpeg(input1FilePath)
          .outputOptions('-vf', 'fps=30')
          .outputOptions('-c:v', 'libx264', '-preset', 'veryfast')
          .outputOptions('-c:a', 'aac', '-b:a', '192k')
          .output(reencoded1FilePath)
          .on('end', () => {
            console.log('Video 1 re-encoded successfully:', reencoded1FilePath);
            resolve();
          })
          .on('error', (err) => {
            console.error('Error re-encoding video 1:', err);
            reject(err);
          })
          .run();
      });
    }

    console.log('Re-encoding video 2...');
    await new Promise<void>((resolve, reject) => {
      ffmpeg(input2FilePath)
        .outputOptions('-vf', 'fps=30')
        .outputOptions('-c:v', 'libx264', '-preset', 'veryfast')
        .outputOptions('-c:a', 'aac', '-b:a', '192k')
        .output(reencoded2FilePath)
        .on('end', () => {
          console.log('Video 2 re-encoded successfully:', reencoded2FilePath);
          resolve();
        })
        .on('error', (err) => {
          console.error('Error re-encoding video 2:', err);
          reject(err);
        })
        .run();
    });

    console.log('Creating list file for concatenation...');
    fs.writeFileSync(listFilePath, `file '${reencoded1FilePath}'\nfile '${reencoded2FilePath}'\n`);
    console.log('List file created:', listFilePath);

    console.log('Concatenating videos...');
    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input(listFilePath)
        .inputOptions(['-f', 'concat', '-safe', '0'])
        .outputOptions(['-c:v', 'libx264', '-c:a', 'aac', '-strict', 'experimental'])
        .output(outputFilePath)
        .on('end', () => {
          console.log('Videos concatenated successfully:', outputFilePath);
          resolve();
        })
        .on('error', (err) => {
          console.error('Error concatenating videos:', err);
          reject(err);
        })
        .run();
    });

    const outputBuffer = fs.readFileSync(outputFilePath);
    console.log('Final video read successfully:', outputFilePath);

    // Clean up temporary files
    console.log('Cleaning up temporary files...');
    fs.unlinkSync(input1FilePath);
    fs.unlinkSync(input2FilePath);
    fs.unlinkSync(reencoded1FilePath);
    fs.unlinkSync(reencoded2FilePath);
    fs.unlinkSync(listFilePath);
    fs.unlinkSync(outputFilePath);

    if (silentAudioCreated && fs.existsSync(trimmedSilentAudioFilePath)) {
      fs.unlinkSync(trimmedSilentAudioFilePath);
    }

    console.log('Temporary files cleaned up.');

    const outputFileName = `concatenated_${uuidv4()}.mp4`;

    console.log('Uploading concatenated video to Supabase storage.');
    const supabaseResult = await supabase.storage
      .from('rendered_videos')
      .upload(outputFileName, outputBuffer, {
        contentType: 'video/mp4',
        cacheControl: '604800', // Cache for 7 days
      });
    console.log('Concatenated video uploaded to Supabase storage.');

    if (supabaseResult.error) {
      throw new Error(supabaseResult.error.message);
    }
    console.log('Supabase upload result checked.');

    const concatenatedVideoUrl = `https://uwfllbptpdqoovbeizya.supabase.co/storage/v1/object/public/rendered_videos/${outputFileName}`;
    console.log('Constructed URL for concatenated video:', concatenatedVideoUrl);

    return concatenatedVideoUrl;
  } catch (error) {
    console.error('Error processing video:', error);
    throw error;
  }
}

export async function addAudioToVideoAndUpload(concatenatedHookVisual1: string, originalFileUrl: string, hooktimestamp: string): Promise<string> {
  const supabase = createClient();
  const tmpDir = '/tmp';

  try {
    // Ensure the /tmp directory exists
    if (!fs.existsSync(tmpDir)) {
      throw new Error(`The directory ${tmpDir} does not exist.`);
    }

    // Fetch and save the original video
    const originalVideoResponse = await fetch(originalFileUrl);
    if (!originalVideoResponse.ok) {
      throw new Error(`Failed to fetch original video: ${originalVideoResponse.statusText}`);
    }
    const originalVideoBuffer = await originalVideoResponse.arrayBuffer();
    const originalVideoFilePath = path.join(tmpDir, `${uuidv4()}_original.mp4`);
    fs.writeFileSync(originalVideoFilePath, Buffer.from(originalVideoBuffer));
    console.log('Original video saved to:', originalVideoFilePath);

    // Extract and trim the audio from the original video
    const trimmedAudioFilePath = path.join(tmpDir, `${uuidv4()}_trimmed_audio.aac`);
    await new Promise<void>((resolve, reject) => {
      ffmpeg(originalVideoFilePath)
        .audioCodec('aac')
        .noVideo()
        .setDuration(hooktimestamp)
        .save(trimmedAudioFilePath)
        .on('end', () => {
          console.log('Audio trimmed and saved to:', trimmedAudioFilePath);
          resolve();
        })
        .on('error', (err) => {
          console.error('Error trimming audio:', err);
          reject(err);
        });
    });

    // The original video file is no longer needed after extracting the audio
    fs.unlinkSync(originalVideoFilePath);
    console.log('Original video file deleted:', originalVideoFilePath);

    // Fetch and save the concatenated video
    const concatenatedVideoResponse = await fetch(concatenatedHookVisual1);
    if (!concatenatedVideoResponse.ok) {
      throw new Error(`Failed to fetch concatenated video: ${concatenatedVideoResponse.statusText}`);
    }
    const concatenatedVideoBuffer = await concatenatedVideoResponse.arrayBuffer();
    const concatenatedVideoFilePath = path.join(tmpDir, `${uuidv4()}_concatenated.mp4`);
    fs.writeFileSync(concatenatedVideoFilePath, Buffer.from(concatenatedVideoBuffer));
    console.log('Concatenated video saved to:', concatenatedVideoFilePath);

    // Add the trimmed audio to the beginning of the concatenated video
    const finalVideoFilePath = path.join(tmpDir, `${uuidv4()}_finalVideo.mp4`);
    console.log('Final video file path:', finalVideoFilePath);
    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input(trimmedAudioFilePath)
        .input(concatenatedVideoFilePath)
        .complexFilter([
          '[0:a][1:a]concat=n=2:v=0:a=1[out]'
        ], ['out'])
        .map('[out]')
        .map('1:v')
        .save(finalVideoFilePath)
        .on('end', () => {
          console.log('Final video created and saved to:', finalVideoFilePath);
          resolve();
        })
        .on('error', (err) => {
          console.error('Error creating final video:', err);
          reject(err);
        });
    });

    // Check if the final video file exists before reading
    if (!fs.existsSync(finalVideoFilePath)) {
      throw new Error(`The final video file does not exist: ${finalVideoFilePath}`);
    }

    // Upload the final video to Supabase storage
    const finalVideoBuffer = fs.readFileSync(finalVideoFilePath);
    const fileName = `final_video_${uuidv4()}.mp4`;
    const supabaseResult = await supabase.storage
      .from('rendered_videos')
      .upload(fileName, finalVideoBuffer, {
        contentType: 'video/mp4',
        cacheControl: '604800', // Cache for 7 days
      });

    // The final video file is no longer needed after being uploaded
    fs.unlinkSync(finalVideoFilePath);
    console.log('Final video file deleted:', finalVideoFilePath);

    if (supabaseResult.error) {
      throw new Error(supabaseResult.error.message);
    }

    const finalVideoUrl = `https://uwfllbptpdqoovbeizya.supabase.co/storage/v1/object/public/rendered_videos/${fileName}`;
    console.log('Final video URL:', finalVideoUrl);

    return finalVideoUrl;
  } catch (error) {
    console.error('Error processing video:', error);
    throw error;
  }
}

export async function captionVideo(concatenatedHookVisual1: string): Promise<string> {
  const supabase = createClient();
  console.log('Supabase client created.');

  try {
    const tmpDir = '/tmp';
    const inputFilePath = path.join(tmpDir, `${uuidv4()}.mp4`);
    const outputFilePath = path.join(tmpDir, `${uuidv4()}_captioned.mp4`);
    const srtFilePath = path.join(tmpDir, `${uuidv4()}.srt`);
    const assFilePath = path.join(tmpDir, `${uuidv4()}.ass`);

    console.log('Fetching video:', concatenatedHookVisual1);
    const response = await fetch(concatenatedHookVisual1);
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(inputFilePath, buffer);
    console.log('Video saved to:', inputFilePath);

    console.log('Transcribing audio from video for captions...');
    const captions = await transcribeAudioFromUrlSRT(concatenatedHookVisual1);
    console.log('Transcription completed.');

    console.log('Saving SRT file from transcription...');
    fs.writeFileSync(srtFilePath, captions);
    console.log('SRT file created at:', srtFilePath);

    console.log('Converting SRT to ASS format...');
    await convertSRTToASS(srtFilePath, assFilePath);
    console.log('ASS file created:', assFilePath);

    console.log('Adding captions to video...');
    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputFilePath)
        .outputOptions([
          '-vf', 
          `subtitles=${assFilePath}:force_style='Fontname=Roboto,Fontsize=12,PrimaryColour=&H00000000,OutlineColour=&H40FFFFFF,BorderStyle=3,BackColour=&HFFFFFFFF,Outline=1'`
        ])
        .output(outputFilePath)
        .on('end', () => {
          console.log('Captions added to video.');
          resolve();
        })
        .on('error', (err) => {
          console.error('Error adding captions to video:', err);
          reject(err);
        })
        .run();
    });
            
    
    console.log('Reading captioned video file.');
    const captionedVideoBuffer = fs.readFileSync(outputFilePath);
    console.log('Captioned video file read successfully.');

    const outputFileName = `captioned_${uuidv4()}.mp4`;

    console.log('Uploading captioned video to Supabase storage.');
    const supabaseResult = await supabase.storage
      .from('rendered_videos')
      .upload(outputFileName, captionedVideoBuffer, {
        contentType: 'video/mp4',
        cacheControl: '604800', // Cache for 7 days
      });
    console.log('Captioned video uploaded to Supabase storage.');

    if (supabaseResult.error) {
      throw new Error(supabaseResult.error.message);
    }
    console.log('Supabase upload result checked.');

    const captionedVideoUrl = `https://uwfllbptpdqoovbeizya.supabase.co/storage/v1/object/public/rendered_videos/${outputFileName}`;
    console.log('Constructed URL for captioned video:', captionedVideoUrl);

    console.log('Cleaning up temporary files.');
    fs.unlinkSync(inputFilePath);
    fs.unlinkSync(outputFilePath);
    fs.unlinkSync(srtFilePath);
    fs.unlinkSync(assFilePath);
    console.log('Temporary files cleaned up.');

    return captionedVideoUrl;
  } catch (error) {
    console.error('Error processing video:', error);
    throw error;
  }
}

async function convertSRTToASS(srtPath: string, assPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(srtPath)
      .outputOptions('-c:s', 'ass')
      .save(assPath)
      .on('end', () => resolve())
      .on('error', (err: Error) => reject(err));
  });
}

export async function generatePoster(videoUrl: string): Promise<string> {
  const supabase = createClient();
  const tmpDir = '/tmp';
  const posterFileName = `poster_${uuidv4()}.webp`;
  const posterFilePath = path.join(tmpDir, posterFileName);

  let attempt = 0;
  const maxAttempts = 3;

  while (attempt < maxAttempts) {
    try {
      // Fetch the video
      const response = await fetch(videoUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch video: ${response.statusText}`);
      }
      const videoBuffer = Buffer.from(await response.arrayBuffer());
      const inputFilePath = path.join(tmpDir, `${uuidv4()}.mp4`);
      fs.writeFileSync(inputFilePath, videoBuffer);

      // Generate poster using ffmpeg without specifying size to maintain original dimensions
      await new Promise<void>((resolve, reject) => {
        ffmpeg(inputFilePath)
          .screenshots({
            timestamps: [0],
            filename: posterFileName,
            folder: tmpDir
            // Removed the size option
          })
          .on('end', () => {
            console.log('Poster generated successfully:', posterFilePath);
            resolve();
          })
          .on('error', (err) => {
            console.error('Error generating poster:', err);
            reject(err);
          });
      });

      // Read the poster file
      const posterBuffer = fs.readFileSync(posterFilePath);

      // Upload the poster to Supabase storage
      const { data, error } = await supabase.storage
        .from('poster_urls')
        .upload(posterFileName, posterBuffer, {
          contentType: 'image/webp',
          cacheControl: '604800', // Cache for 7 days
        });

      if (error) {
        throw new Error(error.message);
      }

      // Construct the URL for the uploaded poster
      const posterUrl = `https://uwfllbptpdqoovbeizya.supabase.co/storage/v1/object/public/poster_urls/${posterFileName}`;
      console.log('Poster URL:', posterUrl);

      // Clean up temporary files
      fs.unlinkSync(inputFilePath);
      fs.unlinkSync(posterFilePath);

      return posterUrl;
    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed:`, error);
      attempt++;
      if (attempt >= maxAttempts) {
        console.error('All attempts to generate poster failed.');
        throw error;
      }
    }
  }
  // If all attempts fail, throw an error
  throw new Error('Failed to generate poster after maximum attempts.');
}

export async function compressVideoAndReturnBase64(publicURL: string): Promise<string> {
  const tmpDir = '/tmp';

  // Generate unique file names
  const inputFilePath = path.join(tmpDir, `${uuidv4()}_inputVideo`);
  const outputFilePath = path.join(tmpDir, `${uuidv4()}_compressedVideo.webm`);

  try {
    // Ensure the tmpDir exists
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    // Step 1: Download the video from publicURL
    console.log(`Fetching video from URL: ${publicURL}`);
    const response = await fetch(publicURL);
    if (!response.ok) {
      throw new Error(`Failed to fetch video: ${response.statusText}`);
    }
    const videoBuffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(inputFilePath, videoBuffer);
    console.log('Video downloaded and saved to:', inputFilePath);

    // Step 2: Compress the video using FFmpeg with specified settings
    console.log('Starting video compression...');
    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputFilePath)
        .outputOptions([
          '-c:v libvpx-vp9',                     // Video codec
          '-vf', 'scale=iw*0.25:ih*0.25',        // Scale video to 25% of original size
          '-b:v 200k',                           // Video bitrate
          '-r 15',                               // Frame rate
          '-crf 50',                             // CRF (quality factor)
          '-c:a libvorbis',                      // Audio codec
          '-b:a 48k',                            // Audio bitrate
        ])
        .format('webm')                          // Output format
        .on('start', (commandLine) => {
          console.log('Spawned FFmpeg with command:', commandLine);
        })
        .on('progress', (progress) => {
          console.log(`Processing: ${progress.percent}% done`);
        })
        .on('error', (err, stdout, stderr) => {
          console.error('Error during video compression:', err.message);
          console.error('FFmpeg stderr:', stderr);
          reject(err);
        })
        .on('end', () => {
          console.log('Video compression completed:', outputFilePath);
          resolve();
        })
        .save(outputFilePath);
    });

    // Step 3: Read the compressed video file and convert it to base64
    console.log('Reading compressed video file...');
    const compressedVideoBuffer = fs.readFileSync(outputFilePath);
    const base64Video = compressedVideoBuffer.toString('base64');
    console.log('Compressed video converted to base64.');

    // Step 4: Clean up temporary files
    fs.unlinkSync(inputFilePath);
    fs.unlinkSync(outputFilePath);
    console.log('Temporary files cleaned up.');

    return base64Video;

  } catch (error) {
    console.error('Error in compressVideoAndReturnBase64:', error);
    throw error;
  }
}

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