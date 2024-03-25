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
import Navbar from '@/components/navbar'
import dashboard from '../public/dashboard.png'
import { SpotlightPreview } from '@/components/spotlightpreview'

export default function Home() {
  
  return (
    <main className="bg-black min-h-screen">
<SpotlightPreview />
    </main>
  )
}
