import { serve } from "inngest/next";
import { inngest } from "@/src/inngest";
import { videoIteration } from "@/src/functions";
import { videoLibraryProcessing } from "@/src/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    videoIteration,
    videoLibraryProcessing,
  ],
});