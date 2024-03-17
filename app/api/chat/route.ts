import OpenAI from 'openai'
import { OpenAIStream, StreamingTextResponse } from 'ai'
import fetch from 'node-fetch'; // Ensure you have `node-fetch` available

export const runtime = 'edge'

const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY!})

export async function POST(req: Request) {
  const { messages } = await req.json();

  const openaiResponse = await openai.chat.completions.create({
    model: 'gpt-4-1106-preview',
    stream: true,
    max_tokens: 4096,
    temperature: 0.7,
    top_p: 1,
    messages: [
      {
        role: 'system',
        // Note: This has to be the same system prompt as the one
        // used in the fine-tuning dataset
        content:
          "Shooketh is an AI bot that answers in the style of Shakespeare's literary works."
      },
      ...messages
    ]
  });

  // Example logic to extract data from openaiResponse
  const extractedData = {}; // Extract data suitable for video creation

  // Prepare Creātomate POST request
  const creātomateBody = {
    template_id: "fe577f94-9404-46aa-8696-a96e6210b2c1",
    modifications: extractedData, // Use the data you extracted from OpenAI
    // Other required parameters...
  };

  const creatomateResponse = await fetch('https://api.creatomate.com/v1/renders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(creātomateBody),
  });

  if (!creatomateResponse.ok) {
    // Handle error
  }

  const creatomateData = await creatomateResponse.json();

  // Configure how you want to handle and respond with the creatomateData
  // For simplicity, this example immediately returns the OpenAIStream
  // Consider how best to handle and use the Creātomate response in your application
  const stream = OpenAIStream(openaiResponse);
  return new StreamingTextResponse(stream);
}

// Log the OpenAI response to console
console.log(OpenAIStream);