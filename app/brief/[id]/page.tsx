'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Navbar from '@/components/navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
              .from('rendered_videos')
              .select('rendered_video, hookScriptCopy, hookVisualDescription, hookVideoURL, problemScriptCopy, problemVisualDescription, problemVideoURL, agitateProblemScriptCopy, agitateProblemVisualDescription, agitateProblemVideoURL, productIntroScriptCopy, productIntroVisualDescription, productIntroVideoURL, featureBenefitScriptCopy, featureBenefitVisualDescription, featureBenefitVideoURL, badAlternativeScriptCopy, badAlternativeVisualDescription, badAlternativeVideoURL, resultsScriptCopy, resultsVisualDescription, resultsVideoURL, ctaScriptCopy, ctaVisualDescription, ctaVideoURL, prompt')
              .eq('video_id', params.id);
          if (error) {
              setError(error.message);
          } else {
              setVideos(data);
          }
        };
        getData();
    }, [params.id]);


    const markReadyToLaunch = async (videoUrl: string, UUID: string) => {
        const response = await fetch('https://eoefe2lbcb19rmr.m.pipedream.net', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                videoUrl: videoUrl,
                UUID: UUID,
            }),
        });

        if (response.ok) {
            // Handle success response
            toast("Ad marked as ready to launch successfully!", {
                description: "The team in Slack has been notified & the Clickup task has been created.",
              });
        } else {
            // Handle error response
            toast("Failed to mark ad as ready to launch.");
        }
    };


    if (error) return <div>Error: {error}</div>;


     // Function to copy the current URL to the clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.toString())
      .then(() => {
        // Success feedback, consider showing a message to the user
        toast("Link copied to clipboard!", );      })
      .catch(err => {
        // Error handling, consider showing an error message to the user
        console.error('Failed to copy the link: ', err);
      });
  };


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
           <b>Prompt:</b>
           <DropdownMenu>
     <DropdownMenuTrigger asChild>
       <Button className="h-8 w-8 px-0" variant="outline" >
       <CircleEllipsis size={16} /></Button>
     </DropdownMenuTrigger>
     <DropdownMenuContent className="w-96">
       <DropdownMenuGroup>
         <DropdownMenuItem  onClick={copyToClipboard}>
         <UserPlus className="mr-2 h-4 w-4" />
         <span>Share</span>
         </DropdownMenuItem>
         <DropdownMenuItem>
           <Download className="mr-2 h-4 w-4" />

           {videos.map((video, index) => (
           <div key={index}>
           <Link href={video.rendered_video}>Download MP4</Link>
           </div> ))}

         </DropdownMenuItem>
         <DropdownMenuItem disabled>
           <Video className="mr-2 h-4 w-4" />
           <span>Download Premiere Project</span>
         </DropdownMenuItem>
         
       </DropdownMenuGroup>
       </DropdownMenuContent>
   </DropdownMenu>
           </div>
     <span>
     {videos && videos.map((video, index) => (
               <div key={index} className="pt-2">
                       {/* Here we display the "This is the hook!" text and the actual hookScriptCopy value from the video */}
                       {videos.map((video, index) => (
                       <div className="" key={index}>
                        <p className="">{video.prompt}</p>
                       </div>
                   ))}
                   </div>
                     ))} </span>
      
    
      {videos && videos.map((video, index) => (
            <Dialog key={index}>
  <DialogTrigger className="pt-6"><Button>Mark Ready to Launch</Button></DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Are you sure?</DialogTitle>
      <DialogDescription>
      The team in Slack will be notified &amp; a Clickup task with the &quot;ready to launch&quot; status will be created.
        <div className="pt-4"><Button onClick={() => markReadyToLaunch(video.rendered_video, params.id)}>Continue</Button></div>
      </DialogDescription>
    </DialogHeader>
  </DialogContent>
</Dialog>
        ))}


    

     </CardContent>
                    {videos.map((video, index) => (
                        <div className="object-cover w-full" key={index}>
                            <video width="100%" height="auto" controls preload="auto">
                                <source src={video.rendered_video} type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    ))}
    </Card>
        </>
    )}
    
        <div className="flex flex-row flex-wrap gap-10 justify-center">
    

{videos && videos.map((video, index) => (
                <div key={index} className="rounded-lg border border-gray-200 p-4 flex flex-col	items-center justify-center md:p-10 dark:border-gray-800 max-w-sm">
                    <div className="space-y-2 text-center">
                        <h3 className="text-2xl font-bold tracking-tighter sm:text-3xl">1. Hook</h3>
                        {/* Here we display the "This is the hook!" text and the actual hookScriptCopy value from the video */}
                        {videos.map((video, index) => (
                        <div className="object-cover w-full" key={index}>
                            <video autoPlay loop muted width="100%" height="auto" className="h-96" preload="auto">
                                <source src={video.hookVideoURL} type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    ))}
                        <div className="font-bold">Script Copy</div>
                            <p className="text-gray-500 dark:text-gray-400">{video.hookScriptCopy}</p>
                        <div className="font-bold">Description of Visuals</div>
                            <p className="text-gray-500 dark:text-gray-400">{video.hookVisualDescription}</p>

                    </div>
                </div>
            ))}
            {videos && videos.map((video, index) => (
                <div key={index} className="rounded-lg border border-gray-200 p-4 flex flex-col	items-center justify-center md:p-10 dark:border-gray-800 max-w-sm">
                    <div className="space-y-2 text-center">
                        <h3 className="text-2xl font-bold tracking-tighter sm:text-3xl">2. Problem</h3>
                        {/* Here we display the "This is the hook!" text and the actual hookScriptCopy value from the video */}
                        {videos.map((video, index) => (
                        <div className="object-cover w-full" key={index}>
                            <video autoPlay loop muted width="100%" height="auto" className="h-96" preload="auto">
                                <source src={video.problemVideoURL} type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    ))}
                        <div className="font-bold">Script Copy</div>
                            <p className="text-gray-500 dark:text-gray-400">{video.problemScriptCopy}</p>
                        <div className="font-bold">Description of Visuals</div>
                            <p className="text-gray-500 dark:text-gray-400">{video.problemVisualDescription}</p>

                    </div>
                </div>
            ))}
             {videos && videos.map((video, index) => (
                <div key={index} className="rounded-lg border border-gray-200 p-4 flex flex-col	items-center justify-center md:p-10 dark:border-gray-800 max-w-sm">
                    <div className="space-y-2 text-center">
                        <h3 className="text-2xl font-bold tracking-tighter sm:text-3xl">3. Agitate Problem</h3>
                        {/* Here we display the "This is the hook!" text and the actual hookScriptCopy value from the video */}
                        {videos.map((video, index) => (
                        <div className="object-cover w-full" key={index}>
                            <video autoPlay loop muted width="100%" height="auto" className="h-96" preload="auto">
                                <source src={video.agitateProblemVideoURL} type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    ))}
                        <div className="font-bold">Script Copy</div>
                            <p className="text-gray-500 dark:text-gray-400">{video.agitateProblemScriptCopy}</p>
                        <div className="font-bold">Description of Visuals</div>
                            <p className="text-gray-500 dark:text-gray-400">{video.agitateProblemVisualDescription}</p>

                    </div>
                </div>
            ))}
             {videos && videos.map((video, index) => (
                <div key={index} className="rounded-lg border border-gray-200 p-4 flex flex-col	items-center justify-center md:p-10 dark:border-gray-800 max-w-sm">
                    <div className="space-y-2 text-center">
                        <h3 className="text-2xl font-bold tracking-tighter sm:text-3xl">4. Product Intro</h3>
                        {/* Here we display the "This is the hook!" text and the actual hookScriptCopy value from the video */}
                        {videos.map((video, index) => (
                        <div className="object-cover w-full" key={index}>
                            <video autoPlay loop muted width="100%" height="auto" className="h-96" preload="auto">
                                <source src={video.productIntroVideoURL} type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    ))}
                        <div className="font-bold">Script Copy</div>
                            <p className="text-gray-500 dark:text-gray-400">{video.productIntroScriptCopy}</p>
                        <div className="font-bold">Description of Visuals</div>
                            <p className="text-gray-500 dark:text-gray-400">{video.productIntroVisualDescription}</p>

                    </div>
                </div>
            ))}
            {videos && videos.map((video, index) => (
                <div key={index} className="rounded-lg border border-gray-200 p-4 flex flex-col	items-center justify-center md:p-10 dark:border-gray-800 max-w-sm">
                    <div className="space-y-2 text-center">
                        <h3 className="text-2xl font-bold tracking-tighter sm:text-3xl">5. Feature & Benefit</h3>
                        {/* Here we display the "This is the hook!" text and the actual hookScriptCopy value from the video */}
                        {videos.map((video, index) => (
                        <div className="object-cover w-full" key={index}>
                            <video autoPlay loop muted width="100%" height="auto" className="h-96" preload="auto">
                                <source src={video.featureBenefitVideoURL} type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    ))}
                        <div className="font-bold">Script Copy</div>
                            <p className="text-gray-500 dark:text-gray-400">{video.featureBenefitScriptCopy}</p>
                        <div className="font-bold">Description of Visuals</div>
                            <p className="text-gray-500 dark:text-gray-400">{video.featureBenefitVisualDescription}</p>

                    </div>
                </div>
            ))}
            {videos && videos.map((video, index) => (
                <div key={index} className="rounded-lg border border-gray-200 p-4 flex flex-col	items-center justify-center md:p-10 dark:border-gray-800 max-w-sm">
                    <div className="space-y-2 text-center">
                        <h3 className="text-2xl font-bold tracking-tighter sm:text-3xl">6. Bad Alternative</h3>
                        {/* Here we display the "This is the hook!" text and the actual hookScriptCopy value from the video */}
                        {videos.map((video, index) => (
                        <div className="object-cover w-full" key={index}>
                            <video autoPlay loop muted width="100%" height="auto" className="h-96" preload="auto">
                                <source src={video.badAlternativeVideoURL} type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    ))}
                        <div className="font-bold">Script Copy</div>
                            <p className="text-gray-500 dark:text-gray-400">{video.badAlternativeScriptCopy}</p>
                        <div className="font-bold">Description of Visuals</div>
                            <p className="text-gray-500 dark:text-gray-400">{video.badAlternativeVisualDescription}</p>

                    </div>
                </div>
            ))}
             {videos && videos.map((video, index) => (
                <div key={index} className="rounded-lg border border-gray-200 p-4 flex flex-col	items-center justify-center md:p-10 dark:border-gray-800 max-w-sm">
                    <div className="space-y-2 text-center">
                        <h3 className="text-2xl font-bold tracking-tighter sm:text-3xl">7. Results</h3>
                        {/* Here we display the "This is the hook!" text and the actual hookScriptCopy value from the video */}
                        {videos.map((video, index) => (
                        <div className="object-cover w-full" key={index}>
                            <video autoPlay loop muted width="100%" height="auto" className="h-96" preload="auto">
                                <source src={video.resultsVideoURL} type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    ))}
                        <div className="font-bold">Script Copy</div>
                            <p className="text-gray-500 dark:text-gray-400">{video.resultsScriptCopy}</p>
                        <div className="font-bold">Description of Visuals</div>
                            <p className="text-gray-500 dark:text-gray-400">{video.resultsVisualDescription}</p>

                    </div>
                </div>
            ))}
            {videos && videos.map((video, index) => (
                <div key={index} className="rounded-lg border border-gray-200 p-4 flex flex-col	items-center justify-center md:p-10 dark:border-gray-800 max-w-sm">
                    <div className="space-y-2 text-center">
                        <h3 className="text-2xl font-bold tracking-tighter sm:text-3xl">8. CTA</h3>
                        {/* Here we display the "This is the hook!" text and the actual hookScriptCopy value from the video */}
                        {videos.map((video, index) => (
                        <div className="object-cover w-full" key={index}>
                            <video autoPlay loop muted width="100%" height="auto" className="h-96" preload="auto">
                                <source src={video.ctaVideoURL} type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    ))}
                        <div className="font-bold">Script Copy</div>
                            <p className="text-gray-500 dark:text-gray-400">{video.ctaScriptCopy}</p>
                        <div className="font-bold">Description of Visuals</div>
                            <p className="text-gray-500 dark:text-gray-400">{video.ctaVisualDescription}</p>

                    </div>
                </div>
            ))}
          </div>

        </main>
    ;
}
