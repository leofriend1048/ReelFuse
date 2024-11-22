import { inngest } from "@/src/inngest/client";
import { gpt3TranscriptionAnalysis, gptHookVisualDescription } from "@/lib/openai"; 
import OpenAI from 'openai';
import { createClient } from '@/utils/supabase/client';
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
      const generatePosterResponse = await fetch('https://us-central1-reel-fuse.cloudfunctions.net/generatePoster', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoUrl: publicURL, bucketName: 'poster_urls' }),
      });

      if (!generatePosterResponse.ok) {
        throw new Error(`HTTP error! status: ${generatePosterResponse.status}`);
      }

      const posterData = await generatePosterResponse.json();
      const posterUrl = posterData.posterUrl; 
      console.log('Poster URL:', posterUrl);

      // Fetch blur data URL
      const blurDataUrl = await fetchBlurDataUrl(posterUrl);

      // Make a POST request to the googleDescriptionVisuals endpoint
      const descriptionResponse = await fetch('https://us-central1-reel-fuse.cloudfunctions.net/googleDescriptionVisuals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: publicURL }),
      });

      if (!descriptionResponse.ok) {
        throw new Error(`HTTP error! status: ${descriptionResponse.status}`);
      }

      const descriptionData = await descriptionResponse.json();
      const visualDescription = descriptionData.description;
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
      const timestampResponse = await fetch('https://us-central1-reel-fuse.cloudfunctions.net/googleTimestampProcessing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ publicURL: publicURL }),
      });

      if (!timestampResponse.ok) {
        throw new Error(`HTTP error! status: ${timestampResponse.status}`);
      }

      const timestamps = await timestampResponse.json();
      console.log('Timestamps for trimming:', timestamps);

      const trimResponse = await fetch(`https://us-central1-reel-fuse.cloudfunctions.net/trimVideos`, {
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
        const generatePosterResponse = await fetch('https://us-central1-reel-fuse.cloudfunctions.net/generatePoster', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ videoUrl: trimmedVideoURL, bucketName: 'poster_urls' }),
        });

        if (!generatePosterResponse.ok) {
          throw new Error(`HTTP error! status: ${generatePosterResponse.status}`);
        }

        const posterData = await generatePosterResponse.json();
        const posterUrl = posterData.posterUrl;
        // Fetch blur data URL
        const blurDataUrl = await fetchBlurDataUrl(posterUrl);

        const descriptionResponse = await fetch('https://us-central1-reel-fuse.cloudfunctions.net/googleDescriptionVisuals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: trimmedVideoURL }),
        });

        if (!descriptionResponse.ok) {
          throw new Error(`HTTP error! status: ${descriptionResponse.status}`);
        }

        const descriptionData = await descriptionResponse.json();
        const trimmedVisualDescription = descriptionData.description;
        console.log('Trimmed Visual Description:', trimmedVisualDescription);

        const trimmedEmbeddingResult = await openai.embeddings.create({
          input: trimmedVisualDescription,
          model: "text-embedding-3-small",
        });
        console.log('Trimmed embedding result:', trimmedEmbeddingResult);

        const [{ embedding: trimmedEmbedding }] = trimmedEmbeddingResult.data;

        // Calculate the duration of the trimmed video
        const durationResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/video-duration`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ videoUrl: trimmedVideoURL }),
        });

        if (!durationResponse.ok) {
          throw new Error(`HTTP error! status: ${durationResponse.status}`);
        }

        const { duration: trimmedDuration } = await durationResponse.json();
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

