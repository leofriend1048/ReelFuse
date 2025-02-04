import { Separator } from "@/components/ui/separator"
import { ProfileForm } from "./profile-form"

export default function SettingsProfilePage() {
  return (
    <div className="flex flex-col items-center p-20 space-y-10">
        <div className="space-y-0.5 w-full">
            <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
            <p className="text-slate-500">Manage your account settings and set e-mail preferences.</p>
        </div>
        <Separator />
        <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
          <aside className="-mx-4 w-1/3">
            <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1">
              <a href="/" className="inline-flex items-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:text-accent-foreground h-9 px-4 py-2 bg-[#f4f4f5] justify-start">Profile</a>
              <a href="/" className="inline-flex items-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:text-accent-foreground h-9 px-4 py-2 hover:bg-transparent hover:underline justify-start">welcome</a>
            </nav>
          </aside>
        <div>
      <div className="flex flex-col space-y-2">
        <h3 className="text-lg font-medium">Profile</h3>
        <p className="text-sm text-slate-500">
          This is how others will see you on the site.
        </p>
      </div>
      <Separator className="my-6"/>
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
      <ProfileForm/>
      </div>
      </div>
    </div>
    </div>
  )
}