import { serve } from "inngest/next";
import { inngest } from "@/src/inngest/client";
import { videoLibraryProcessing } from "@/src/inngest/functions";

export const runtime = 'edge' 

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    videoLibraryProcessing,
  ],
  streaming: "allow",
});