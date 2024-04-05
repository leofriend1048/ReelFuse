'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Navbar from '@/components/navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { buttonVariants } from "@/components/ui/button"
import Link from 'next/link';
import { Skeleton } from "@/components/ui/skeleton"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "@/components/ui/dialog"
  import { toast } from "sonner"
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuPortal,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"
  import {
    Cloud,
    CreditCard,
    Keyboard,
    LifeBuoy,
    LogOut,
    Mail,
    MessageSquare,
    Plus,
    PlusCircle,
    Settings,
    User,
    UserPlus,
    Users,
    Download,
    Video,
    Pencil,
    CircleEllipsis,
    Clipboard,
  } from "lucide-react"
  import {
    Alert,
    AlertDescription,
    AlertTitle,
  } from "@/components/ui/alert"
  import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
  } from "@/components/ui/drawer"
  import Image from "next/image";
  import { createClient } from '@/utils/supabase/client'
  import { Redirect } from 'next';
  import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
  } from "@/components/ui/carousel"
  

  
  

// Assuming params is received correctly; otherwise, use useRouter to obtain params
export default function Page({ params }: { params: { id: string } }) {
    const [videos, setVideos] = useState<any[] | null>(null);
    const [error, setError] = useState<string | null>(null);
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
        const getData = async () => {
          const { data, error } = await supabase
              .from('iterations')
              .select('original_video_url, primary_copy_1, primary_copy_2, primary_copy_3, primary_copy_4, primary_copy_5, headline_copy_1, headline_copy_2, headline_copy_3, headline_copy_4, headline_copy_5')
              .eq('id', params.id);
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
            
            <Card
      key="1"
      className="rounded-lg shadow-lg max-w-sm mx-auto hover:shadow-xl transition-all duration-200 min-w-80">
         <CardContent className="p-4">
       
           <div className="flex flex-row space-x2 place-content-between">
           <b>Original Ad:</b>
           </div>
     </CardContent>
                    {videos.map((video, index) => (
                        <div className="object-cover w-full" key={index}>
                            <video width="100%" height="auto" controls preload="auto">
                                <source src={video.original_video_url} type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    ))}
    </Card>
        </>
    )}

<CardTitle className="text-2xl font-bold tracking-tighter sm:text-3xl">Primary Copy</CardTitle>

<Carousel
      opts={{
        align: "start",
      }}
      className="w-full"
    >
      <CarouselContent>
          <CarouselItem className="basis-1/4">
            <div className="p-1">
            {videos &&
videos.map((video, index) => (
    <Card variant="vertical" key={`primary-copy-1-${index}`}> 
        <CardContent className="p-4">
            <p
                className="text-base text-gray-500 dark:text-gray-400"
                dangerouslySetInnerHTML={{
                    __html: video.primary_copy_1.replace(/\n/g, '<br/>'),
                }}
                ref={(el) => (video.primaryCopyRef1 = el)}
            />
        </CardContent>
        <CardFooter className="pt-4">
            <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => {
                    toast("Copied to clipboard")
                    if (video.primaryCopyRef1) {
                        const selection = window.getSelection();
                        const range = document.createRange();
                        range.selectNodeContents(video.primaryCopyRef1);
                        selection.removeAllRanges();
                        selection.addRange(range);
                        document.execCommand('copy');
                        selection.removeAllRanges();
                    }
                }}
            >
                <Clipboard className="w-4 h-4 mr-2 inline-block" /> Copy
            </Button>
        </CardFooter>
    </Card>
))}
            </div>
          </CarouselItem>
          <CarouselItem className="basis-1/4">
            <div className="p-1">
                {videos &&
videos.map((video, index) => (
<Card className="h-full" variant="vertical" key={`primary-copy-2-${index}`}>
<CardContent className="p-4 flex flex-col h-full">
<p
  className="text-base text-gray-500 dark:text-gray-400 mb-auto"
  dangerouslySetInnerHTML={{
    __html: video.primary_copy_2.replace(/\n/g, '<br/>'),
  }}
  ref={(el) => (video.primaryCopyRef2 = el)}
/>
</CardContent>
<CardFooter className="pt-4">
<Button
  size="sm"
  variant="outline"
  className="w-full"
  onClick={() => {
      toast("Copied to clipboard")
    if (video.primaryCopyRef2) {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(video.primaryCopyRef2);
      selection.removeAllRanges();
      selection.addRange(range);
      document.execCommand('copy');
      selection.removeAllRanges();
    }
  }}
>
  <Clipboard className="w-4 h-4 mr-2 inline-block" /> Copy
</Button>
</CardFooter>
</Card>
))}            
            </div>
          </CarouselItem>
          <CarouselItem className="basis-1/4">
            <div className="p-1">
                {videos &&
videos.map((video, index) => (
<Card variant="vertical" key={`primary-copy-3-${index}`}>
<CardContent className="p-4">
<p
  className="text-base text-gray-500 dark:text-gray-400"
  dangerouslySetInnerHTML={{
    __html: video.primary_copy_3.replace(/\n/g, '<br/>'),
  }}
  ref={(el) => (video.primaryCopyRef3 = el)}
/>
</CardContent>
<CardFooter className="pt-4">
<Button
  size="sm"
  variant="outline"
  className="w-full"
  onClick={() => {
      toast("Copied to clipboard")
    if (video.primaryCopyRef3) {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(video.primaryCopyRef3);
      selection.removeAllRanges();
      selection.addRange(range);
      document.execCommand('copy');
      selection.removeAllRanges();
    }
  }}
>
  <Clipboard className="w-4 h-4 mr-2 inline-block" /> Copy
</Button>
</CardFooter>
</Card>
))}            
            </div>
          </CarouselItem>
          <CarouselItem className="basis-1/4">
            <div className="p-1">
                {videos &&
videos.map((video, index) => (
<Card variant="vertical" key={`primary-copy-4-${index}`}>
<CardContent className="p-4">
<p
  className="text-base text-gray-500 dark:text-gray-400"
  dangerouslySetInnerHTML={{
    __html: video.primary_copy_4.replace(/\n/g, '<br/>'),
  }}
  ref={(el) => (video.primaryCopyRef4 = el)}
/>
</CardContent>
<CardFooter className="pt-4">
<Button
  size="sm"
  variant="outline"
  className="w-full"
  onClick={() => {
      toast("Copied to clipboard")
    if (video.primaryCopyRef4) {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(video.primaryCopyRef4);
      selection.removeAllRanges();
      selection.addRange(range);
      document.execCommand('copy');
      selection.removeAllRanges();
    }
  }}
>
  <Clipboard className="w-4 h-4 mr-2 inline-block" /> Copy
</Button>
</CardFooter>
</Card>
))}            
            </div>
          </CarouselItem>
          <CarouselItem className="basis-1/4">
            <div className="p-1">
                {videos &&
videos.map((video, index) => (
<Card variant="vertical" key={`primary-copy-5-${index}`}>
<CardContent className="p-4">
<p
  className="text-base text-gray-500 dark:text-gray-400"
  dangerouslySetInnerHTML={{
    __html: video.primary_copy_5.replace(/\n/g, '<br/>'),
  }}
  ref={(el) => (video.primaryCopyRef5 = el)}
/>
</CardContent>
<CardFooter className="pt-4">
<Button
  size="sm"
  variant="outline"
  className="w-full"
  onClick={() => {
      toast("Copied to clipboard")
    if (video.primaryCopyRef5) {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(video.primaryCopyRef5);
      selection.removeAllRanges();
      selection.addRange(range);
      document.execCommand('copy');
      selection.removeAllRanges();
    }
  }}
>
  <Clipboard className="w-4 h-4 mr-2 inline-block" /> Copy
</Button>
</CardFooter>
</Card>
))}            
            </div>
          </CarouselItem>
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>


    
 




    
        </main>
    ;
}
