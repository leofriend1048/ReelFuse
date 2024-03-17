'use client';
 
import { useChat } from 'ai/react';
import Image from 'next/image'
import { buttonVariants } from "@/components/ui/button"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from '@/components/ui/input'
import AdNameBuilder from '@/components/adnamebuilder'
import Navbar from '@/components/navbar'
import DataTable52 from '@/components/datatable'
import { ArrowUpIcon, ThickArrowUpIcon } from '@radix-ui/react-icons'
import { ArrowUp } from 'lucide-react'
import { ArrowDown } from 'lucide-react'
import { AreaChart } from "@tremor/react";
import SprintsSummary from '@/components/sprintssummary'
import CreativeDataTable from '@/components/creativedatatable'


import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'


export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat();

  return (

    <main className="flex min-h flex-col items-center p-20 flex flex-col space-y-10">
    <Navbar />
    <div className="w-full space-y-5">
     <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      {messages.map(m => (
        <div key={m.id} className="whitespace-pre-wrap">
          {m.role === 'user' ? 'User: ' : 'AI: '}
          {m.content}
        </div>
      ))}
 
      <form onSubmit={handleSubmit}>
        <input
          className="fixed bottom-0 w-full max-w-md p-2 mb-8 border border-gray-300 rounded shadow-xl"
          value={input}
          placeholder="Say something..."
          onChange={handleInputChange}
        />
      </form>
    </div>
      </div>
        </main>
  );
}