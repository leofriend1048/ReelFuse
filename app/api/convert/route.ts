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

      // Create a readable stream from the response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body available');
      }

      // Create a new stream for the client
      const stream = new ReadableStream({
        async start(controller) {
          try {
            while (true) {
              const { done, value } = await reader.read();
              
              if (done) {
                break;
              }
              
              // Forward the chunks directly
              controller.enqueue(value);
            }
          } catch (error) {
            controller.error(error);
          } finally {
            controller.close();
            reader.releaseLock();
          }
        }
      });

      // Return the streaming response
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Conversion failed' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in conversion:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Video conversion failed' },
      { status: 500 }
    );
  }
}

export const maxDuration = 300 // 5 minutes
