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
import Link from 'next/link';
import { buttonVariants } from "@/components/ui/button"
import { MultiStepLoader } from '@/components/ui/multi-step-loader';

import { createClient } from '@/utils/supabase/client'
import { Redirect } from 'next';


const FormSchema = z.object({
  prompt: z.string().min(2, {
    message: "Prompt must be at least 2 characters.",
  }),
});

export default function Chat() {

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

  
  const [videoData, setVideoData] = useState<{ rendered_video: string; hookScriptCopy: string; video_id: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // Declare the isSubmitting state here
  const loadingStates = [
    { text: "Researching the Sonicsmooth ad angle..." },
    { text: "Writing your direct response ad script ..." },
    { text: "Reviewing library of footage ..." },
    { text: "Editing your ad ..." },
    { text: "Finalizing..." },
  ];


  useEffect(() => {
    const getMostRecentVideo = async () => {
      try {
        const { data, error } = await supabase
          .from('rendered_videos')
          .select('rendered_video, hookScriptCopy, video_id') // Now we're fetching the video URL directly
          .order('created_timestamp', { ascending: false })
          .limit(1);

        if (error) {
          throw error;
        }

        if (data && data.length > 0) {
          // Store the fetched video URL(s) in state
          setVideoData({ rendered_video: data[0].rendered_video, hookScriptCopy: data[0].hookScriptCopy, video_id: data[0].video_id });
        }
      } catch (error) {
        console.error("Error fetching videos:");
      }
    };

    getMostRecentVideo();
  }, []);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      prompt: "",
    },
  });

  
  async function fetchChatResponse(data: z.infer<typeof FormSchema>) {
    const response = await fetch('https://api.airops.com/public_api/agent_apps/af35fbef-2892-4416-a1e7-94011a6a4066/chat/v10', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer D0qQUT70a-ZQSEaehrJGqTJdJ-oDn60U1HRGbuqnDqWykSprPtDqFFvGJ5qr',

      },
      body: JSON.stringify({
        message: data.prompt,
      }),
    });
  
    if (!response.ok) {
      console.error("Failed to submit message. Status:", response.status);
      throw new Error("Failed to submit message");
    }
  
    return response.json();
  }
  
  function parseResponseData(responseData: any) {
    if (responseData && responseData.result && typeof responseData.result.response === 'string') {
      const parsedNestedResponse = JSON.parse(responseData.result.response);
  
      return {
        hookScriptCopy: parsedNestedResponse['hook script copy'] || "Default script copy",
        hookVisualDescription: parsedNestedResponse['hook description of visuals'] || "Default script copy",
        hookVideoURL: parsedNestedResponse['hook video url'] || "Default video URL",
        problemScriptCopy: parsedNestedResponse['problem script copy'] || "Default video URL",
        problemVisualDescription: parsedNestedResponse['problem description of visuals'] || "Default video URL",
        problemVideoURL: parsedNestedResponse['problem video url'] || "Default video URL",
        agitateProblemScriptCopy: parsedNestedResponse['Agitate problem script copy'] || "Default video URL",
        agitateProblemVisualDescription: parsedNestedResponse['Agitate problem description of visual'] || "Default video URL",
        agitateProblemVideoURL: parsedNestedResponse['Agitate problem video url'] || "Default video URL",
        productIntroScriptCopy: parsedNestedResponse['Product intro script copy'] || "Default script copy",
        productIntroVisualDescription: parsedNestedResponse['Product intro description of visuals'] || "Default script copy",
        productIntroVideoURL: parsedNestedResponse['Product intro video url'] || "Default video URL",
        featureBenefitScriptCopy: parsedNestedResponse['Feature/Benefit script copy'] || "Default video URL",
        featureBenefitVisualDescription: parsedNestedResponse['Feature/Benefit description of visuals'] || "Default script copy",
        featureBenefitVideoURL: parsedNestedResponse['Feature/Benefit video url'] || "Default video URL",
        badAlternativeScriptCopy: parsedNestedResponse['Bad Alternative script copy'] || "Default video URL",
        badAlternativeVisualDescription: parsedNestedResponse['Bad Alternative description of visuals'] || "Default script copy",
        badAlternativeVideoURL: parsedNestedResponse['Bad Alternative video url'] || "Default video URL",
        resultsScriptCopy: parsedNestedResponse['Results script copy'] || "Default video URL",
        resultsVisualDescription: parsedNestedResponse['Results description of visuals'] || "Default script copy",
        resultsVideoURL: parsedNestedResponse['Results video url'] || "Default video URL",
        ctaScriptCopy: parsedNestedResponse['CTA script copy'] || "Default video URL",
        ctaVisualDescription: parsedNestedResponse['CTA description of visuals'] || "Default script copy",
        ctaVideoURL: parsedNestedResponse['CTA video url'] || "Default video URL",
      };
    }
  
    throw new Error("Invalid response data");
  }
  
  async function fetchAudioFromElevenLabs(scriptData: ReturnType<typeof parseResponseData>) {
    const elevenLabsOptions = {
      method: 'POST',
      headers: {
        'xi-api-key': 'ea2a121ee7f06f28752793b085442f6d',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model_id: "eleven_turbo_v2",
        text: `${scriptData.hookScriptCopy}\n\n${scriptData.problemScriptCopy}\n\n${scriptData.agitateProblemScriptCopy}\n\n${scriptData.productIntroScriptCopy}\n\n${scriptData.featureBenefitScriptCopy}\n\n${scriptData.badAlternativeScriptCopy}\n\n${scriptData.resultsScriptCopy}\n\n${scriptData.ctaScriptCopy}`,
        voice_settings: {
          similarity_boost: 0.5,
          stability: 0.5,
          use_speaker_boost: true,
          style: 0.26
        }
      })
    };
  
    const elevenLabsResponse = await fetch('https://api.elevenlabs.io/v1/text-to-speech/2tnG0K0YMLMmPYcDhil0?output_format=mp3_22050_32', elevenLabsOptions);
  
    if (!elevenLabsResponse.ok) {
      throw new Error(`ElevenLabs API error: ${elevenLabsResponse.statusText}`);
    }
  
    return elevenLabsResponse.blob();
  }
  
  async function uploadAudioToSupabase(audioBlob: Blob) {
    // Generate a random 12-digit code
    let randomCode = '';
    for (let i = 0; i < 12; i++) {
      randomCode += Math.floor(Math.random() * 10).toString();
    }
  
    // Construct the fileName using the generated code
    const fileName = `voiceover_${randomCode}.mp3`;
  
    // Upload file to Supabase storage bucket
    const { data, error } = await supabase.storage.from('audio').upload(fileName, audioBlob);
  
    if (error) {
      console.error('Error uploading audio to Supabase:', error);
      throw new Error('Failed to upload audio to Supabase');
    }
  
    // Construct the voiceover URL from the Supabase storage bucket
    const voiceover = `https://uwfllbptpdqoovbeizya.supabase.co/storage/v1/object/public/audio/${fileName}`;
    console.log('Voiceover URL:', voiceover);
  
    return voiceover;
  }
  
  async function submitToCreatomate(scriptData: ReturnType<typeof parseResponseData>, voiceover: string): Promise<{ renderId: string; renderUrl: string }> {
    try {
      const creatomateResponse = await fetch('https://api.creatomate.com/v1/renders', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer e7e048b7cb334b74b692dc481aca9ba1570289eb936bd24e07ee3608a423fecaaf4679f7d4c879069f777fa6d872e662',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          "template_id": "fe577f94-9404-46aa-8696-a96e6210b2c1",
          "modifications": {
            "Music": voiceover,
            "Hook-Background": scriptData.hookVideoURL,
            "Problem-Background": scriptData.problemVideoURL,
            "Agitate-Background": scriptData.agitateProblemVideoURL,
            "Product-Intro-Background": scriptData.productIntroVideoURL,
            "Feature-Benefit-Background": scriptData.featureBenefitVideoURL,
            "Bad-Alternative-Background": scriptData.badAlternativeVideoURL,
            "Results-Background": scriptData.resultsVideoURL,
            "CTA-Background": "https://creatomate.com/files/assets/e675aa5b-220a-4677-a5bf-5f90dd234116",
            "24996f1d-c28c-4678-9def-d2e8beed1bf7": ""
          }
        }),
      });
  
      if (!creatomateResponse.ok) {
        console.error("Failed to submit to Creatomate. Status:", creatomateResponse.status);
        throw new Error("Failed to submit to Creatomate");
      }
  
      const creatomateData = await creatomateResponse.json();

      console.log("Creatomate response data:", creatomateData);
  
      if (Array.isArray(creatomateData) && creatomateData.length > 0) {
        const renderData = creatomateData[0];
  
        const renderId = renderData?.id;
        if (!renderId) {
          console.error("Render ID not found in Creatomate response");
          throw new Error("Render ID not found in Creatomate response. Please check the API response.");
        }
        console.log(`Render ID: ${renderId}`);
  
        const renderUrl = renderData?.url;
        if (!renderUrl) {
          console.error("Render URL not found in Creatomate response");
          throw new Error("Render URL not found in Creatomate response. Please check the API response.");
        }
        console.log(`Render URL: ${renderUrl}`);
  
        return { renderId, renderUrl };
      } else {
        console.error("Invalid Creatomate response format");
        throw new Error("Invalid Creatomate response format. Expected an array with render data.");
      }
    } catch (error) {
      console.error("Error in submitToCreatomate:", error);
      throw new Error(`Error during processing`);
    }
  }
  
  async function pollCreatomateStatus(renderId: string) {
    const statusEndpoint = `https://api.creatomate.com/v1/renders/${renderId}`;
  
    while (true) {
      try {
        const response = await fetch(statusEndpoint, {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer e7e048b7cb334b74b692dc481aca9ba1570289eb936bd24e07ee3608a423fecaaf4679f7d4c879069f777fa6d872e662'
          }
        });
  
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
  
        const data = await response.json();
        const status = data.status;
  
        if (status === 'succeeded') {
          console.log('Render succeeded.');
          break;
        } else if (status === 'failed') {
          throw new Error('Render failed.');
        } else {
          console.log('Render status:', status);
          await new Promise(resolve => setTimeout(resolve, 4000)); // Wait for 4 seconds before the next poll
        }
      } catch (error) {
        console.error('Error polling Creatomate status');
        throw error;
      }
    }
  }
  
  async function insertIntoSupabase(renderUrl: string, voiceover: string, scriptData: ReturnType<typeof parseResponseData>, prompt: string) {
    const { data: supabaseData, error: supabaseError } = await supabase
      .from('rendered_videos')
      .insert([
        {
          rendered_video: renderUrl,
          music: voiceover,
          hookScriptCopy: scriptData.hookScriptCopy,
          hookVisualDescription: scriptData.hookVisualDescription,
          hookVideoURL: scriptData.hookVideoURL,
          problemScriptCopy: scriptData.problemScriptCopy,
          problemVisualDescription: scriptData.problemVisualDescription,
          problemVideoURL: scriptData.problemVideoURL,
          agitateProblemScriptCopy: scriptData.agitateProblemScriptCopy,
          agitateProblemVisualDescription: scriptData.agitateProblemVisualDescription,
          agitateProblemVideoURL: scriptData.agitateProblemVideoURL,
          productIntroScriptCopy: scriptData.productIntroScriptCopy,
          productIntroVisualDescription: scriptData.productIntroVisualDescription,
          productIntroVideoURL: scriptData.productIntroVideoURL,
          featureBenefitScriptCopy: scriptData.featureBenefitScriptCopy,
          featureBenefitVisualDescription: scriptData.featureBenefitVisualDescription,
          featureBenefitVideoURL: scriptData.featureBenefitVideoURL,
          badAlternativeScriptCopy: scriptData.badAlternativeScriptCopy,
          badAlternativeVisualDescription: scriptData.badAlternativeVisualDescription,
          badAlternativeVideoURL: scriptData.badAlternativeVideoURL,
          resultsScriptCopy: scriptData.resultsScriptCopy,
          resultsVisualDescription: scriptData.resultsVisualDescription,
          resultsVideoURL: scriptData.resultsVideoURL,
          ctaScriptCopy: scriptData.ctaScriptCopy,
          ctaVisualDescription: scriptData.ctaVisualDescription,
          prompt: prompt,
          ctaVideoURL: 'https://uwfllbptpdqoovbeizya.supabase.co/storage/v1/object/public/modular_clips/e675aa5b-220a-4677-a5bf-5f90dd234116%20(1).mp4'
        }
      ]);
  
    if (supabaseError) throw supabaseError;
  
    console.log("Successfully inserted into Supabase:", supabaseData);
    window.location.reload();
  }
  
  async function onSubmit(data: z.infer<typeof FormSchema>) {
    setIsSubmitting(true);
  
    try {
      const responseData = await fetchChatResponse(data);
      const scriptData = parseResponseData(responseData);
      const audioBlob = await fetchAudioFromElevenLabs(scriptData);
      const voiceover = await uploadAudioToSupabase(audioBlob);
      const { renderId, renderUrl } = await submitToCreatomate(scriptData, voiceover);
  
      console.log("Creatomate Render ID:", renderId);
      console.log("Creatomate Render URL:", renderUrl);
  
      // Wait for the video rendering to complete
      await pollCreatomateStatus(renderId);
  
      // Insert the data into Supabase using renderUrl directly
      await insertIntoSupabase(renderUrl, voiceover, scriptData, data.prompt);
  
      console.log("Video generation and upload completed successfully.");
    } catch (error) {
      console.error("Error during processing:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section>
      <Navbar />
      <div className="w-full grid grid-cols-1 md:grid-cols-2">
        <div className="grid gap-4 p-4 md:gap-8 md:p-8">
          <div className="p-4 flex items-center justify-center md:p-10 dark:border-gray-800">
            <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
              <div className="flex w-full fixed bottom-0 items-center space-x-2 max-w-md p-2 mb-8">
                <div className="flex w-full fixed bottom-0 items-center space-x-2 max-w-md p-2 mb-8">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="flex w-full space-y-6">
                    <FormField
                      control={form.control}
                      name="prompt"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input className="fixed bottom-14 w-full max-w-md p-2 mb-8 border border-gray-300 rounded shadow-xl text-base" placeholder="Input ad angle" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {isSubmitting ? (
  <MultiStepLoader className="z-10" loadingStates={loadingStates} loading={isSubmitting} duration={40000} />
) : (
  <Button className="fixed bottom-5 w-full max-w-md p-2 mb-8 border border-gray-300 rounded shadow-x text-base" type="submit">
    Submit
  </Button>
)}

                  </form>
                </Form>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid gap-4 p-4 md:gap-8 md:p-8 justify-center	">
        <div className="p-4 flex items-center justify-center md:p-10">
  {videoData && (
    <>
      <video className="z-[-1]" width="350px" height="auto" controls preload="auto">
        <source src={videoData.rendered_video} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </>
  )}
</div>

           

    {videoData && (
    <>
        <Button className="w-full max-w-md p-2 mb-8 border border-gray-300 rounded shadow-x text-base" asChild>
        <Link href={`/brief/${videoData.video_id}`}>See more</Link>
    </Button>
    </>
  )}
      </div>
    </div>

    </section>
  );
}