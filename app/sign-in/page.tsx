import { login, signup } from './actions'
import Navbar from '@/components/navbar'
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"


export default function LoginPage() {
  return (
    <main className="flex min-h flex-col items-center p-20 flex flex-col space-y-10">
          <Navbar/>
          <div className="rounded-lg border border-slate-200 bg-white text-slate-950 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50">
            <div className="flex flex-col space-y-1.5 p-6">
          <CardTitle>Login</CardTitle>
            <CardDescription>
            Enter your email below to login to your account
            </CardDescription>
            </div>
    <form className="p-6 pt-0 space-y-2">
      <div className="pt-0 space-y-2">
      <div className="space-y-1">
      <Label htmlFor="email">Email:</Label>
      <Input className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300" id="email" name="email" type="email" required />
      </div>
      <div className="space-y-1">
      <Label htmlFor="password">Password:</Label>
      <Input className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300" id="password" name="password" type="password" required />
      </div>
      </div>
      <div className="flex items-center pt-4">
      <Button className="w-full" formAction={login}>Log in</Button>
      </div>
    </form>
    </div>
  
    
     
       </main>
  )
}