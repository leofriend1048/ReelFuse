"use client";

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { captionVideo } from '@/lib/ffmepg';

const HomePage = ({ searchParams }: { searchParams: { concatenatedHookVisual1?: string } }) => {
  const [concatenatedHookVisual1, setConcatenatedHookVisual1] = useState(searchParams?.concatenatedHookVisual1 || '');
  const [captionedVideoUrl, setCaptionedVideoUrl] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCaptionedVideo = async () => {
      if (concatenatedHookVisual1) {
        setLoading(true);
        try {
          const result = await captionVideo(concatenatedHookVisual1);
          setCaptionedVideoUrl(result);
        } catch (error) {
          console.error('Error captioning video:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchCaptionedVideo();
  }, [concatenatedHookVisual1]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const input = form.elements.namedItem("concatenatedHookVisual1") as HTMLInputElement;
    setConcatenatedHookVisual1(input.value);
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md p-4">
        <h1 className="text-center text-2xl font-bold mb-4">Video Captioning</h1>
        <form onSubmit={handleSubmit} className="flex flex-col items-center">
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
