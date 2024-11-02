'use client';
import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';

interface VideoThumbnailProps {
  videoUrl: string;
  posterUrl: string;
  duration: string;
  blurDataURL?: string;
  onLoad?: () => void;
}

const VideoThumbnail = ({ videoUrl, posterUrl, duration, blurDataURL, onLoad }: VideoThumbnailProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);

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

  return (
    <div ref={imageRef} className="relative">
      <div className="relative w-[200px] h-[356px]">
        <Image
          src={posterUrl}
          alt="Video thumbnail"
          fill={true}
          className="object-cover rounded-md"
          sizes="200px"
          quality={100}
          priority={isVisible}
          onLoad={onLoad}
          placeholder={blurDataURL ? "blur" : "empty"}
          blurDataURL={blurDataURL}
        />
      </div>
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