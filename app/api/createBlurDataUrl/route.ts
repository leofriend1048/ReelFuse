// app/api/createBlurDataUrl/route.ts
import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

export async function POST(req: NextRequest) {
  const { imageUrl } = await req.json();

  if (!imageUrl) {
    return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
  }

  try {
    console.log('Fetching image from:', imageUrl);
    // Fetch the image from the provided URL
    const response = await fetch(imageUrl);

    if (!response.ok) {
      console.error(`Image fetch failed with status ${response.status}`);
      return NextResponse.json({ error: `Failed to fetch image: ${response.statusText}` }, { status: response.status });
    }

    const imageBuffer = await response.arrayBuffer();

    // Convert the processed image to WebP format
    const resizedImageBuffer = await sharp(Buffer.from(imageBuffer))
      .resize(50) // Adjust dimensions as needed
      .blur(5)    // Moderate blur
      .webp({ quality: 100 }) // WebP format with reasonable quality
      .toBuffer();

    // Convert to base64 with WebP format
    const base64Image = `data:image/webp;base64,${resizedImageBuffer.toString('base64')}`;
    console.log('Generated blur data:', base64Image);

    // Return the base64 data as a JSON response
    return NextResponse.json({ base64Image });
  } catch (error) {
    console.error('Error processing image:', error);
    return NextResponse.json({ error: 'Failed to process image' }, { status: 500 });
  }
}
