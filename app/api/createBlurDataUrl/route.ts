// app/api/createBlurDataUrl/route.ts
import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

export async function POST(req: NextRequest) {
  const { imageUrl } = await req.json();

  if (!imageUrl) {
    console.error('Image URL is missing in the request body');
    return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
  }

  try {
    console.log('Fetching image from:', imageUrl);
    // Fetch the image from the provided URL
    const response = await fetch(imageUrl);

    if (!response.ok) {
      console.error(`Image fetch failed with status ${response.status} for URL: ${imageUrl}`);
      return NextResponse.json({ error: `Failed to fetch image: ${response.statusText}` }, { status: response.status });
    }

    const imageBuffer = await response.arrayBuffer();

    // Convert the processed image to WebP format
    let resizedImageBuffer;
    try {
      resizedImageBuffer = await sharp(Buffer.from(imageBuffer))
        .resize(50) // Adjust dimensions as needed
        .blur(2)    // Slightly less blur
        .webp({ quality: 100 }) // WebP format with reasonable quality
        .toBuffer();
    } catch (sharpError) {
      console.error(`Error during image processing for URL: ${imageUrl}`, sharpError);
      return NextResponse.json({ error: 'Failed to process image' }, { status: 500 });
    }

    // Convert to base64 with WebP format
    const base64Image = `data:image/webp;base64,${resizedImageBuffer.toString('base64')}`;
    console.log('Generated blur data for URL:', imageUrl);

    // Return the base64 data as a JSON response
    return NextResponse.json({ base64Image });
  } catch (error) {
    console.error('Unexpected error processing image for URL:', imageUrl, error);
    return NextResponse.json({ error: 'Failed to process image' }, { status: 500 });
  }
}
