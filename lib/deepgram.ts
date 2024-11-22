import fs from 'fs';
import path from 'path';
import { createClient, srt } from "@deepgram/sdk";

const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
const deepgram = createClient(deepgramApiKey);

export async function transcribeAudioFromUrl(originalFileUrl: string) {
  try {
    const { result, error } = await deepgram.listen.prerecorded.transcribeUrl(
      { url: originalFileUrl },
      {
        smart_format: true,
        model: 'nova-2',
        language: 'en-US',
        keywords: ['Sonicsmooth', 'dermaplaning'],
      },
    );

    if (error) throw error;
    console.dir(result, { depth: null });

    console.log("Transcription result:", result);

    return result;
  } catch (error) {
    console.error("Error transcribing video:", error);
    throw error; 
  }
}

export async function transcribeAudioFromUrlSRT(concatenatedHookVisual1: string): Promise<string> {
  try {
    const { result, error } = await deepgram.listen.prerecorded.transcribeUrl(
      {
        url: concatenatedHookVisual1,
      },
      {
        smart_format: true,
        utterances: true,
        model: 'nova-2',
        punctuate: false,
        language: 'en-US',
        keywords: ['dermablades', 'Sonicsmooth', 'dermaplaning'],
      }
    );

    if (error) {
      throw error;
    }

    if (!result) {
      throw new Error("No transcription result received.");
    }

    // Create a Write Stream for the SRT file
    const stream = fs.createWriteStream("output.srt", { flags: "a" });

    // Convert the result to SRT format
    const captions = srt(result);

    // Write the captions to the SRT file
    stream.write(captions);

    console.log("Transcription result:", captions);

    return captions;
  } catch (error) {
    console.error("Error transcribing video:", error);
    throw error;
  }
}