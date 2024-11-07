import { inngest } from "@/src/inngest/client";
import { transcribeAudioFromUrl } from "@/lib/deepgram";
import { gpt3TranscriptionAnalysis, gptHookVisualDescription } from "@/lib/openai"; 
import { trimOriginalVideoHook, concatenateVideos, captionVideo, generatePoster, calculateVideoDuration } from "@/lib/ffmepg";
import OpenAI from 'openai';
import { createClient } from '@/utils/supabase/client';
import { googleDescriptionVisuals, googleTimestampProcessing } from "@/lib/googlecloud";
import fetch from 'node-fetch';

const supabase = createClient();
const openai = new OpenAI({
  apiKey: "sk-proj-dOGjk0Ag2oXQxjweX0JDT3BlbkFJ70Xy4sHsKdSRiyEYqI2B",
  dangerouslyAllowBrowser: true,
});

// Helper function to convert HH:MM:SS to seconds
const convertDurationToSeconds = (duration: string) => {
  const [hours, minutes, seconds] = duration.split(':').map(Number);
  return hours * 3600 + minutes * 60 + seconds;
};


export const videoLibraryProcessing = inngest.createFunction(
  { id: "video-library-processing" },
  { event: "upload/video.received" },
  async ({ event }) => {
    console.log('videoLibraryProcessing function triggered with event:', event);

    // Extract the public URL of the uploaded video from the event data
    const publicURL = event.data.publicURL;
    const videoDurationString = event.data.duration; // Assuming duration is provided in HH:MM:SS format
    const brand = event.data.brand;
    const videoDuration = convertDurationToSeconds(videoDurationString);
    console.log(`Processing video from URL: ${publicURL} with duration: ${videoDuration} seconds`);

    // Function to fetch blur data URL
    const fetchBlurDataUrl = async (posterUrl: string): Promise<string> => {
      const blurResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/createBlurDataUrl`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl: posterUrl }),
      });

      if (!blurResponse.ok) {
        throw new Error(`HTTP error! status: ${blurResponse.status}`);
      }

      const blurData = await blurResponse.json();
      return blurData.base64Image; // Assuming the API returns an object with base64Image
    };

    if (videoDuration <= 5) {
      console.log('Video duration is 5 seconds or less. Proceeding with normal processing.');
      // Generate poster for the video
      const posterUrl = await generatePoster(publicURL);
      // Fetch blur data URL
      const blurDataUrl = await fetchBlurDataUrl(posterUrl);

      // Proceed as normal
      const visualDescription = await googleDescriptionVisuals(publicURL);
      console.log('Visual Description:', visualDescription);

      const embeddingResult = await openai.embeddings.create({
        input: visualDescription,
        model: "text-embedding-3-small",
      });
      console.log('Embedding result:', embeddingResult);

      const [{ embedding }] = embeddingResult.data;

      // Format duration as M:SS
      const formattedDuration = `${Math.floor(videoDuration / 60)}:${(videoDuration % 60).toString().padStart(2, '0')}`;

      const { error } = await supabase.from('modular_clips').insert([
        { video_url: publicURL, description: visualDescription, embedding, poster_url: posterUrl, blur_data_url: blurDataUrl, brand: brand, duration: formattedDuration },
      ]);

      if (error) {
        console.error('Error inserting data:', error.message);
        throw new Error(error.message);
      } else {
        console.log('Data inserted successfully for video URL:', publicURL);
      }
    } else {
      console.log('Video duration is more than 5 seconds. Proceeding with timestamp processing and trimming.');
      // If video is more than 5 seconds long
      const timestamps = await googleTimestampProcessing(publicURL);
      console.log('Timestamps for trimming:', timestamps);

      const trimResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/trim-videos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoUrl: publicURL, timestamps }),
      });
      console.log('Trim response status:', trimResponse.status);

      if (!trimResponse.ok) {
        throw new Error(`HTTP error! status: ${trimResponse.status}`);
      }

      // Retrieve the public URLs for the trimmed videos from the response
      const trimmedVideoData = await trimResponse.json();
      const trimmedVideoURLs = trimmedVideoData.videoUrls; // Assuming the API returns an array of URLs
      console.log('Trimmed video URLs:', trimmedVideoURLs);

      // Ensure trimmedVideoURLs is an array and contains URLs
      if (!Array.isArray(trimmedVideoURLs) || trimmedVideoURLs.length === 0) {
        throw new Error('No trimmed videos returned from the API.');
      }

      // Iterate over each trimmed video URL and process with googleDescriptionVisuals
      for (const trimmedVideoURL of trimmedVideoURLs) {
        console.log('Processing trimmed video URL:', trimmedVideoURL);

        // Generate poster for the trimmed video
        const posterUrl = await generatePoster(trimmedVideoURL);
        // Fetch blur data URL
        const blurDataUrl = await fetchBlurDataUrl(posterUrl);

        const trimmedVisualDescription = await googleDescriptionVisuals(trimmedVideoURL);
        console.log('Trimmed Visual Description:', trimmedVisualDescription);

        const trimmedEmbeddingResult = await openai.embeddings.create({
          input: trimmedVisualDescription,
          model: "text-embedding-3-small",
        });
        console.log('Trimmed embedding result:', trimmedEmbeddingResult);

        const [{ embedding: trimmedEmbedding }] = trimmedEmbeddingResult.data;

        // Calculate the duration of the trimmed video
        const trimmedDuration = await calculateVideoDuration(trimmedVideoURL);
        console.log(`Calculated duration for trimmed video: ${trimmedDuration}`);

        const { error: trimmedError } = await supabase.from('modular_clips').insert([
          { video_url: trimmedVideoURL, description: trimmedVisualDescription, embedding: trimmedEmbedding, poster_url: posterUrl, blur_data_url: blurDataUrl, brand: brand, duration: trimmedDuration },
        ]);

        if (trimmedError) {
          console.error('Error inserting trimmed data:', trimmedError.message);
          throw new Error(trimmedError.message);
        } else {
          console.log('Trimmed data inserted successfully for video URL:', trimmedVideoURL);
        }
      }
    }

    console.log('Video processing complete. Data inserted into Supabase.');
    return { event, body: "Video processed and data inserted into Supabase." };
  },
);


export const videoIteration = inngest.createFunction(
  { id: "video-iteration" },
  { event: "iteration/video.received" },
  async ({ event, step }) => {
    // Step 1: Transcribe the video
    const transcriptionResponse = await step.run("transcribe-video", async () => {
      try {
        const response = await transcribeAudioFromUrl(event.data.originalFileUrl);
        console.log("Transcription response:", response);
        return response;
      } catch (error) {
        console.error("Error transcribing video:", error);
        throw error;
      }
    });

    // Extract the transcript text from the response
    let transcriptText = "";
    if (transcriptionResponse.results && transcriptionResponse.results.channels) {
      transcriptText = transcriptionResponse.results.channels
        .map((channel: any) => channel.alternatives[0].transcript)
        .join(' ');
    } else {
      throw new Error("Transcription response does not have the expected format.");
    }
    console.log("Transcript text:", transcriptText);

    // Step 2: Generate GPT-3 completion
    const gpt3TranscriptionAnalysisResult = await step.run("analyze-transcription", async () => {
      try {
        const analysisResult = await gpt3TranscriptionAnalysis(transcriptText);
        return analysisResult;
      } catch (error) {
        console.error("Error generating GPT-3 completion:", error);
        throw error;
      }
    });

    // Step 3: Generate GPT-3 hook visual description
    const gptHookVisualDescriptionResult = await step.run("generate-hook-visual-descriptions", async () => {
      try {
        const hookVisualDescriptionResult = await gptHookVisualDescription(gpt3TranscriptionAnalysisResult);
        return hookVisualDescriptionResult;
      } catch (error) {
        console.error("Error generating GPT-3 hook visual description:", error);
        throw error;
      }
    });

    // Step 4: Match modular clips using OpenAI embeddings
    const gpt1HookVisualUrlResult = await step.run("vector-hook-visual-url", async () => {
      try {
        // Directly access the hookDescription1 property
        const hook1Description = gptHookVisualDescriptionResult.hookDescription1;
        const result = await openai.embeddings.create({
          input: hook1Description,
          model: "text-embedding-3-small",
        });

    const [{ embedding }] = result.data;

    const { data, error: matchError } = await supabase
      .rpc("match_modular_clips", {
        match_count: 1,
        query_embedding: embedding,
        match_threshold: -1.0,
      });

    if (matchError) {
      throw matchError;
    }

    return [{ video_url: data[0].video_url }];
  } catch (error) {
    console.error("Error matching modular clips:", error);
    throw error;
  }
});

// Step 5: Process the video to trim based on the hook visual timestamp and matched video URL
const trimmedHookVisual1FileUrlResult = await step.run("process-hook-visual-iteration", async () => {
  try {
    const processedVideoUrl = await trimOriginalVideoHook(
      event.data.originalFileUrl,
      event.data.hooktimestamp
    );
    console.log("Processed video URL:", processedVideoUrl);
    return processedVideoUrl;
  } catch (error) {
    console.error("Error processing video:", error);
    throw error;
  }
});

// Step 6: Concatenate the hook visual url 1 with the trimmed original video body
const concatenatedHookVisual1 = await step.run("concatenate-videos", async () => {
  try {
    const concatenatedVideoUrl = await concatenateVideos(
      gpt1HookVisualUrlResult[0].video_url,
      trimmedHookVisual1FileUrlResult
    );
    console.log("Concatenated video URL:", concatenatedVideoUrl);
    return concatenatedVideoUrl;
  } catch (error) {
    console.error("Error concatenating videos:", error);
    throw error;
  }
});

// Step 7: Add captions to the concatenated video
const captionedHookVisualVideoUrl = await step.run("caption-video", async () => {
  try {
    console.log("Value passed to captionVideo function:", concatenatedHookVisual1);
    const captionedVideo = await captionVideo(concatenatedHookVisual1);
    return captionedVideo;
  } catch (error) {
    console.error("Error adding captions to video:", error);
    throw error;
  }
});

return {
  transcriptionResponse,
  gpt3TranscriptionAnalysisResult,
  gptHookVisualDescriptionResult,
  gpt1HookVisualUrlResult,
  trimmedHookVisual1FileUrlResult,
  concatenatedHookVisual1,
  captionedHookVisualVideoUrl
};
  }
);