'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@/utils/supabase/client';
import Navbar from '@/components/navbar';
import { ShareBrief } from '@/components/sharebrief';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { buttonVariants } from "@/components/ui/button"
import Link from 'next/link';
import { Skeleton } from "@/components/ui/skeleton"



// Assuming params is received correctly; otherwise, use useRouter to obtain params
export default function Page({ params }: { params: { id: string } }) {
    const [videos, setVideos] = useState<any[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const supabase = createClient();

    useEffect(() => {
        const getData = async () => {
          const { data, error } = await supabase
              .from('rendered_videos')
              .select('rendered_video, hook_1, hook_background, problem_background, problem_1')
              .eq('video_id', params.id);
          if (error) {
              setError(error.message);
          } else {
              setVideos(data);
          }
        };
        getData();
    }, [params.id]);

    if (error) return <div>Error: {error}</div>;


    return     <main className="flex min-h flex-col items-center p-20 flex flex-col space-y-10">
        <Navbar />
    {videos === null ? (
        <div className="flex flex-col space-y-3">
      <Skeleton className="h-[400px] w-[270px] rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </div>
        
    ) : (
        <>
            <pre>{JSON.stringify(videos, null, 2)}</pre>
            
            <Card
      key="1"
      className="rounded-lg shadow-lg max-w-sm mx-auto hover:shadow-xl transition-all duration-200 min-w-80"
    >
                    {videos.map((video, index) => (
                        <div className="object-cover w-full" key={index}>
                            <video width="100%" height="auto" controls preload="auto">
                                <source src={video.rendered_video} type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    ))}
                
      
      <CardContent className="p-4">
       
        <div className="flex mt-4 space-x-2">
          <ShareBrief />
          

          {videos.map((video, index) => (
            <div key={index}>
            <Link href={video.rendered_video} className={buttonVariants({ variant: "outline" })}>Download</Link>
            </div> ))}
         
                
        </div>

      </CardContent>
    </Card>



           
        </>
    )}
    
        <div className="flex flex-row	gap-4 p-4 md:gap-8 md:p-8">
    

{videos && videos.map((video, index) => (
                <div key={index} className="rounded-lg border border-gray-200 p-4 flex items-center justify-center md:p-10 dark:border-gray-800">
                    <div className="space-y-2 text-center">
                        <h3 className="text-2xl font-bold tracking-tighter sm:text-3xl">Hook</h3>
                        {/* Here we display the "This is the hook!" text and the actual hook_1 value from the video */}
                        <p className="text-gray-500 dark:text-gray-400">{video.hook_1}</p>
                    </div>
                </div>
            ))}
            {videos && videos.map((video, index) => (
                <div key={index} className="rounded-lg border border-gray-200 p-4 flex items-center justify-center md:p-10 dark:border-gray-800">
                    <div className="space-y-2 text-center">
                        <h3 className="text-2xl font-bold tracking-tighter sm:text-3xl">Problem</h3>
                        {/* Here we display the "This is the hook!" text and the actual hook_1 value from the video */}
                        <p className="text-gray-500 dark:text-gray-400">{video.hook_1}</p>
                    </div>
                </div>
            ))}

{videos && videos.map((video, index) => (
                <div key={index} className="rounded-lg border border-gray-200 p-4 flex items-center justify-center md:p-10 dark:border-gray-800">
                    <div className="space-y-2 text-center">
                        <h3 className="text-2xl font-bold tracking-tighter sm:text-3xl">Solution</h3>
                        {/* Here we display the "This is the hook!" text and the actual hook_1 value from the video */}
                        <p className="text-gray-500 dark:text-gray-400">{video.hook_1}</p>
                    </div>
                </div>
            ))}
            
      </div>
      <div className="flex flex-row	gap-4 p-4 md:gap-8 md:p-8">
    

    {videos && videos.map((video, index) => (
                    <div key={index} className="rounded-lg border border-gray-200 p-4 flex items-center justify-center md:p-10 dark:border-gray-800">
                        <div className="space-y-2 text-center">
                            <h3 className="text-2xl font-bold tracking-tighter sm:text-3xl">Hook</h3>
                            {/* Here we display the "This is the hook!" text and the actual hook_1 value from the video */}
                            <p className="text-gray-500 dark:text-gray-400">{video.hook_1}</p>
                        </div>
                    </div>
                ))}
                {videos && videos.map((video, index) => (
                    <div key={index} className="rounded-lg border border-gray-200 p-4 flex items-center justify-center md:p-10 dark:border-gray-800">
                        <div className="space-y-2 text-center">
                            <h3 className="text-2xl font-bold tracking-tighter sm:text-3xl">Hook</h3>
                            {/* Here we display the "This is the hook!" text and the actual hook_1 value from the video */}
                            <p className="text-gray-500 dark:text-gray-400">{video.hook_1}</p>
                        </div>
                    </div>
                ))}
    
    {videos && videos.map((video, index) => (
                    <div key={index} className="rounded-lg border border-gray-200 p-4 flex items-center justify-center md:p-10 dark:border-gray-800">
                        <div className="space-y-2 text-center">
                            <h3 className="text-2xl font-bold tracking-tighter sm:text-3xl">Hook</h3>
                            {/* Here we display the "This is the hook!" text and the actual hook_1 value from the video */}
                            <p className="text-gray-500 dark:text-gray-400">{video.hook_1}</p>
                        </div>
                    </div>
                ))}
                
          </div>


        </main>
    ;
}
