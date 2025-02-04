"use client"
import React, { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
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

  interface Profile {
    full_name: string;
    email: string;
    avatar_url: string;
  }

const supabase = createClient();

const signOut = async () => {
    let { error } = await supabase.auth.signOut();
    if (error) console.log("Sign out error: ", error);
    else window.location.reload();
  };

  export const Profile = () => {
    const [userId, setUserId] = useState<string | null>(null);
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getUserIdAndFetchData = async () => {
      const response = await supabase.auth.getUser();
      const { data: { user } } = response;
      if (user) {
        const userId = user.id;
        setUserId(userId);

        let { data: profiles, error } = await supabase
          .from('profiles')
          .select('full_name, email, avatar_url')
          .eq('id', userId);

        if (error) {
          console.error('Error fetching data:', error.message);
          throw new Error(error.message);
        } else {
          console.log('Fetched data:', profiles);
          setProfiles(profiles || []); // Ensure profiles is an array
          setIsLoading(false);
        }
      }
    };

    getUserIdAndFetchData();
  }, []);

  return (
    <>
      {isLoading ? (
        <Skeleton className="w-[32px] h-[32px] rounded-full" />
      ) : (
        profiles.length > 0 && (
          <>
            <div className="ring-transparent">
              <DropdownMenu>
                <DropdownMenuTrigger className="ring-transparent">
                  <Avatar className="max-w-6 h-auto ring-transparent">
                    <AvatarImage src={profiles[0].avatar_url} />
                    <AvatarFallback>LF</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="translate-x-5">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="text-base font-medium">{profiles[0].full_name}</p>
                      <p className="w-[200px] truncate text-sm text-slate-500 font-normal">{profiles[0].email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem><a href="/account">Account</a></DropdownMenuItem>
                  <DropdownMenuItem><a href="/account">Billing</a></DropdownMenuItem>
                  <Separator />
                  <DropdownMenuItem onClick={signOut}>Sign Out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        )
      )}
    </>
  );
};

