import React from 'react';
import { Card } from "@/components/ui/card";
import { Check } from 'lucide-react';
import VideoThumbnail from '@/components/video-thumbnail';
import { Skeleton } from '@/components/ui/skeleton';

interface Video {
  video_url: string;
  poster_url: string;
  duration: string;
  mux_playback_id: string;
  blur_data_url: string;
}

interface VideoGridProps {
  videos: Video[];
  onVideoClick: (index: number) => void;
  selectedVideos: Set<string>;
  onVideoSelect: (videoUrl: string, index: number, isShiftKey: boolean) => void;
  isSelectionMode: boolean;
  onCopyLink: (videoUrl: string, e: React.MouseEvent) => void;
  isLoading: boolean;
}

export const VideoGrid: React.FC<VideoGridProps> = React.memo(function VideoGrid({
  videos,
  onVideoClick,
  selectedVideos,
  onVideoSelect,
  isSelectionMode,
  onCopyLink,
  isLoading
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 w-full">
        {[...Array(14)].map((_, i) => (
          <div key={i} className="relative pb-[177.77%]">
            <Card className="absolute inset-0 overflow-hidden">
              <VideoSkeleton />
            </Card>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 w-full">
      {videos.map((video, index) => (
        <VideoCard
          key={video.video_url}
          video={video}
          index={index}
          onClick={() => onVideoClick(index)}
          isSelected={selectedVideos.has(video.video_url)}
          onSelect={(isShiftKey) => onVideoSelect(video.video_url, index, isShiftKey)}
          isSelectionMode={isSelectionMode}
          onCopyLink={(e) => onCopyLink(video.video_url, e)}
        />
      ))}
    </div>
  );
});

const VideoCard: React.FC<{
  video: Video;
  index: number;
  onClick: () => void;
  isSelected: boolean;
  onSelect: (isShiftKey: boolean) => void;
  isSelectionMode: boolean;
  onCopyLink: (e: React.MouseEvent) => void;
}> = React.memo(function VideoCard({
  video,
  onClick,
  isSelected,
  onSelect,
  isSelectionMode,
  onCopyLink
}) {
  const [isImageLoading, setIsImageLoading] = React.useState(true);

  const handleClick = (e: React.MouseEvent) => {
    if (isSelectionMode) {
      e.preventDefault();
      onSelect(e.shiftKey);
    } else {
      onClick();
    }
  };

  return (
    <div className="relative pb-[177.77%]">
      <Card
        className={`absolute inset-0 overflow-hidden transition-all duration-200 cursor-pointer hover:shadow-lg group ${
          isSelected ? 'ring-2 ring-primary' : ''
        }`}
        onClick={handleClick}
      >
        {isSelectionMode && (
          <div 
            className={`absolute top-2 right-2 z-10 w-5 h-5 rounded-full border-2 
              ${isSelected ? 'bg-primary border-primary' : 'bg-white border-gray-300'}
              flex items-center justify-center transition-all duration-200`}
          >
            {isSelected && <Check className="w-3 h-3 text-white" />}
          </div>
        )}
        <div className="absolute inset-0 w-full h-full">
          {isImageLoading && (
            <div className="absolute inset-0">
              <VideoSkeleton />
            </div>
          )}
          <div className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${isImageLoading ? 'opacity-0' : 'opacity-100'}`}>
            <VideoThumbnail
              videoUrl={video.video_url}
              posterUrl={video.poster_url}
              duration={video.duration}
              playbackId={video.mux_playback_id}
              onLoad={() => setIsImageLoading(false)}
            />
          </div>
        </div>
      </Card>
    </div>
  );
});

const VideoSkeleton = () => (
  <Skeleton className="absolute inset-0 w-full h-full" />
);

export default VideoGrid;