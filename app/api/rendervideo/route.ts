import { NextResponse } from 'next/server';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
  try {
    const { videoUrl1, videoUrl2 } = await req.json();

    if (!videoUrl1 || !videoUrl2) {
      return NextResponse.json({ message: 'Both video URLs are required' }, { status: 400 });
    }

    const tmpDir = '/tmp';
    const input1FilePath = path.join(tmpDir, `${uuidv4()}.mp4`);
    const input2FilePath = path.join(tmpDir, `${uuidv4()}.mp4`);
    const reencoded1FilePath = path.join(tmpDir, `${uuidv4()}_reencoded1.mp4`);
    const reencoded2FilePath = path.join(tmpDir, `${uuidv4()}_reencoded2.mp4`);
    const trimmedSilentAudioFilePath = path.join(tmpDir, `${uuidv4()}_silent.aac`);
    const listFilePath = path.join(tmpDir, `${uuidv4()}.txt`);
    const outputFilePath = path.join(tmpDir, `${uuidv4()}_output.mp4`);

    const preGeneratedSilentAudioFilePath = path.join(process.cwd(), 'public/silence.aac');

    console.log('Fetching video 1:', videoUrl1);
    const response1 = await fetch(videoUrl1);
    const buffer1 = Buffer.from(await response1.arrayBuffer());
    fs.writeFileSync(input1FilePath, buffer1);
    console.log('Video 1 saved to:', input1FilePath);

    console.log('Fetching video 2:', videoUrl2);
    const response2 = await fetch(videoUrl2);
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
        // Provide a fallback value of 0 if duration is undefined
        const duration = metadata.format.duration ?? 0;
        console.log('Video 1 duration:', duration);
        resolve(duration);
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
      await new Promise<void>((resolve, reject) => {
        ffmpeg(input1FilePath)
          .input(trimmedSilentAudioFilePath)
          .outputOptions('-c:v', 'copy')
          .outputOptions('-c:a', 'aac')
          .output(reencoded1FilePath)
          .on('end', () => {
            console.log('Silent audio track added to video 1:', reencoded1FilePath);
            resolve();
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
    return new NextResponse(outputBuffer, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="${outputFileName}"`,
      },
    });
  } catch (error) {
    console.error('Error processing video:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
