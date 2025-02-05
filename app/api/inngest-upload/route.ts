// app/api/inngest-upload/route.ts
import { inngest } from "@/src/inngest/client";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { publicURL, duration, brand } = body;

    await inngest.send({
      name: "upload/video.received",
      data: {
        publicURL,
        duration,
        brand,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error triggering Inngest event:", error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
