import { NextResponse } from 'next/server'

export async function POST(request: Request) {
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

    const CONVERSION_SERVICE_URL = 'https://us-central1-reel-fuse.cloudfunctions.net/ConvertToMP4'
    
    // Create a new TransformStream for server-sent events
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Start the conversion process in the background
    (async () => {
      try {
        const response = await fetch(CONVERSION_SERVICE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ videoUrl: videoUrl.trim() }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Conversion failed: ${errorText}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body available');
        }

        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              break;
            }
            
            // Forward the chunks directly
            await writer.write(value);
          }
        } finally {
          reader.releaseLock();
          await writer.close();
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Conversion failed';
        const errorEvent = `data: ${JSON.stringify({ error: errorMessage })}\n\n`;
        await writer.write(new TextEncoder().encode(errorEvent));
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
export const maxDuration = 10;