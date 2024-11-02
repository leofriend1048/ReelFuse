import React from 'react';
import { captionVideo } from '@/lib/ffmepg';
import { Button } from '@/components/ui/button'; 

const HomePage = async ({ searchParams }: { searchParams: { concatenatedHookVisual1?: string } }) => {
  const concatenatedHookVisual1 = searchParams?.concatenatedHookVisual1 || '';
  let captionedVideoUrl = '';
  let loading = false;

  if (concatenatedHookVisual1) {
    loading = true;
    try {
      captionedVideoUrl = await captionVideo(concatenatedHookVisual1);
    } catch (error) {
      console.error('Error captioning video:', error);
    } finally {
      loading = false;
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md p-4">
        <h1 className="text-center text-2xl font-bold mb-4">Video Captioning</h1>
        <form method="get" className="flex flex-col items-center">
          <input
            type="text"
            name="concatenatedHookVisual1"
            placeholder="Enter video URL"
            defaultValue={concatenatedHookVisual1}
            className="mb-4 p-2 border border-gray-300 rounded w-full"
          />
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Loading...' : 'Submit'}
          </Button>
        </form>
        {captionedVideoUrl && (
          <div className="mt-8">
            <h2 className="text-center text-xl font-semibold mb-4">Captioned Video</h2>
            <div className="flex justify-center">
              <video
                src={captionedVideoUrl}
                controls
                className="max-h-[80vh] w-auto"
              ></video>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
