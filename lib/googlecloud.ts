'use server'
const { VertexAI } = require('@google-cloud/vertexai');
const fetch = (...args: any[]) => import('node-fetch').then(({ default: fetch }) => fetch(...args as [any]));
import { AxiosError } from 'axios';

// Initialize Vertex with your Cloud project and location
const vertex_ai = new VertexAI({project: 'reel-fuse', location: 'us-central1'});
const model = 'gemini-1.5-pro-002';

// Improved exponential backoff function
async function exponentialBackoff<T>(fn: () => Promise<T>, maxRetries = 5, initialDelay = 2000): Promise<T> {
  let retries = 0;
  while (true) {
    try {
      return await fn();
    } catch (error) {
      if (retries >= maxRetries) {
        console.error('Max retries reached. Request failed.');
        throw error;
      }
      const delay = initialDelay * Math.pow(2, retries);
      console.log(`Retrying in ${delay}ms... (Attempt ${retries + 1} of ${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      retries++;
    }
  }
}


// Improved function to fetch video and convert to base64
async function fetchVideoAsBase64(publicURL: string): Promise<string> {
  console.log(`Attempting to fetch video from URL: ${publicURL}`);
  return exponentialBackoff(async () => {
    const response = await fetch(publicURL);
    console.log(`Fetch response status: ${response.status}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch video: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer).toString('base64');
  });
}


// Function to generate JSON content with a given video file URL
export async function generateAdScriptJSON(originalFileUrl: string) {
  const base64Video = await fetchVideoAsBase64(originalFileUrl);

  const generativeModel = vertex_ai.preview.getGenerativeModel({
    model: model,
    generationConfig: {
      'maxOutputTokens': 8192,
      'temperature': 1,
      'topP': 0.95,
    },
    safetySettings: [
      {
        'category': 'HARM_CATEGORY_HATE_SPEECH',
        'threshold': 'BLOCK_ONLY_HIGH',
      },
      {
        'category': 'HARM_CATEGORY_DANGEROUS_CONTENT',
        'threshold': 'BLOCK_ONLY_HIGH',
      },
      {
        'category': 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        'threshold': 'BLOCK_ONLY_HIGH',
      },
      {
        'category': 'HARM_CATEGORY_HARASSMENT',
        'threshold': 'BLOCK_ONLY_HIGH',
      },
    ],
  });

  const video1 = {
    inlineData: {
      mimeType: 'video/mp4',
      data: base64Video,
    },
  };

  const text1 = {
    text: `Imagine you're an expert direct response creative strategist reviewing a successful Facebook ad. I want you to output in JSON, the script of the ad including the direct response framework module, description of visuals, and the voiceover copy for each scene/module. You can only provide strategy based on the pdf knowledge base from Tubesciences. In your response, there is no limit to how many modules there are. Make sure Sonicsmooth is spelled as Sonicsmooth. The JSON structure should follow this format:
  {
    "FrameworkModule": [
      {
        "Module": "",
        "DescriptionOfVisuals": "",
        "VoiceoverCopy": ""
      },
      {
        "Module": "",
        "DescriptionOfVisuals": "",
        "VoiceoverCopy": ""
      },
      {
        "Module": "",
        "DescriptionOfVisuals": "",
        "VoiceoverCopy": ""
      },
      {
        "Module": "",
        "DescriptionOfVisuals": "",
        "VoiceoverCopy": ""
      }
    ]
  }`,
  };

  const req = {
    contents: [{ role: 'user', parts: [video1, text1] }],
  };

  const streamingResp = await exponentialBackoff(async () =>
    generativeModel.generateContentStream(req)
  );

  let fullText = '';

  for await (const item of streamingResp.stream) {
    if (item.candidates) {
      for (const candidate of item.candidates) {
        for (const part of candidate.content.parts) {
          fullText += part.text;
        }
      }
    }
  }

  return fullText;
}

// Function to generate JSON content with a given video file URL
export async  function generateAdInsights(originalFileUrl: string) {
  const base64Video = await fetchVideoAsBase64(originalFileUrl);

  const generativeModel = vertex_ai.preview.getGenerativeModel({
    model: model,
    generationConfig: {
      'maxOutputTokens': 8192,
      'temperature': 1,
      'topP': 0.95,
    },
    safetySettings: [
      {
        'category': 'HARM_CATEGORY_HATE_SPEECH',
        'threshold': 'BLOCK_ONLY_HIGH',
      },
      {
        'category': 'HARM_CATEGORY_DANGEROUS_CONTENT',
        'threshold': 'BLOCK_ONLY_HIGH',
      },
      {
        'category': 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        'threshold': 'BLOCK_ONLY_HIGH',
      },
      {
        'category': 'HARM_CATEGORY_HARASSMENT',
        'threshold': 'BLOCK_ONLY_HIGH',
      },
    ],
  });

  const video1 = {
    inlineData: {
      mimeType: 'video/mp4',
      data: base64Video,
    },
  };

  const text1 = {
    text: `Imagine you're an expert direct response copywriter and creative strategist reviewing a successful Facebook ad. You are trained on the attached knowledge base. You can only provide strategy based on the pdf knowledge base from Tubesciences. Generate insights focusing on two areas: success factors and areas for improvement. Share these insights in the following JSON format:
  {
    "success_factors": {
      "factor1": "",
      "factor2": "",
      "factor3": "",
      "factor4": "",
      "factor5": ""
    },
    "areas_for_improvement": {
      "area1": "",
      "area2": "",
      "area3": "",
      "area4": "",
      "area5": ""
    }
  }`,
  };

  const req = {
    contents: [{ role: 'user', parts: [video1, text1] }],
  };

  const streamingResp = await exponentialBackoff(async () =>
    generativeModel.generateContentStream(req)
  );

  let fullText = '';

  for await (const item of streamingResp.stream) {
    if (item.candidates) {
      for (const candidate of item.candidates) {
        for (const part of candidate.content.parts) {
          fullText += part.text;
        }
      }
    }
  }

  return fullText;
}