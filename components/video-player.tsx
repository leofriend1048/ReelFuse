'use client';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import Image from 'next/image';

interface VideoPlayerProps {
  src: string;
  poster: string;
  className?: string;
}

const VideoPlayer = ({ src, poster, className = '' }: VideoPlayerProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleCanPlayThrough = useCallback(() => {
    setLoading(false);
  }, []);

  const handleError = useCallback(() => {
    setError(true);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.preload = 'auto';
      
      fetch(src, {
        method: 'HEAD',
        headers: {
          'Cache-Control': 'max-age=604800',
          'Pragma': 'cache'
        }
      }).catch(console.error);
    }
  }, [src]);

  return (
    <div className={`relative ${className}`}>
      {error ? (
        <p className="text-center text-gray-500">Video failed to load.</p>
      ) : (
        <>
          <div className={`absolute top-0 left-0 w-full h-full transition-opacity duration-500 ${
            loading ? 'opacity-100' : 'opacity-0'
          }`}>
            <Image
              src={poster}
              alt="Video thumbnail"
              fill
              className={`object-cover rounded-md ${loading ? 'blur-md' : ''}`}
              priority={true}
              onLoad={() => setImageLoaded(true)}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>

          {loading && imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-t-transparent border-gray-300 rounded-full animate-spin"></div>
            </div>
          )}

          <video
            ref={videoRef}
            src={src}
            controls
            poster={poster}
            className={`max-w-full h-auto focus:outline-none rounded-md ${loading ? 'invisible' : ''}`}
            preload="metadata"
            onCanPlayThrough={handleCanPlayThrough}
            onError={handleError}
          />
        </>
      )}
    </div>
  );
};

export default VideoPlayer;