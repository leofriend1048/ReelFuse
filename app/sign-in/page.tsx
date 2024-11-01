import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import { login, signup, signInWithGoogle } from './actions'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"



export const metadata: Metadata = {
  title: "Login",
  description: "Login to your account",
}


export default function LoginPage() {

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Link
        href="/"
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "absolute left-4 top-4 md:left-8 md:top-8"
        )}
      >
        <>
        <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </>
      </Link>
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">

          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-gray-500">
            Enter your email to sign in to your account
          </p>
        </div>
       
        <form className="pt-0 space-y-2">
      <div className="pt-0 space-y-2">
      <div className="space-y-1">
      <Input className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300" placeholder="name@email.com" id="email" name="email" type="email" required />
      </div>
      <div className="space-y-1">
      <Input className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-5 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300" placeholder="Password" id="password" name="password" type="password" required />
      </div>
      </div>
      <div className="flex items-center pt-4">
      <Button className="w-full" formAction={login}>Sign In with Email</Button>
      </div>
      
    </form>

        <div className="relative flex items-center">
          <span className="flex-grow border-t mr-2"></span>
          <span className="text-xs text-gray-500 mx-2">OR CONTINUE WITH</span>
          <span className="flex-grow border-t ml-2"></span>
        </div>

        <form action={signInWithGoogle} className="w-full">
          <Button type="submit" variant="outline" className="w-full flex items-center justify-center">
      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="mr-2 h-4 w-4">
        <g>
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
          <path fill="none" d="M0 0h48v48H0z"></path>
        </g>
      </svg>
      Google
    </Button>
        </form>

        <p className="px-8 text-center text-sm text-gray-500">
          <Link
            href="/register"
            className="hover:text-brand underline underline-offset-4"
          >
            Don&apos;t have an account? Sign Up
          </Link>
        </p>
        

      </div>
      
    </div>
  )
}