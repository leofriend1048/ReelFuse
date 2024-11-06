let serve, inngest, videoIteration, videoLibraryProcessing;

if (process.env.NODE_ENV !== "production") {
  serve = require("inngest/next").serve;
  inngest = require("@/src/inngest/client").inngest;
  videoIteration = require("@/src/inngest/functions").videoIteration;
  videoLibraryProcessing = require("@/src/inngest/functions").videoLibraryProcessing;
}

export const { GET, POST, PUT } = process.env.NODE_ENV === "production"
  ? { GET: () => {}, POST: () => {}, PUT: () => {} } // No-op in production
  : serve({
      client: inngest,
      functions: [videoIteration, videoLibraryProcessing],
    });
