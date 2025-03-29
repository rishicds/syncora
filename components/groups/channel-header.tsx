"use client"

import { Button } from "@/components/ui/button"
import type { Channel, Group } from "@/types/group.types"
import { Hash, Mic, Megaphone, Users, Info } from "lucide-react"

interface ChannelHeaderProps {
  channel: Channel
  group: Group
  memberCount: number
  onToggleMembers: () => void
}

export function ChannelHeader({ channel, group, memberCount, onToggleMembers }: ChannelHeaderProps) {
  const getChannelIcon = () => {
    switch (channel.type) {
      case "text":
        return <Hash className="h-5 w-5" />
      case "voice":
        return <Mic className="h-5 w-5" />
      case "announcement":
        return <Megaphone className="h-5 w-5" />
      default:
        return <Hash className="h-5 w-5" />
    }
  }

  return (
    <div className="flex items-center justify-between border-b p-4">
      <div className="flex items-center gap-2">
        {getChannelIcon()}
        <div>
          <h2 className="font-semibold">{channel.name}</h2>
          {channel.description && <p className="text-sm text-muted-foreground">{channel.description}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="flex items-center gap-1" onClick={onToggleMembers}>
          <Users className="h-4 w-4" />
          <span>{memberCount}</span>
        </Button>
        <Button variant="ghost" size="icon">
          <Info className="h-5 w-5" />
          <span className="sr-only">Channel Info</span>
        </Button>
      </div>
    </div>
  )
}

