'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { fromUrl } from '@uploadcare/upload-client'
import { fromUrlStatus } from '@uploadcare/upload-client'
import { base } from '@uploadcare/upload-client'
import Link from 'next/link';
import { buttonVariants } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

import { createClient } from '@/utils/supabase/client'
import { Redirect } from 'next';



export default function Chat() {
  const [videoData, setVideoData] = useState<
  Array<{ rendered_video: string; hookScriptCopy: string; video_id: string }>
>([]);
  const [isLoading, setIsLoading] = useState(true); // Loading state
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data?.user) {
        // Redirect to sign-in page using window.location for a full reload
        window.location.href = '/sign-in';
      }
    };

    checkUser();
  }, []); // Empty dependency array means this runs once on component mount

  useEffect(() => {
    const getVideos = async () => {
      setIsLoading(true); // Start loading
      try {
        const { data, error } = await supabase
          .from('rendered_videos')
          .select('rendered_video, hookScriptCopy, video_id')
          .order('created_timestamp', { ascending: false });
  
        if (error) {
          throw error;
        }
  
        if (data) {
          setVideoData(data);
          setIsLoading(false); // Stop loading after data is fetched
        }
      } catch (error) {
        console.error("Error fetching videos:", error);
        setIsLoading(false); // Stop loading on error
      }
    };
  
    getVideos();
  }, []);


  if (isLoading) {
    return (
      <section className="flex min-h flex-col items-center p-20 space-y-10">
        <Navbar />
        <CardTitle>Video Library</CardTitle>
        {/* Placeholder skeleton for loading content */}
        <div className="flex flex-row flex-wrap justify-center">
          {Array(6).fill(0).map((_, index) => ( // Assuming 4 placeholders
            <div key={index} className="p-4">
              <Skeleton className="w-[318px] h-[550px] rounded-lg" /> {/* Adjust size as needed */}
              <Skeleton className="w-[318px] h-[20px] mt-2 rounded" />
              <Skeleton className="w-[318px] h-[20px] mt-2 rounded-full" />
            </div>
          ))}
        </div>
      </section>
    );
  }



  return (
    <section className="flex flex-col items-center p-20 space-y-10">
      <Navbar />
      <CardTitle>Video Library</CardTitle>
      <div className="flex flex-row flex-wrap justify-center">
        {videoData.map((video, index) => (
          <Card key={index} className="rounded-lg shadow-lg max-w-xs mx-auto hover:shadow-xl transition-all duration-200 m-4 transition duration-300 hover:-translate-y-2">
            <div className="flex justify-center">
              <video width="auto" height="auto" controls preload="auto">
                <source src={video.rendered_video} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
            <CardContent className="p-4">
              <div className="flex space-x-2">
                <p className="text-gray-500 dark:text-gray-400">{video.hookScriptCopy}</p>
                <Button asChild>
                  <Link href={`/brief/${video.video_id}`}>See more</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
  
}