import { SignUp } from "@clerk/nextjs";
import Navbar from "@/components/navbar";
 

export default function Home() {
  return (
    <main className="flex min-h flex-col items-center p-20 flex flex-col space-y-10">
      <Navbar/>
      <SignUp />
    </main>
  )
}
