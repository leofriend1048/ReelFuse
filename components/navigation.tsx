"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from 'next/navigation'
import Image from "next/image"
import { Check, ChevronsUpDown, PlusCircle, Loader2 } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { cn } from "@/lib/utils"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Workspace = {
  id: string
  name: string
  logo_url: string
}

const components: { title: string; href: string; description: string }[] = [
  {
    title: "Rendered Videos",
    href: "/videos",
    description: "All final videos",
  },
  {
    title: "Modular Content",
    href: "/library",
    description: "All modular, unedited videos",
  },
]

function Navigation() {
  const supabase = createClient()
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [selectedWorkspace, setSelectedWorkspace] = React.useState<Workspace | null>(null)
  const [workspaces, setWorkspaces] = React.useState<Workspace[]>([])
  const [newWorkspace, setNewWorkspace] = React.useState({
    id: "",
    name: "",
    logoFile: null as File | null,
  })

  React.useEffect(() => {
    const fetchWorkspaces = async () => {
      const { data, error } = await supabase.from("workspaces").select("*")
      if (data) {
        setWorkspaces(data)
        const currentWorkspace = data.find((workspace) => workspace.id === pathname.split("/")[1])
        setSelectedWorkspace(currentWorkspace || data[0])
      }
      if (error) console.error("Error loading workspaces:", error.message)
    }

    fetchWorkspaces()
  }, [pathname, supabase])

  const handleSelectWorkspace = (workspace: Workspace) => {
    setSelectedWorkspace(workspace)
    setOpen(false)
    router.push(`/${workspace.id}/library`)
  }

  const handleCreateWorkspace = async () => {
    setLoading(true)
    if (newWorkspace.logoFile) {
      const fileName = encodeURIComponent(newWorkspace.logoFile.name)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, newWorkspace.logoFile)
      
      if (uploadError) {
        console.error("Error uploading logo:", uploadError.message)
        setLoading(false)
        return
      }

      const logoUrl = `https://uwfllbptpdqoovbeizya.supabase.co/storage/v1/object/public/avatars/${fileName}`;

      const { data, error } = await supabase.from("workspaces").insert([
        {
          id: newWorkspace.id,
          name: newWorkspace.name,
          logo_url: logoUrl,
        },
      ])

      if (error) {
        console.error("Error creating workspace:", error.message)
        setLoading(false)
      } else {
        setWorkspaces((prev) => [...prev, { ...newWorkspace, logo_url: uploadData?.path }])
        setDialogOpen(false)
        setNewWorkspace({ id: "", name: "", logoFile: null })
        router.push(`/${newWorkspace.id}/library`)
      }
    } else {
      setLoading(false)
    }
  }

  function generateIdFromName(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-")
  }

  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Libraries</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
              {components.map((component) => (
                <ListItem
                  key={component.title}
                  title={component.title}
                  href={component.href}
                >
                  {component.description}
                </ListItem>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <Link href="/bot" legacyBehavior passHref>
            <NavigationMenuLink className={navigationMenuTriggerStyle()}>
              AI Ad Assistant
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>
        {pathname && pathname.includes("/library") && (
          <NavigationMenuItem>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-[230px] focus:outline-none focus:ring-0"
                >
                  {selectedWorkspace ? (
                    <>
                      <Image
                        src={selectedWorkspace.logo_url}
                        alt={`${selectedWorkspace.name} logo`}
                        className="mr-2 rounded-full"
                        width={20}
                        height={20}
                      />
                      {selectedWorkspace.name}
                    </>
                  ) : (
                    "Select workspace..."
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[230px] p-0 focus:outline-none focus:ring-0">
                <Command>
                  <CommandInput placeholder="Search workspace..." className="focus:outline-none focus:ring-0" />
                  <CommandEmpty>No workspace found.</CommandEmpty>
                  <div className="px-3 py-2 text-xs text-muted-foreground">
                    Select a workspace to switch to:
                  </div>
                  <CommandGroup>
                    {workspaces.map((workspace) => (
                      <CommandItem
                        key={workspace.id}
                        onSelect={() => handleSelectWorkspace(workspace)}
                        className="focus:outline-none focus:ring-0"
                      >
                        <Image
                          src={workspace.logo_url}
                          alt={`${workspace.name} logo`}
                          className="mr-2 rounded-full"
                          width={20}
                          height={20}
                        />
                        {workspace.name}
                        <Check
                          className={cn(
                            "ml-auto h-4 w-4",
                            selectedWorkspace?.id === workspace.id
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
                <Button
                  variant="link"
                  onClick={() => setDialogOpen(true)}
                  className="w-full mt-2"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create New Workspace
                </Button>
              </PopoverContent>
            </Popover>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Workspace</DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleCreateWorkspace()
                  }}
                >
                  <Input
                    placeholder="Workspace Name"
                    value={newWorkspace.name}
                    onChange={(e) => {
                      const name = e.target.value
                      setNewWorkspace({
                        ...newWorkspace,
                        name,
                        id: generateIdFromName(name),
                      })
                    }}
                    required
                    className="mb-4"
                  />
                  <Input
                    placeholder="Workspace ID"
                    value={newWorkspace.id}
                    readOnly
                    className="mb-4"
                  />
                  <div className="grid w-full max-w-sm items-center gap-1.5 mb-4">
                    <Label htmlFor="logoFile">Upload Logo</Label>
                    <Input
                      id="logoFile"
                      type="file"
                      onChange={(e) =>
                        setNewWorkspace({
                          ...newWorkspace,
                          logoFile: e.target.files ? e.target.files[0] : null,
                        })
                      }
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    ) : (
                      "Create Workspace"
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </NavigationMenuItem>
        )}
      </NavigationMenuList>
    </NavigationMenu>
  )
}

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  )
})
ListItem.displayName = "ListItem"

export default Navigation
