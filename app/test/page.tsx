'use client';
 
import {
  Message,
  // import as useAssistant:
  experimental_useAssistant as useAssistant,
} from 'ai/react';
import Navbar from '@/components/navbar'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import React, { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client'
import { insertAdData } from '@/app/supabaseService';
import { supabase } from '@/app/supabaseService';


const supabaseUrl = 'https://uwfllbptpdqoovbeizya.supabase.co'; // Replace with your actual Supabase URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3ZmxsYnB0cGRxb292YmVpenlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTk3NTA2NzUsImV4cCI6MjAxNTMyNjY3NX0._fCp3gc4vEDj9k5jme3Jo_cSA3tPhzOPcodcH3Gb65w';

const roleToColorMap: Record<Message['role'], string> = {
  system: 'red',
  user: 'black',
  function: 'blue',
  assistant: 'black',
  data: 'orange',
};
 

export default function Chat() {
  const { status, messages, input, submitMessage, handleInputChange } =
    useAssistant({ api: '/api/assistant' });
 


    const [rendered_video, setVideos] = useState<any[] | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const getData = async () => {
      const { data } = await supabase.from('rendered_videos').select('rendered_video').eq('video_id', 'f0a9dc20-9831-4b54-9f21-ed5aee8efae6') 
      setVideos(data)
    }
    getData()
  }, [])

  return (
    <section>
          <Navbar />
<div className="w-full grid min-h-[400px] md:min-h-[300px] grid-cols-1 md:grid-cols-2 border border-gray-200 dark:border-gray-800">
      <div className="grid gap-4 p-4 md:gap-8 md:p-8">
        <div className="p-4 flex items-center justify-center md:p-10 dark:border-gray-800">
        <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      {messages.map((m: Message) => (
        <div
          key={m.id}
          className="whitespace-pre-wrap"
          style={{ color: roleToColorMap[m.role] }}
        >
          <strong>{`${m.role}: `}</strong>
          {m.role !== 'data' && m.content}
          {m.role === 'data' && (
            <>
              {/* here you would provide a custom display for your app-specific data:*/}
              {(m.data as any).description}
              <br />
              <pre className={'bg-gray-200'}>
                {JSON.stringify(m.data, null, 2)}
              </pre>
            </>
          )}
          <br />
          <br />
        </div>
      ))}
 
      {status === 'in_progress' && (
        <div className="h-8 w-full max-w-md p-2 mb-8 bg-gray-300 dark:bg-gray-600 rounded-lg animate-pulse" />
      )}
 
      <form onSubmit={submitMessage}>
        <input
          disabled={status !== 'awaiting_message'}
          className="fixed bottom-0 w-full max-w-md p-2 mb-8 border border-gray-300 rounded shadow-xl"
          value={input}
          placeholder="Input ad angle here"
          onChange={handleInputChange}
        />
      </form>
      
      
    </div>
        </div>
      </div>
      <div className="grid gap-4 p-4 md:gap-8 md:p-8">
      <div className="p-4 flex items-center justify-center md:p-10">
  {rendered_video && rendered_video.map((video, index) => (
    <video key={index} width="auto" height="240" controls preload="auto">
      <source src={video.rendered_video} type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  ))}
</div>

        <div className="rounded-lg border border-gray-200 p-4 flex items-center justify-center md:p-10 dark:border-gray-800">
  <div className="space-y-2 text-center">
    <h3 className="text-2xl font-bold tracking-tighter sm:text-3xl">Hook</h3>
      <p className="text-gray-500 dark:text-gray-400">This is the hook!
      </p>
  </div>
</div>

        <div className="rounded-lg border border-gray-200 p-4 flex items-center justify-center md:p-10 dark:border-gray-800">
          <div className="space-y-2 text-center">
            <h3 className="text-2xl font-bold tracking-tighter sm:text-3xl">Problem</h3>
            <p className="text-gray-500 dark:text-gray-400"></p>
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 p-4 flex items-center justify-center md:p-10 dark:border-gray-800">
          <div className="space-y-2 text-center">
            <h3 className="text-2xl font-bold tracking-tighter sm:text-3xl">Agitate Problem</h3>
            <p className="text-gray-500 dark:text-gray-400"></p>
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 p-4 flex items-center justify-center md:p-10 dark:border-gray-800">
          <div className="space-y-2 text-center">
            <h3 className="text-2xl font-bold tracking-tighter sm:text-3xl">Product Intro</h3>
            <p className="text-gray-500 dark:text-gray-400"></p>
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 p-4 flex items-center justify-center md:p-10 dark:border-gray-800">
          <div className="space-y-2 text-center">
            <h3 className="text-2xl font-bold tracking-tighter sm:text-3xl">Feature/Benefit</h3>
            <p className="text-gray-500 dark:text-gray-400">Tickets and Help</p>
          </div>
        </div>
      </div>
    </div>

    </section>
  );
}