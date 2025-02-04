// lib/mux.ts

const MUX_TOKEN_ID = process.env.MUX_TOKEN_ID;
const MUX_TOKEN_SECRET = process.env.MUX_TOKEN_SECRET;

interface MuxResponse {
  data: {
    id: string;
    playback_ids: { policy: string; id: string }[];
  };
}

/**
 * Uploads a video to Mux and returns the asset and playback IDs.
 * @param videoUrl - The URL of the video to upload.
 * @returns An object containing mux_asset_id and mux_playback_id.
 */
export async function uploadVideoToMux(videoUrl: string): Promise<{ mux_asset_id: string; mux_playback_id: string }> {
  console.log(`Starting upload for video URL: ${videoUrl}`);
  if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
    console.error('Mux token ID or secret is undefined.');
    throw new Error('Mux token ID or secret is undefined.');
  }

  const url = "https://api.mux.com/video/v1/assets";
  const payload = {
    input: [
      {
        url: videoUrl
      }
    ],
    playback_policy: ["public"],
    video_quality: "basic",
  };

  console.log(`Sending request to Mux with payload: ${JSON.stringify(payload)}`);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`).toString("base64")}`,
    },
    body: JSON.stringify(payload),
  });

  const responseData: MuxResponse = await response.json();
  console.log(`Received response from Mux: ${JSON.stringify(responseData)}`);

  if (!response.ok) {
    console.error(`Failed to upload video to Mux: ${response.statusText}, response: ${JSON.stringify(responseData)}`);
    throw new Error(`Failed to upload video to Mux: ${response.statusText}`);
  }

  const mux_asset_id = responseData.data.id;
  const mux_playback_id = responseData.data.playback_ids[0]?.id;

  if (!mux_asset_id || !mux_playback_id) {
    console.error(`Failed to retrieve asset or playback ID from Mux response: ${JSON.stringify(responseData)}`);
    throw new Error("Failed to retrieve asset or playback ID from Mux response.");
  }

  console.log(`Upload successful. Asset ID: ${mux_asset_id}, Playback ID: ${mux_playback_id}`);
  return { mux_asset_id, mux_playback_id };
}
