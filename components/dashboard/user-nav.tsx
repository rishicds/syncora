"use client"

import type { User } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useSupabase } from "@/components/supabase-provider"
import { LogOut, UserIcon, Settings } from "lucide-react"

interface UserNavProps {
  user: User
}

export function UserNav({ user }: UserNavProps) {
  const router = useRouter()
  const { supabase } = useSupabase()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  // Get initials from email
  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="avatar-orb relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10 border-0">
            <AvatarImage src="/placeholder.svg?height=40&width=40" alt={user.email || ""} />
            <AvatarFallback className="bg-transparent text-white">
              {user.email ? getInitials(user.email) : "U"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="glass w-56 mt-1" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.email}</p>
            <p className="text-xs leading-none text-gray-400">{user.id.substring(0, 8)}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-gray-700" />
        <DropdownMenuItem
          onClick={() => router.push("/dashboard/profile")}
          className="flex items-center cursor-pointer hover:bg-[rgba(var(--accent-color),0.1)]"
        >
          <UserIcon className="mr-2 h-4 w-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => router.push("/dashboard/settings")}
          className="flex items-center cursor-pointer hover:bg-[rgba(var(--accent-color),0.1)]"
        >
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-gray-700" />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="flex items-center cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-900/20"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

 