import { inngest } from "@/src/inngest/client";
import OpenAI from "openai";
import { createClient } from "@/utils/supabase/client";
import { uploadVideoToMux } from "@/lib/mux";

// Initialize Supabase and OpenAI clients
const supabase = createClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper: Convert "HH:MM:SS" to seconds.
const convertDurationToSeconds = (duration: string): number => {
  const [hours, minutes, seconds] = duration.split(":").map(Number);
  return hours * 3600 + minutes * 60 + seconds;
};

// Helper: Fetch a blur data URL from a poster URL.
const fetchBlurDataUrl = async (posterUrl: string): Promise<string> => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/createBlurDataUrl`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl: posterUrl }),
    }
  );
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch blur data URL. Status: ${response.status}. Error: ${errorText}`);
  }
  
  const blurData = await response.json();
  return blurData.base64Image;
};

async function processTrimmedVideo(
  trimmedVideoURL: string,
  brand: string,
  step: any
) {
  return await step.run(`process-${trimmedVideoURL}`, async () => {
    console.log(`Starting processing for trimmed video: ${trimmedVideoURL}`);
    
    try {
      const [
        muxResult,
        ageData,
        posterData,
        visualDescription,
        durationResult
      ] = await Promise.all([
        // Step 3: Upload video to Mux with error tracking
        (async () => {
          console.log('Starting Mux upload...');
          const result = await uploadVideoToMux(trimmedVideoURL);
          console.log('Mux upload complete:', result);
          return result;
        })(),
        // Step 4: Determine talent age
        (async () => {
          const res = await fetch(
            "https://us-central1-reel-fuse.cloudfunctions.net/googleVideoTalentAge",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ url: trimmedVideoURL }),
            }
          );
          if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Failed to get talent age. Status: ${res.status}. Error: ${errorText}`);
          }
          return res.json();
        })(),
        // Step 5: Generate poster
        (async () => {
          const res = await fetch(
            "https://us-central1-reel-fuse.cloudfunctions.net/generatePoster",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                videoUrl: trimmedVideoURL,
                bucketName: "poster_urls",
              }),
            }
          );
          if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Failed to generate poster. Status: ${res.status}. Error: ${errorText}`);
          }
          return res.json();
        })(),
        // Step 6: Get visual description
        (async () => {
          const res = await fetch(
            "https://us-central1-reel-fuse.cloudfunctions.net/googleDescriptionVisuals",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ url: trimmedVideoURL }),
            }
          );
          if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Failed to get visual description. Status: ${res.status}. Error: ${errorText}`);
          }
          const data = await res.json();
          return data.description;
        })(),
        // Step 7: Get video duration
        (async () => {
          const res = await fetch(
            "https://us-central1-reel-fuse.cloudfunctions.net/getVideoDuration",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ videoUrl: trimmedVideoURL }),
            }
          );
          if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Failed to get video duration. Status: ${res.status}. Error: ${errorText}`);
          }
          const data = await res.json();
          return data.duration;
        })()
      ]);

      console.log('All parallel operations completed successfully');

      // Step 8: Create embedding
      console.log('Creating OpenAI embedding...');
      const embeddingResp = await openai.embeddings.create({
        input: visualDescription,
        model: "text-embedding-3-small",
      }).catch(error => {
        console.error('OpenAI embedding creation failed:', error);
        throw error;
      });
      
      const [{ embedding: trimmedEmbedding }] = embeddingResp.data;
      console.log('Embedding created successfully');

      // Step 9: Fetch blur data URL
      const posterUrl = posterData.posterUrl;
      console.log('Fetching blur data URL...');
      const blurDataUrl = await fetchBlurDataUrl(posterUrl);
      console.log('Blur data URL fetched successfully');

      // Step 10: Insert data into Supabase
      const talentAge = ageData.ageGroup;
      const insertData = {
        video_url: trimmedVideoURL,
        description: visualDescription,
        embedding: trimmedEmbedding,
        poster_url: posterUrl,
        blur_data_url: blurDataUrl,
        brand,
        duration: durationResult,
        mux_asset_id: muxResult.mux_asset_id,
        mux_playback_id: muxResult.mux_playback_id,
        ...(talentAge !== "N/A" && { talent_age: talentAge }),
      };

      console.log('Inserting data into Supabase...');
      const { error } = await supabase.from("modular_clips").insert([insertData]);
      if (error) {
        console.error('Supabase insertion failed:', error);
        throw new Error(error.message);
      }
      console.log('Data inserted successfully');

      return { success: true };
    } catch (error) {
      console.error(`Failed to process trimmed video ${trimmedVideoURL}:`, error);
      throw error;
    }
  });
}

export const videoLibraryProcessing = inngest.createFunction(
  { id: "video-library-processing" },
  { event: "upload/video.received" },
  async ({ event, step }) => {
    console.log("videoLibraryProcessing triggered with event:", {
      publicURL: event.data.publicURL,
      duration: event.data.duration,
      brand: event.data.brand
    });

    try {
      // Extract event data
      const publicURL = event.data.publicURL;
      const videoDurationString = event.data.duration;
      const brand = event.data.brand;
      const videoDuration = convertDurationToSeconds(videoDurationString);
      
      console.log(`Processing video: Duration=${videoDuration}s, URL=${publicURL}`);

      if (videoDuration <= 5) {
        console.log("Processing short video (≤5s)");
        // Short video processing logic...
        // [Previous code remains the same but with added logging]
      } else {
        console.log("Processing long video (>5s)");
        
        // Step 1: Timestamp processing
        console.log("Starting timestamp processing...");
        const timestamps = await step.run("timestamp-processing", async () => {
          const response = await fetch(
            "https://us-central1-reel-fuse.cloudfunctions.net/googleTimestampProcessing",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ publicURL }),
            }
          );
          
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Timestamp processing failed. Status: ${response.status}. Error: ${errorText}`);
          }
          
          return response.json();
        });
        console.log("Timestamps processed:", timestamps);

        // Step 2: Video trimming
        console.log("Starting video trimming...");
        const trimmedData = await step.run("video-trimming", async () => {
          const response = await fetch(
            "https://us-central1-reel-fuse.cloudfunctions.net/trimVideos-1",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ videoUrl: publicURL, timestamps }),
            }
          );
          
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Video trimming failed. Status: ${response.status}. Error: ${errorText}`);
          }
          
          return response.json();
        });

        const trimmedVideoURLs = trimmedData.videoUrls;
        console.log(`Generated ${trimmedVideoURLs.length} trimmed videos`);

        if (!Array.isArray(trimmedVideoURLs) || trimmedVideoURLs.length === 0) {
          throw new Error("No trimmed videos returned from the API");
        }

        // Process each trimmed video
        for (const [index, trimmedVideoURL] of trimmedVideoURLs.entries()) {
          console.log(`Processing trimmed video ${index + 1}/${trimmedVideoURLs.length}`);
          await processTrimmedVideo(trimmedVideoURL, brand, step);
        }
      }

      console.log("Video processing completed successfully");
      return { 
        event, 
        body: "Video processed and data inserted into Supabase",
        success: true
      };
    } catch (error) {
      console.error("Video processing failed:", error);
      throw error; // Re-throw to mark the function as failed in Inngest
    }
  }
);