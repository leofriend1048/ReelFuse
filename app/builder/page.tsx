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
import { DatePicker } from '@/components/datepicker'
import AdNameBuilder from '@/components/adnamebuilder'
import Navbar from '@/components/navbar'
import DataTable52 from '@/components/datatable'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'


export default async function Home() {
  return (
    <main className="flex min-h flex-col items-center p-20 flex flex-col space-y-10">
<Navbar />
<AdNameBuilder />
<DataTable52 />

    </main>
  )
}
