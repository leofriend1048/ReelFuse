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
import { createClient } from '@/utils/supabase/client';
import { fromUrl } from '@uploadcare/upload-client'
import { fromUrlStatus } from '@uploadcare/upload-client'
import { base } from '@uploadcare/upload-client'
import Link from 'next/link';
import { buttonVariants } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { MultiStepLoader } from '@/components/ui/multi-step-loader';





const FormSchema = z.object({
  prompt: z.string().min(2, {
    message: "Prompt st be at least 2 characters.",
  }),
});

export default function Chat() {
  const [videoData, setVideoData] = useState<{ rendered_video: string; hookScriptCopy: string; video_id: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // Declare the isSubmitting state here
  const loadingStates = [
    { text: "Researching the Sonicsmooth ad angle..." },
    { text: "Writing your direct response ad script ..." },
    { text: "Reviewing library of footage ..." },
    { text: "Editing your ad ..." },
    { text: "Finalizing..." },
  ];

  const supabase = createClient();

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
        console.error("Error fetching videos:", error.message);
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

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    setIsSubmitting(true);
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
      return;
    }
  
    try {
      const responseData = await response.json();
  
      if (responseData && responseData.result && typeof responseData.result.response === 'string') {
        const parsedNestedResponse = JSON.parse(responseData.result.response);
  
        const hookScriptCopy = parsedNestedResponse['hook script copy'] || "Default script copy";
        const hookVisualDescription = parsedNestedResponse['hook description of visuals'] || "Default script copy";
        const hookVideoURL = parsedNestedResponse['hook video url'] || "Default video URL";
        const problemScriptCopy = parsedNestedResponse['problem script copy'] || "Default video URL";
        const problemVisualDescription = parsedNestedResponse['problem description of visuals'] || "Default video URL";
        const problemVideoURL = parsedNestedResponse['problem video url'] || "Default video URL";
        const agitateProblemScriptCopy = parsedNestedResponse['Agitate problem script copy'] || "Default video URL";
        const agitateProblemVisualDescription = parsedNestedResponse['Agitate problem description of visual'] || "Default video URL";
        const agitateProblemVideoURL = parsedNestedResponse['Agitate problem video url'] || "Default video URL";
        const productIntroScriptCopy = parsedNestedResponse['Product intro script copy'] || "Default script copy";
        const productIntroVisualDescription = parsedNestedResponse['Product intro description of visuals'] || "Default script copy";
        const productIntroVideoURL = parsedNestedResponse['Product intro video url'] || "Default video URL";
        const featureBenefitScriptCopy = parsedNestedResponse['Feature/Benefit script copy'] || "Default video URL";
        const featureBenefitVisualDescription = parsedNestedResponse['Feature/Benefit description of visuals'] || "Default script copy";
        const featureBenefitVideoURL = parsedNestedResponse['Feature/Benefit video url'] || "Default video URL";
        const badAlternativeScriptCopy = parsedNestedResponse['Bad Alternative script copy'] || "Default video URL";
        const badAlternativeVisualDescription = parsedNestedResponse['Bad Alternative description of visuals'] || "Default script copy";
        const badAlternativeVideoURL = parsedNestedResponse['Bad Alternative video url'] || "Default video URL";
        const resultsScriptCopy = parsedNestedResponse['Results script copy'] || "Default video URL";
        const resultsVisualDescription = parsedNestedResponse['Results description of visuals'] || "Default script copy";
        const resultsVideoURL = parsedNestedResponse['Results video url'] || "Default video URL";
        const ctaScriptCopy = parsedNestedResponse['CTA script copy'] || "Default video URL";
        const ctaVisualDescription = parsedNestedResponse['CTA description of visuals'] || "Default script copy";
        const ctaVideoURL = parsedNestedResponse['CTA video url'] || "Default video URL";
        const prompt = data.prompt
        


// ElevenLabs API request
const elevenLabsOptions = {
  method: 'POST',
  headers: {
    'xi-api-key': 'ea2a121ee7f06f28752793b085442f6d',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model_id: "eleven_turbo_v2",
    text: `${hookScriptCopy}\n\n${problemScriptCopy}\n\n${agitateProblemScriptCopy}\n\n${productIntroScriptCopy}\n\n${featureBenefitScriptCopy}\n\n${badAlternativeScriptCopy}\n\n${resultsScriptCopy}\n\n${ctaScriptCopy}`,
    voice_settings: {
      similarity_boost: 0.5,
      stability: 0.5,
      use_speaker_boost: true,
      style: 0.26
    }
  })
};

try {
  // Fetch the audio from ElevenLabs
  const elevenLabsResponse = await fetch('https://api.elevenlabs.io/v1/text-to-speech/2tnG0K0YMLMmPYcDhil0?output_format=mp3_22050_32', elevenLabsOptions);

  if (!elevenLabsResponse.ok) {
      throw new Error(`ElevenLabs API error: ${elevenLabsResponse.statusText}`);
  }

  // Handle the response as a Blob (audio file)
  const audioBlob = await elevenLabsResponse.blob();

        // Upload the Blob to Uploadcare
        const uploadResult = await base(audioBlob, {
            publicKey: '4761755c61304c80768c', 
            store: 'auto',
            metadata: {
                subsystem: 'uploader',
                pet: 'cat'
            }
        });

        console.log('Uploadcare upload result:', uploadResult);


        if (uploadResult && uploadResult.file) {
            const voiceover = `https://ucarecdn.com/${uploadResult.file}/`;
            console.log('Voiceover URL:', voiceover);


                    // Creatomate API request
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
              "Hook-Background": hookVideoURL,
              "Problem-Background": problemVideoURL,
              "Agitate-Background": agitateProblemVideoURL,
              "Product-Intro-Background": productIntroVideoURL,
              "Feature-Benefit-Background": featureBenefitVideoURL,
              "Bad-Alternative-Background": badAlternativeVideoURL,
              "Results-Background": resultsVideoURL,
              "CTA-Background": "https://creatomate.com/files/assets/e675aa5b-220a-4677-a5bf-5f90dd234116",
              "24996f1d-c28c-4678-9def-d2e8beed1bf7": ""
            }
          }),
        });
  
        if (!creatomateResponse.ok) {
          console.error("Failed to submit to Creatomate. Status:", creatomateResponse.status);
          return;
        }

        const creatomateData = await creatomateResponse.json();
        // Ensure that url is defined in a scope accessible by the setTimeout callback
        let url; // Declare url outside of the if block
        let id; // Also declare id outside to ensure it's accessible
        
        // Assuming creatomateData is an array based on the given sample response
        if (creatomateData.length > 0) {
          // Extracting ID and URL from the first item
          ({ id, url } = creatomateData[0]); // Use destructuring assignment
          // Use these values as needed in your application
          console.log("Creatomate Render ID:", id);
          console.log("Creatomate Render URL:", url);
        }

// Set a 30-second delay before uploading the URL to Uploadcare
setTimeout(async () => {
  try {
    // First, upload the URL to Uploadcare and retrieve the token from the response
    const uploadResult = await fromUrl(url, {
      publicKey: '4761755c61304c80768c',
      metadata: {
        subsystem: 'uploader',
        pet: 'cat'
      }
    });

    console.log("Upload initiated to Uploadcare. Token:", uploadResult.token);

    // Next, use the token to check the status of the upload
    const statusCheckInterval = setInterval(async () => {
      try {
        const result = await fromUrlStatus(uploadResult.token, {
          publicKey: '4761755c61304c80768c'
        });

        if (result.status === "success") {
          console.log("Upload to Uploadcare completed successfully. UUID:", result.uuid);

          // Construct the URL with the uuid
          const finalUrl = `https://ucarecdn.com/${result.uuid}/`;
          console.log("Final URL:", finalUrl);

          // Supabase insert operation
          try {
            const { data: supabaseData, error: supabaseError } = await supabase
              .from('rendered_videos')
              .insert([
                { rendered_video: finalUrl,  music: voiceover, hookScriptCopy: hookScriptCopy, hookVisualDescription: hookVisualDescription, hookVideoURL: hookVideoURL, problemScriptCopy: problemScriptCopy, problemVisualDescription: problemVisualDescription, problemVideoURL: problemVideoURL, agitateProblemScriptCopy: agitateProblemScriptCopy, agitateProblemVisualDescription: agitateProblemVisualDescription, agitateProblemVideoURL: agitateProblemVideoURL, productIntroScriptCopy: productIntroScriptCopy, productIntroVisualDescription: productIntroVisualDescription, productIntroVideoURL: productIntroVideoURL, featureBenefitScriptCopy: featureBenefitScriptCopy, featureBenefitVisualDescription: featureBenefitVisualDescription, featureBenefitVideoURL: featureBenefitVideoURL, badAlternativeScriptCopy: badAlternativeScriptCopy, badAlternativeVisualDescription: badAlternativeVisualDescription, badAlternativeVideoURL: badAlternativeVideoURL, resultsScriptCopy: resultsScriptCopy, resultsVisualDescription: resultsVisualDescription, resultsVideoURL: resultsVideoURL, ctaScriptCopy: ctaScriptCopy, ctaVisualDescription: ctaVisualDescription, prompt: prompt, ctaVideoURL: 'https://uwfllbptpdqoovbeizya.supabase.co/storage/v1/object/public/modular_clips/e675aa5b-220a-4677-a5bf-5f90dd234116%20(1).mp4' }
              ]);

            if (supabaseError) throw supabaseError;
            setIsSubmitting(false); 

            console.log("Successfully inserted into Supabase:", supabaseData);
            setIsSubmitting(false); // Indicate the submission process has ended

             // Refresh the page
  window.location.reload(); 
  
} catch (error) {
  console.error("Failed to insert into Supabase:", error.message);
} 

          // Once the upload is confirmed, clear the interval to stop checking
          clearInterval(statusCheckInterval);
        } else if (result.status === "error") {
          console.error("Upload to Uploadcare failed. Error:", result.error, "HTTP client error:", result.httpErrorCode);
          clearInterval(statusCheckInterval);
        }
        // If status is "waiting" or "unknown", the interval will continue until success or error
      } catch (error) {
        console.error("Error checking upload status to Uploadcare:", error);
        clearInterval(statusCheckInterval); // Ensure interval is cleared on error
      }
    }, 5000); // Check every 5 seconds for upload status
    
  } catch (error) {
    console.error("Failed to upload to Uploadcare:", error);
  }
}, 200000); // 180 seconds delay
}
} catch (error) {
console.error("Error parsing response data or other processing error:", error);
}
            // Use the voiceover URL as needed, e.g., save to state, display in the UI, etc.
        } else {
      throw new Error("Uploadcare upload did not return a valid UUID.");
    }
  } catch (error) {
    console.error("Error during audio fetch/upload:", error);
  } finally {
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
                <Form {...form} className="flex w-full fixed bottom-0 items-center space-x-2 max-w-md p-2 mb-8">
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