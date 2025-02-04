'use client';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import Image from 'next/image';

interface VideoThumbnailProps {
  videoUrl: string;
  posterUrl: string;
  duration: string;
  blurDataURL?: string;
  onLoad?: () => void;
  playbackId: string;
}

const VideoThumbnail = ({ videoUrl, posterUrl, duration, blurDataURL, onLoad, playbackId }: VideoThumbnailProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [scrubPosition, setScrubPosition] = useState(0);
  const [currentTime, setCurrentTime] = useState(1);
  const imageRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const preloadedImages = useRef<Map<number, string>>(new Map());
  
  const durationInSeconds = duration.split(':').reduce((acc, time) => (60 * acc) + parseInt(time), 0);

  // Preload images for smoother scrubbing
  const preloadImages = useCallback(() => {
    const numImages = 10; // Number of images to preload
    const interval = Math.max(1, Math.floor(durationInSeconds / numImages));
    
    for (let time = 1; time <= durationInSeconds; time += interval) {
      const url = `https://image.mux.com/${playbackId}/thumbnail.webp?time=${time}`;
      preloadedImages.current.set(time, url);
      const img = new window.Image();
      img.src = url;
    }
  }, [playbackId, durationInSeconds]);

  useEffect(() => {
    if (isHovering) {
      preloadImages();
    }
  }, [isHovering, preloadImages]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (imageRef.current) {
      observer.observe(imageRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => setIsHovering(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.min(Math.max(x / rect.width, 0), 1);
    
    setScrubPosition(x);

    // Debounce the time update to prevent too many image loads
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setCurrentTime(Math.max(1, Math.round(percentage * durationInSeconds)));
    }, 50);
  };

  // Find the closest preloaded image time
  const getClosestPreloadedTime = (time: number) => {
    const times = Array.from(preloadedImages.current.keys());
    return times.reduce((prev, curr) => 
      Math.abs(curr - time) < Math.abs(prev - time) ? curr : prev
    );
  };

  // Get the thumbnail URL, preferring preloaded images when available
  const getThumbnailUrl = () => {
    if (!isHovering) return posterUrl;
    
    if (preloadedImages.current.size > 0) {
      const closestTime = getClosestPreloadedTime(currentTime);
      return preloadedImages.current.get(closestTime) || 
        `https://image.mux.com/${playbackId}/thumbnail.webp?time=${currentTime}`;
    }
    
    return `https://image.mux.com/${playbackId}/thumbnail.webp?time=${currentTime}`;
  };

  return (
    <div 
      ref={imageRef} 
      className="relative w-full h-full" 
      onMouseEnter={handleMouseEnter} 
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
    >
      <div className="relative w-full h-full">
        <div className="absolute inset-0">
          <Image
            src={getThumbnailUrl()}
            alt="Video thumbnail"
            fill
            className="object-cover rounded-lg"
            quality={20}
            priority={isVisible}
            onLoad={onLoad}
            placeholder={blurDataURL ? "blur" : "empty"}
            blurDataURL={blurDataURL}
            unoptimized={isHovering}
          />
        </div>
      </div>
      {isHovering && (
        <>
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-red-500"
            style={{ 
              left: `${scrubPosition}px`,
              transform: 'translateX(-50%)',
            }}
          />
          <div 
            className="absolute bottom-2 left-0 right-0 h-1 bg-black bg-opacity-50"
          >
            <div 
              className="absolute h-full bg-red-500"
              style={{
                width: `${(currentTime / durationInSeconds) * 100}%`
              }}
            />
          </div>
        </>
      )}
      <div className="absolute top-2 left-2 flex items-center space-x-2 bg-black bg-opacity-80 text-white rounded-full px-3 py-1">
        <svg aria-hidden="true" viewBox="0 0 18 14" className="h-4 w-4" fill="#ffffff">
          <path d="M15.5987 6.2911L3.45577 0.110898C2.83667 -0.204202 2.06287 0.189698 2.06287 0.819798V13.1802C2.06287 13.8103 2.83667 14.2042 3.45577 13.8891L15.5987 7.7089C16.2178 7.3938 16.2178 6.6061 15.5987 6.2911Z" />
        </svg>
        <span className="text-sm">{duration || '0:00'}</span>
      </div>
    </div>
  );
};

export default VideoThumbnail;