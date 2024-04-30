'use client';
import React, { useEffect, useState, useRef } from 'react';
import Navbar from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Settings2} from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input';

import { createClient } from '@/utils/supabase/client'
import LibraryUpload from '@/components/libraryupload';


export default function Chat() {

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

  
  const [videoData, setVideoData] = useState<
  Array<{ video_url: string; description: string }>
>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [description, setDescription] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const supabase = createClient();
  
  const handleUpdate = async (video: { video_url: string }) => {
    try {
      const { data, error } = await supabase
        .from('modular_clips')
        .update({ description: description })
        .eq('video_url', video.video_url);
      if (error) {
        throw error;
      }
      // Refresh video data after update
      if (getVideosRef.current) {
        getVideosRef.current();
      }
    } catch (error) {
      console.error("Error updating description:", error);
    }
  };

  const getVideosRef = useRef<() => Promise<void>>(async () => {});
  
  useEffect(() => {
    getVideosRef.current = async () => {
      setIsLoading(true); // Start loading
      try {
        const { data, error } = await supabase
          .from('modular_clips')
          .select('video_url, description')
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

    getVideosRef.current();
  }, []);
  


  if (isLoading) {
    return (
      <section className="flex min-h flex-col items-center p-20 space-y-10">
        <Navbar />
        <CardTitle>Modular Video Library</CardTitle>

        
        
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
      <CardTitle>Modular Video Library</CardTitle>

      <div className="flex flex-row space-x-8 max-w-max">
        

     <LibraryUpload />

     <Input
  type="text"
  placeholder="Search..."
  value={searchTerm}
  className="ring-0 hover:ring-0 focus:ring-0"
  onChange={(e) => setSearchTerm(e.target.value)}
/>

</div>

    <div className="flex flex-row flex-wrap justify-center">
    {videoData
  .filter((video) => video.description.toLowerCase().includes(searchTerm.toLowerCase()))
  .map((video, index) => (
          <Card key={index} className="rounded-lg shadow-lg max-w-xs mx-auto hover:shadow-xl transition-all duration-200 m-4 transition duration-300 hover:-translate-y-2">
            <div className="flex justify-center">
              <video width="auto" height="auto" controls preload="auto">
                <source src={video.video_url} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
            <CardContent className="p-4 space-y-4">
           
            <Sheet>
                <SheetTrigger>
                  <Button variant="outline" size="icon">
                    <Settings2 className="h-4 w-4"/>
                  </Button>
                </SheetTrigger>
                <SheetContent>
      <SheetHeader>
        <CardTitle>Edit Details</CardTitle>
        <div className="grid w-full gap-1.5 pt-8">
          <Label htmlFor="message">Description of clip</Label>
          <Textarea 
            placeholder={video.description}
            id="message"
            value={description} // Add this line
            onChange={(e) => setDescription(e.target.value)} // And this line
            className="h-60"
          />
        </div>
        <div className="pt-4 w-full">
          <Button className="w-full" type="submit" onClick={() => handleUpdate(video)}>Save Changes</Button> 
        </div>
      </SheetHeader>
    </SheetContent>
              </Sheet>



              <div className="flex space-x-2">
                <p className="text-gray-500 dark:text-gray-400">{video.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
  
}