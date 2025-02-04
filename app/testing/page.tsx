"use client";
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const VideoProcessor = () => {
  const [videoUrl1, setVideoUrl1] = useState('');
  const [videoUrl2, setVideoUrl2] = useState('');
  const [outputUrl, setOutputUrl] = useState('');

  const handleSubmit = async () => {
    const response = await fetch('/api/rendervideo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoUrl1, videoUrl2 }),
    });

    if (!response.ok) {
      console.error('Failed to process videos');
      return;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    setOutputUrl(url);
  };

  return (
    <div className="flex h-screen items-center justify-center">
      <Card>
        <CardContent className="flex flex-col items-center space-y-4 pt-8">
          <h1 className="text-lg font-semibold">Concatenate Videos</h1>
          <Input
            type="text"
            placeholder="Video URL 1"
            value={videoUrl1}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVideoUrl1(e.target.value)}
            className="focus:outline-none"
          />
          <Input
            type="text"
            placeholder="Video URL 2"
            value={videoUrl2}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVideoUrl2(e.target.value)}
            className="focus:outline-none"
          />
          <Button onClick={handleSubmit} className="focus:outline-none">Process Videos</Button>
          {outputUrl && (
            <video src={outputUrl} controls className="mt-4 focus:outline-none"></video>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VideoProcessor;
