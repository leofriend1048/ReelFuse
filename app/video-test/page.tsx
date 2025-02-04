"use client"
import { Suspense } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Skeleton } from '@/components/ui/skeleton'

export default function Page() {
  return (
    <div>
    <Suspense fallback={<Skeleton className="w-[337.5px] h-[600px]" />}>
      <VideoComponent />
    </Suspense>
    </div>
  )
}

async function VideoComponent() {
  const supabase = createClient();
  let videoUrl = '';
  let posterUrl = '';

  try {
    let { data, error } = await supabase
      .from('modular_clips')
      .select('video_url, poster_url')
      .limit(1)
      .single();
  
    if (error) throw error;
  
    // Add a check to ensure data is not null
    if (data) {
      videoUrl = data.video_url;
      posterUrl = data.poster_url;
    } else {
      // Handle the case where data is null
      console.error('No data available');
    }
  } catch (error) {
    console.error('Error fetching video URL:', error);
  }

  return (
    <div className="h-[600px] w-[337.5px]">
      <video controls preload="auto" aria-label="Video player" poster={posterUrl} className="h-full w-auto">
        <source src={videoUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  )
}