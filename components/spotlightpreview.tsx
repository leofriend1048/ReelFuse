import React from "react";
import { cn } from "@/utils/cn";
import { Spotlight } from "./ui/spotlight";
import openaiwhite from '../public/openaiwhite.svg'
import Image from "next/image";
import { Button } from "./ui/button";
import Link from "next/link"



export function SpotlightPreview() {
  return (
    <div className="h-[40rem] w-full rounded-md flex md:items-center md:justify-center bg-black/[0.96] antialiased bg-grid-white/[0.02] relative overflow-hidden">
      <Spotlight
        className="-top-40 left-0 md:left-60 md:-top-20"
        fill="white"
      />
      <div className="p-4 max-w-7xl  mx-auto relative z-10  w-full pt-20 md:pt-0">
        <h1 className="text-4xl md:text-7xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400 bg-opacity-50">
        The Next Generation Winning Ad Workflow
        </h1>
        <p className="mt-6 text-xl leading-8 text-neutral-300 inline-block text-center">
              <span>Reel Fuse is a generative AI video tool that repurposes your existing library of footage into direct response ads in one click.</span>
              <span className="text-xl leading-8 text-neutral-300"> Powered by <Image className="inline-block" src={openaiwhite} alt="OpenAI Logo"/> </span>
        </p>
        <div className="flex justify-center pt-8">
        <Button className="w-64 text-md" variant="outline" asChild>
      <Link href="/bot">Get Access</Link>
    </Button>
        </div>
      </div>
    </div>
  );
}
