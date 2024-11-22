'use server'
const { VertexAI } = require('@google-cloud/vertexai');
const fetch = (...args: any[]) => import('node-fetch').then(({ default: fetch }) => fetch(...args as [any]));
import { compressVideoAndReturnBase64 } from './ffmepg';
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

// Function to generate content with a given video file URL
export async function googleDescriptionVisuals(publicURL: string) {
  console.log(`googleDescriptionVisuals: Requesting video compression for URL: ${publicURL}`);

  // Make a POST request to the compression endpoint
  const compressionResponse = await fetch('https://us-central1-reel-fuse.cloudfunctions.net/compressVideoAndReturnBase64', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ publicURL }),
  });

  if (!compressionResponse.ok) {
    throw new Error(`Failed to compress video: ${compressionResponse.statusText}`);
  }

  const { compressedVideoUrl } = await compressionResponse.json();
  console.log(`googleDescriptionVisuals: Received compressed video URL: ${compressedVideoUrl}`);

  // Fetch the compressed video and convert it to base64
  const base64Video = await fetchVideoAsBase64(compressedVideoUrl);
  console.log(`googleDescriptionVisuals: Compressed video fetched and converted to base64`);

  console.log(`googleDescriptionVisuals: Instantiating generative model with model name: ${model}`);
  // Instantiate the models
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
      }
    ],
  });
  console.log(`googleDescriptionVisuals: Generative model instantiated`);

  const video1 = {
    inlineData: {
      mimeType: 'video/webm',
      data: base64Video,
    },
  };
  console.log(`googleDescriptionVisuals: Prepared video data for model input`);

  const text1 = {
    text: `Review the following video and provide a highly detailed description of both the spoken words (if any) and the visuals. This description will be used for vector similarity search, so it must be as thorough as possible, highlighting both major and minor elements of the video.

1. Spoken Word Description (If Applicable):
Transcribe any spoken dialogue, narration, or text visible in the video as accurately as possible.
If a specific tone, emotion, or emphasis is used in the speech, describe that as well. For example, note if the speaker is using a calm, excited, or persuasive tone.
Specify the context of each spoken line: Who is speaking? To whom are they speaking? What is the speaker trying to convey? What is the emotional or informational weight of the spoken content?
Identify any background sounds (music, ambient noises, effects) that may set a mood or add context.
If captions, subtitles, or on-screen text appear, transcribe these and describe their relevance.
2. Visual Description:
Scene-by-Scene Breakdown: Divide the video into distinct scenes or shots and describe each segment separately. Provide the timestamp for each section if possible.

a. Setting/Background: Describe where the scene takes place. Is it indoors or outdoors? Note the setting's location (e.g., a living room, beach, city street) and describe any objects, architecture, or significant features. Mention lighting conditions, time of day, and weather if outdoors.

b. Characters/Subjects: Identify all visible characters or subjects. Describe their appearance (e.g., age, gender, clothing, physical features), actions, and movements in detail. If the characters show facial expressions or body language, explain what those cues might indicate about their emotions or intentions.

c. Camera Work and Visual Style: Describe any noticeable camera movements, angles, or zooms. Is the camera stationary, panning, or focusing on a particular subject? Are there any stylistic effects such as slow motion, color grading, or visual filters?

d. Actions/Events: Explain what is happening in the scene. Are there specific actions being performed by the characters or subjects (e.g., walking, talking, interacting with objects)? Describe the sequence of actions in detail, no matter how small.

e. Notable Visual Elements: Highlight any symbols, objects, or elements in the environment that might have thematic or narrative significance. For example, is there a particular product being used, a recurring object, or anything visually striking (e.g., a unique landscape, artwork, or unusual clothing)?

f. Text on Screen: If any text appears on the screen (e.g., titles, labels, instructions), describe its placement, color, size, and content. Explain how the text interacts with the visuals or contributes to the video's message.

3. Contextual and Sensory Descriptions:
Provide any contextual insights about the video based on the visuals and dialogue. For example, does it appear to be an instructional video, an advertisement, or a narrative scene?
Mention any sensory details that the visuals or audio evoke (e.g., the warmth of sunlight, the sound of a crowd, the texture of a surface being touched).
If the video contains product demonstrations, detail how the product is shown, how it functions, and any benefits or features described either visually or verbally.
4. Overall Summary:
After breaking down the individual elements, provide a comprehensive summary that ties together the spoken words, visuals, and any overarching themes or messages the video aims to convey.
Emphasize both the obvious and subtle elements, ensuring nothing is overlooked.`,
  };

  console.log("googleDescriptionVisuals: Creating request object for content generation");
  const req = {
    contents: [{ role: 'user', parts: [video1, text1] }],
  };
  console.log(`googleDescriptionVisuals: Request object created with contents:`, req.contents);

  console.log("googleDescriptionVisuals: Calling generativeModel.generateContentStream with exponential backoff");
  const streamingResp = await exponentialBackoff(async () =>
    generativeModel.generateContentStream(req)
  );
  console.log("googleDescriptionVisuals: Content stream received");

  let fullText = '';
  console.log("googleDescriptionVisuals: Starting to process content stream");

  for await (const item of streamingResp.stream) {
    console.log("googleDescriptionVisuals: Processing stream item", item);
    if (item.candidates) {
      for (const candidate of item.candidates) {
        console.log("googleDescriptionVisuals: Processing candidate", candidate);
        for (const part of candidate.content.parts) {
          console.log("googleDescriptionVisuals: Appending text part to fullText");
          fullText += part.text;
        }
      }
    }
  }

  console.log("googleDescriptionVisuals: Content stream processing complete. Full text length:", fullText.length);
  return fullText;
}

// Improved googleTimestampProcessing function
export async function googleTimestampProcessing(publicURL: string): Promise<{ timestamps: { start: string; end: string }[] }> {
  console.log('googleTimestampProcessing: Starting processing for URL:', publicURL);
  try {
    console.log('googleTimestampProcessing: Compressing video and converting to base64.');
    const base64Video = await compressVideoAndReturnBase64(publicURL);
    console.log('googleTimestampProcessing: Video compressed and converted to base64. Base64 length:', base64Video.length);

    console.log('googleTimestampProcessing: Instantiating generative model.');
    const generativeModel = vertex_ai.preview.getGenerativeModel({
      model: model,
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.2,
        topP: 0.95,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
      ],
    });

    const video1 = {
      inlineData: {
        mimeType: 'video/webm',
        data: base64Video,
      },
    };

    const text1 = {
      text: `Imagine you're a creative strategist reviewing a video from a UGC creator. The video includes multiple scenes you'd like to add to your arsenal, each stored as its own file. As you review the video, identify and extract each complete, standalone scene that could be useful in future campaigns. When choosing scenes, ensure they feel natural and uncut, particularly avoiding interruptions to people speaking. The goal is to have complete, cohesive clips. If there are very similar scenes in a video (e.g., someone saying the same thing twice), then select the highest-quality version. For each chosen scene, provide precise start and end timestamps in "hh:mm:ss.mmm" format (including milliseconds), starting the timestamp 2-3 seconds before the scene begins and ending it 2-3 seconds after the scene finishes. This padding helps avoid cutting off important moments.

Return the result in the following JSON format:

{
  "timestamps": [
    { "start": "hh:mm:ss.mmm", "end": "hh:mm:ss.mmm" },
    { "start": "hh:mm:ss.mmm", "end": "hh:mm:ss.mmm" },
    // ... additional scenes
  ]
}

Guidelines:
1. A scene change occurs when there is a significant shift in content, such as a change in location, characters, actions, or camera angles.
2. Identify as many distinct scenes as possible.
3. Ensure that each scene is cohesive and not cut off mid-action or mid-sentence.
4. The start and end times should be accurate to the millisecond for precise cutting.
5. Do not include overlapping scenes; each scene should follow the previous one without gaps.
6. If the video consists of a single continuous scene without significant changes, return the start and end of the entire video.
7. Pay special attention to speech patterns and ensure cuts happen during natural pauses.

Provide ONLY the JSON output, with no additional text or explanations.`,
    };

    const req = {
      contents: [{ role: 'user', parts: [video1, text1] }],
    };

    console.log('googleTimestampProcessing: Calling generateContentStream with exponential backoff');
    const streamingResp = await exponentialBackoff(async () => {
      const stream = await generativeModel.generateContentStream(req);
      return stream;
    });

    console.log('googleTimestampProcessing: Content stream received. Processing response.');
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

    console.log('googleTimestampProcessing: Finished processing content stream. Full text length:', fullText.length);

    // Clean up and parse the response
    fullText = fullText.replace(/```json/g, '').replace(/```/g, '').trim();
    console.log('Cleaned up text:', fullText);

    try {
      const parsedResponse = JSON.parse(fullText);

      if (parsedResponse && Array.isArray(parsedResponse.timestamps)) {
        console.log('Successfully parsed JSON timestamps:', JSON.stringify(parsedResponse.timestamps, null, 2));
        return parsedResponse;
      } else {
        throw new Error('Invalid timestamps structure.');
      }
    } catch (error) {
      console.error('Error parsing JSON:', error);
      console.error('AI response received:', fullText);
      throw new Error(`Invalid JSON format: ${error instanceof Error ? error.message : error}`);
    }
  } catch (error) {
    console.error('Error during processing:', error);
    if ((error as AxiosError).response && (error as AxiosError).response!.data) {
      console.error('API Error Details:', JSON.stringify((error as AxiosError).response!.data, null, 2));
    }
    return { timestamps: [] };
  }
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