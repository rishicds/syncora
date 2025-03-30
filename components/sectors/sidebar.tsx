"use client"

import type React from "react"
import { User } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Button } from "../ui/button"
import { ScrollArea } from "../ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"

export default function Sidebar({
  user,
  profile,
  groups,
  onGroupSelect,
  selectedGroup,
  onSignOut,
  children,
}: {
  user: any
  profile: any
  groups: any[]
  onGroupSelect: (group: any) => void
  selectedGroup: any
  onSignOut: () => void
  children: React.ReactNode
}) {
  return (
    <div className="w-64 border-r flex flex-col h-full">
      <div className="p-4 border-b flex items-center justify-between">
        <h1 className="font-bold text-xl">SECTORS</h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.avatar_url} alt={profile?.username || user.email} />
                <AvatarFallback>
                  <User size={16} />
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => {}}>Profile</DropdownMenuItem>
            <DropdownMenuItem onClick={() => {}}>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onSignOut}>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {children}

      <ScrollArea className="flex-1">
        <div className="p-2">
          <h2 className="text-sm font-semibold mb-2 px-2">YOUR SECTORS</h2>
          <div className="space-y-1">
            {groups.map((group) => (
              <Button
                key={group.id}
                variant={selectedGroup?.id === group.id ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => onGroupSelect(group)}
              >
                <Avatar className="h-6 w-6 mr-2">
                  <AvatarImage src={group.icon_url} alt={group.name} />
                  <AvatarFallback className="text-xs">{group.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="truncate">{group.name}</span>
              </Button>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}

