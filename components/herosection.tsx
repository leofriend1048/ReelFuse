"use client"
import { useState } from 'react';
import { Button } from "@/components/ui/button"
  import { Input } from "@/components/ui/input"
  import Link from 'next/link';
  import Image from 'next/image'
  import dashboard from '../public/dashboard.png'
  import openai from '../public/openai.svg'


  export default function HeroSection() {
    const [email, setEmail] = useState('');
  
    const handleEmailChange = (e) => {
      setEmail(e.target.value);
    };
    return (
      <div className="bg-white">
        <div className="relative isolate px-6 pt-14 lg:px-8">

          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              The Next Generation Winning Ad Workflow

              </h1>
              <p className="mt-6 text-xl leading-8 text-gray-600 inline-block">
              <span>Rebase by Michael Todd Beauty is a generative AI video tool that repurposes your existing library of footage into direct response ads in one click.</span>
              <span className="text-xl leading-8 text-gray-600"> Powered by <Image className="inline-block	"
        src={openai}
        alt="OpenAI Logo"
      />
      </span>
              </p>
              
              <div className="mt-10 flex items-center justify-center gap-x-6">
        <div className="flex w-full max-w-sm items-center space-x-2">
          <Input type="email" placeholder="Work Email" onChange={handleEmailChange} />
          <Button asChild className="h-10 px-4 py-2" type="submit">
            <Link href={`/sign-in?email_address=${encodeURIComponent(email)}`}>Start</Link>
          </Button>
        </div>
      </div>
              <Image
            className="mt-10 shadow-2xl rounded-lg"
        src={dashboard}
        alt="Picture of the author"
        placeholder="blur"
      />
            </div>

            

  <div
            className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
            aria-hidden="true"
          >
            <div
              className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
              style={{
                clipPath:
                  'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
              }}
            />
          </div>
          </div>
          
          <div
            className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
            aria-hidden="true"
          >
            <div
              className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
              style={{
                clipPath:
                  'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
              }}
            />
          </div>
        </div>
      </div>
    )
  }
