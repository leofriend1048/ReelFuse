import { experimental_AssistantResponse } from 'ai';
import OpenAI from 'openai';
import { createServerClient, type CookieOptions, serialize } from '@supabase/ssr';



// Create an OpenAI API client (that's edge friendly!)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// IMPORTANT! Set the runtime to edge
export const runtime = 'edge';

const homeTemperatures = {
  bedroom: 20,
  'home office': 21,
  'living room': 21,
  kitchen: 22,
  bathroom: 23,
};

export async function POST(req: Request) {
  // Supabase SSR Client Setup
  const supabase = createServerClient(
    process.env.SUPABASE_URL || 'https://uwfllbptpdqoovbeizya.supabase.co',
    process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3ZmxsYnB0cGRxb292YmVpenlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTk3NTA2NzUsImV4cCI6MjAxNTMyNjY3NX0._fCp3gc4vEDj9k5jme3Jo_cSA3tPhzOPcodcH3Gb65w',
    {
      cookies: {
        get(name: string) {
          const cookie = req.headers.get('cookie') || '';
          const cookies = Object.fromEntries(cookie.split('; ').map(c => c.split('=')));
          return cookies[name];
        },
        set(name: string, value: string, options: CookieOptions) {
          // Since Response object from Fetch API doesn't directly expose setHeader, 
          // you need to handle cookie serialization differently.
          // This might need a custom implementation based on your server setup or using Headers API.
        },
        remove(name: string, options: CookieOptions) {
          // Similar to the set method, handle removal of cookies as per your server or edge function setup.
        },
      },
    }
  );


  // Parse the request body
  const input: {
    threadId: string | null;
    message: string;
  } = await req.json();

  // Create a thread if needed
  const threadId = input.threadId ?? (await openai.beta.threads.create({})).id;

  // Add a message to the thread
  const createdMessage = await openai.beta.threads.messages.create(threadId, {
    role: 'user',
    content: input.message,
  });

  return experimental_AssistantResponse(
    { threadId, messageId: createdMessage.id },
    async ({ threadId, sendMessage, sendDataMessage }) => {
      // Run the assistant on the thread
      const run = await openai.beta.threads.runs.create(threadId, {
        assistant_id: process.env.ASSISTANT_ID ?? (() => {
          throw new Error('ASSISTANT_ID is not set');
        })(),
      });

      let fact1 = ""; // Initialize variable to store fact1
      let hookbackground = ""; //


      async function waitForRun(run: OpenAI.Beta.Threads.Runs.Run) {
        // Poll for status change
        while (run.status === 'queued' || run.status === 'in_progress') {
          // delay for 500ms:
          await new Promise(resolve => setTimeout(resolve, 500));

          run = await openai.beta.threads.runs.retrieve(threadId!, run.id);
        }

        // Check the run status
        if (run.status === 'cancelled' || run.status === 'cancelling' || run.status === 'failed' || run.status === 'expired') {
          throw new Error(run.status);
        }

        if (run.status === 'requires_action') {
          // Handle required actions here
        }
      }

      await waitForRun(run);

      // Get new thread messages (after our message)
      const responseMessages = (await openai.beta.threads.messages.list(threadId, {
        after: createdMessage.id,
        order: 'asc',
      })).data;

      // Send the messages and process for fact1
      for (const message of responseMessages) {
        const textContents = message.content.filter(content => content.type === 'text');
        textContents.forEach((textContent) => {
          if (textContent.text && typeof textContent.text === 'object' && 'value' in textContent.text) {
            try {
                const parsedJson = JSON.parse(textContent.text.value);

                if (parsedJson["hook script copy"]) {
                    fact1 = parsedJson["hook script copy"]; // Assume this is where you get fact1
                }
                if (parsedJson["hook video url"]) {
                  hookbackground = parsedJson["hook video url"]; // Assume this is where you get hookbackground
              }
                
            } catch (error) {
                console.error("Error parsing JSON from text content:", error.message);
            }
          }
        });

        sendMessage({
          id: message.id,
          role: 'assistant',
          content: message.content.filter(
            content => content.type === 'text',
          ),
        });
      }

      // Creatomate API call
      if (fact1) {
        const creatomateResponse = await fetch('https://api.creatomate.com/v1/renders', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer e7e048b7cb334b74b692dc481aca9ba1570289eb936bd24e07ee3608a423fecaaf4679f7d4c879069f777fa6d872e662', // Replace with your token
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            "template_id": "fe577f94-9404-46aa-8696-a96e6210b2c1",
            "modifications": {
              "Music": "https://creatomate.com/files/assets/b5dc815e-dcc9-4c62-9405-f94913936bf5",
              "Hook-Background": hookbackground,
              "Hook-1": fact1,
              "Background-2": "https://creatomate.com/files/assets/4a6f6b28-bb42-4987-8eca-7ee36b347ee7",
              "Fact-2": "Use any video automation tool to replace these text and background assets with your own! 😊",
              "Background-3": "https://creatomate.com/files/assets/4f6963a5-7286-450b-bc64-f87a3a1d8964",
              "Fact-3": "Learn how to get started on the Guides & Tutorials page on Creatomate's home page.",
              "Background-4": "https://creatomate.com/files/assets/36899eae-a128-43e6-9e97-f2076f54ea18",
              "Fact-4": "Use the template editor to completely customize this video to meet your own needs. 🚀"
            }
          }),
        });

        const creatomateData = await creatomateResponse.json();
        console.log("Creatomate POST Response:", creatomateData);
        

        if (creatomateData && creatomateData.id) {
          const renderId = creatomateData.id;
          console.log("Render ID:", renderId); // This line logs the renderId to the console
          
        
          let poll = true;

          while (poll) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // Poll every 2 seconds

            const getStatusResponse = await fetch(`https://api.creatomate.com/v1/renders/${renderId}`, {
              method: 'GET',
              headers: {
                'Authorization': 'Bearer e7e048b7cb334b74b692dc481aca9ba1570289eb936bd24e07ee3608a423fecaaf4679f7d4c879069f777fa6d872e662', // Use the same API key
              },
            });

            const statusData = await getStatusResponse.json();
            console.log("Creatomate GET Response:", statusData);

            if (statusData.status === 'completed' || statusData.status === 'failed') {
              poll = false; // Stop polling if the render is completed or failed
              // You can handle the completed or failed status accordingly
            }
          }
          
          
          const { data, error } = await supabase
.from('rendered_videos')
.insert([
  { hook_1: fact1, hook_background: hookbackground },
])
.select()
          
        


    if (error) {
      console.log('Error inserting data into Supabase:', error.message);
      console.log("Data:", data);
console.error("Error:", error);
    } else {
      console.log('Inserted data:', data);
    }
        }
      }
    },
  );
}
