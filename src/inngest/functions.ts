import { inngest } from "@/src/inngest/client";
import OpenAI from "openai";
import { createClient } from "@/utils/supabase/client";
import { uploadVideoToMux } from "@/lib/mux";
import { v4 as uuidv4 } from 'uuid';


// Initialize Supabase and OpenAI clients
const supabase = createClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Constants for video formats and CDN identifiers
const SUPPORTED_VIDEO_FORMATS = ['mp4', 'mov', 'avi', 'wmv'];
const MP4_FORMAT = 'mp4';
const DROPBOX_CDN_IDENTIFIER = 'dropboxusercontent.com';
const SUPABASE_CDN_IDENTIFIER = 'supabase.co';

// Helper: Upload file to Supabase from URL
const uploadToSupabase = async (url: string, fileExtension: string): Promise<string> => {
  try {
    // Download the file from URL
    const response = await fetch(url);
    const blob = await response.blob();
    const uniqueFilename = `${uuidv4()}.${fileExtension}`;

    // Upload to Supabase
    const { error: uploadError } = await supabase.storage
      .from("modular_clips")
      .upload(uniqueFilename, blob, {
        cacheControl: "604800",
      });

    if (uploadError) throw new Error(uploadError.message);

    // Return the new Supabase URL
    return `https://uwfllbptpdqoovbeizya.supabase.co/storage/v1/object/public/modular_clips/${uniqueFilename}`;
  } catch (error) {
    console.error('Error uploading to Supabase:', error);
    throw error;
  }
};

// Helper: Convert video to MP4 if needed and ensure it's hosted on Supabase
const convertToMP4IfNeeded = async (url: string): Promise<string> => {
  console.log('Processing video URL:', url);
  
  const fileExtension = url.split('.').pop()?.toLowerCase();
  const isDropboxUrl = url.includes(DROPBOX_CDN_IDENTIFIER);
  const isSupabaseUrl = url.includes(SUPABASE_CDN_IDENTIFIER);
  
  // If it's not a supported format, return the original URL
  if (!fileExtension || !SUPPORTED_VIDEO_FORMATS.includes(fileExtension)) {
    console.log('Unsupported file format:', fileExtension);
    return url;
  }

  try {
    // Case 1: Dropbox URL with MP4 format - Upload to Supabase
    if (isDropboxUrl && fileExtension === MP4_FORMAT) {
      console.log('Processing Dropbox MP4 file - uploading to Supabase');
      return await uploadToSupabase(url, MP4_FORMAT);
    }
    
    // Case 2: Non-MP4 format (from either Dropbox or Supabase) - Convert
    if (fileExtension !== MP4_FORMAT) {
      console.log('Converting non-MP4 file to MP4');
      const response = await fetch(`https://us-central1-reel-fuse.cloudfunctions.net/ConvertToMP4`, {
        method: 'POST',
        body: JSON.stringify({ videoUrl: url }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to convert video to MP4:', errorText);
        throw new Error(`Failed to convert video to MP4. Status: ${response.status}. Error: ${errorText}`);
      }

      const responseBody = await response.text();
      console.log('Response from ConvertToMP4 cloud function:', responseBody);

      let convertedUrl;
      try {
        const jsonResponse = JSON.parse(responseBody);
        convertedUrl = jsonResponse.url;
      } catch (error) {
        console.error('Error parsing JSON response from ConvertToMP4 cloud function:', error);
        throw new Error('Failed to parse JSON response from cloud function');
      }
      
      // The converted URL is already a Supabase URL, so return it directly
      return convertedUrl;
    }
    
    // Case 3: Already an MP4 on Supabase
    if (isSupabaseUrl && fileExtension === MP4_FORMAT) {
      console.log('File is already an MP4 on Supabase');
      return url;
    }
    
    // Case 4: MP4 from another source - Upload to Supabase
    console.log('Uploading MP4 from external source to Supabase');
    return await uploadToSupabase(url, MP4_FORMAT);
    
  } catch (error) {
    console.error('Error in convertToMP4IfNeeded:', error);
    throw error;
  }
};

// Helper: Convert "HH:MM:SS" to seconds
const convertDurationToSeconds = (duration: string): number => {
  const [hours, minutes, seconds] = duration.split(":").map(Number);
  return hours * 3600 + minutes * 60 + seconds;
};

// Helper: Fetch a blur data URL from a poster URL
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
        durationResult,
        abRollData,
        shotTypeData
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
        })(),
        // New Step: Determine A/B Roll
        (async () => {
          const res = await fetch(
            "https://us-central1-reel-fuse.cloudfunctions.net/googleVideoABRoll",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ url: trimmedVideoURL }),
            }
          );
          if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Failed to determine A/B Roll. Status: ${res.status}. Error: ${errorText}`);
          }
          return res.json();
        })(),
        // New Step: Get shot types from trimmed video
        (async () => {
          const res = await fetch(
            "https://us-central1-reel-fuse.cloudfunctions.net/googleVideoShotType",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ 
                url: trimmedVideoURL,
                brand: brand,
                product: brand
              }),
            }
          );
          if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Failed to get shot types. Status: ${res.status}. Error: ${errorText}`);
          }
          return res.json();
        })()
      ]);

      console.log('All parallel operations completed successfully');

      // Step 8: Create embedding
      console.log('Creating OpenAI embedding...');
      const embeddingResp = await openai.embeddings.create({
        input: visualDescription,
        model: "text-embedding-3-large",
        dimensions: 2000
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
        embedding_2000d: trimmedEmbedding,
        poster_url: posterUrl,
        blur_data_url: blurDataUrl,
        brand,
        duration: durationResult,
        mux_asset_id: muxResult.mux_asset_id,
        mux_playback_id: muxResult.mux_playback_id,
        ab_roll: abRollData.type,
        shot_types: shotTypeData.shot_types,
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
  {
    id: "video-library-processing",
    concurrency: 3,
  },
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

      // Convert video to MP4 if needed before any processing
      const processedURL = await convertToMP4IfNeeded(publicURL);
      console.log('Video format processed:', processedURL);

      if (videoDuration <= 5) {
        console.log("Processing short video (≤5s)");
        // This is where we'll implement logic for shorter videos (upload to Mux, DB, classify, etc)
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
              body: JSON.stringify({ publicURL: processedURL }),
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
              body: JSON.stringify({ videoUrl: processedURL, timestamps }),
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
      throw error;
    }
  }
);