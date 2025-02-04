import MuxPlayer from '@mux/mux-player-react';

interface VideoPlayerProps {
  playbackId: string;
  placeholder?: string;
}

export default function VideoPlayer({ playbackId, placeholder }: VideoPlayerProps) {
  return (
    <div className="relative w-full" style={{ aspectRatio: '9/16' }}>
      <MuxPlayer
        className="absolute inset-0 w-full h-full"
        streamType="on-demand"
        playbackId={playbackId}
        placeholder={placeholder}
        poster={`https://image.mux.com/${playbackId}/thumbnail.webp?width=384&time=1`}
        primary-color="#ffffff"
        secondary-color="#000000"
        accent-color="#2b88ff"
      />
    </div>
  );
}