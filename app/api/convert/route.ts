import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const encoder = new TextEncoder();

  try {
    // Safely parse the request body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Validate videoUrl
    const { videoUrl } = body;
    if (!videoUrl || typeof videoUrl !== 'string') {
      return NextResponse.json(
        { error: 'videoUrl is required and must be a string' },
        { status: 400 }
      );
    }

    const CONVERSION_SERVICE_URL = 'https://us-central1-reel-fuse.cloudfunctions.net/ConvertToMP4';
    
    // Create a new TransformStream for server-sent events
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Start the conversion process in the background
    (async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 600000); // 10 minute timeout

        const response = await fetch(CONVERSION_SERVICE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ videoUrl: videoUrl.trim() }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Conversion failed: ${errorText}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body available');
        }

        try {
          let buffer = '';
          const decoder = new TextDecoder();

          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              // Process any remaining data in buffer before ending
              if (buffer.trim()) {
                await writer.write(encoder.encode(buffer + '\n\n'));
              }
              break;
            }

            // Decode the chunk and add it to our buffer
            buffer += decoder.decode(value, { stream: true });

            // Process complete messages
            let messages = buffer.split('\n\n');
            
            // Keep the last incomplete message in the buffer
            buffer = messages.pop() || '';

            // Forward complete messages
            for (const message of messages) {
              if (message.trim()) {
                try {
                  // Parse the message to check if it's the completion message
                  const data = JSON.parse(message.slice(5)); // Remove 'data: ' prefix
                  if (data.status === 'Complete' && data.url) {
                    // Ensure the completion message is sent
                    await writer.write(encoder.encode(message + '\n\n'));
                    // Close the writer after sending the completion message
                    await writer.close();
                    return;
                  }
                } catch (e) {
                  console.error('Error parsing message:', e);
                }
                await writer.write(encoder.encode(message + '\n\n'));
              }
            }
          }

          // If we reach here without finding a completion message, close the writer
          await writer.close();
        } finally {
          reader.releaseLock();
        }
      } catch (error) {
        console.error('Conversion error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Conversion failed';
        const errorEvent = `data: ${JSON.stringify({ error: errorMessage })}\n\n`;
        await writer.write(encoder.encode(errorEvent));
        await writer.close();
      }
    })();

    // Return the streaming response immediately
    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in conversion:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Video conversion failed' },
      { status: 500 }
    );
  }
}

// This is just for the initial response - the actual conversion continues in the background
export const maxDuration = 60;