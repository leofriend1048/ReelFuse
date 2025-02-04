import { redirect } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { createClient } from '@/utils/supabase/server'

export default async function PrivatePage() {
  const supabase = createClient()
  
  const signOut = async () => {
    let { error } = await supabase.auth.signOut();
    if (error) console.log("Sign out error: ", error);
    else window.location.reload();
  };

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    console.error('Error fetching user:', error?.message);
    throw new Error('User not found');
  }
  const userId = data.user.id;

  let { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('full_name, email, avatar_url')
    .eq('id', userId);

    if (profileError) {
      console.error('Error fetching profile:', profileError.message);
      throw new Error(profileError.message);
    }
    if (!profiles?.[0]) {
      throw new Error('Profile not found');
    }

  const fullName = profiles[0].full_name;
  const email = profiles[0].email;
  const avatarUrl = profiles[0].avatar_url;

  return <div>
  <DropdownMenu>
                <DropdownMenuTrigger>
                  <Avatar className="max-w-8 h-8">
                    <AvatarImage src={profiles[0].avatar_url} />
                    <AvatarFallback>LF</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="text-base font-medium">{profiles[0].full_name}</p>
                      <p className="w-[200px] truncate text-sm text-slate-500 font-normal">{profiles[0].email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Dashboard</DropdownMenuItem>
                  <DropdownMenuItem>Billing</DropdownMenuItem>
                  <DropdownMenuItem>Account</DropdownMenuItem>
                  <Separator />
                </DropdownMenuContent>
              </DropdownMenu>
  </div>
}