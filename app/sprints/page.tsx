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



export default async function Home() {
  return (
    <main className="flex min-h flex-col items-center p-20 flex flex-col space-y-10">

<Navbar />
<div className="w-full space-y-5">
<CardTitle>Sprints</CardTitle>
<SprintsSummary />
  </div>

  <div className="w-full space-y-2">
  <CardTitle>All Creatives</CardTitle>

  <CreativeDataTable />

</div>
 
    </main>
  )
}