import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import type { User } from "@supabase/supabase-js"

interface Profile {
  id: string
  username?: string
  full_name?: string
  avatar_url?: string
  email?: string
}

interface Conversation {
  id: string
  user1_id: string
  user2_id: string
  created_at: string
  updated_at: string
  last_message?: string
  user1_profile: Profile
  user2_profile: Profile
}

interface MessagesOverviewProps {
  conversations: Conversation[]
  currentUser: User
}

export function MessagesOverview({ conversations, currentUser }: MessagesOverviewProps) {
  // Helper to get the other user's profile in a conversation
  const getOtherUser = (conversation: Conversation) => {
    return conversation.user1_id === currentUser.id 
      ? conversation.user2_profile 
      : conversation.user1_profile
  }

  // Get initials from name or email
  const getInitials = (profile?: Profile) => {
    if (!profile) return "U"

    if (profile.full_name) {
      return profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    } else if (profile.email) {
      return profile.email.substring(0, 2).toUpperCase()
    }
    return "U"
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
        <Button asChild>
          <Link href="/dashboard/search">New Conversation</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Conversations</CardTitle>
          <CardDescription>Recent message exchanges with team members</CardDescription>
        </CardHeader>
        <CardContent>
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-muted-foreground">No conversations yet</p>
              <Button asChild className="mt-4">
                <Link href="/dashboard/search">Start a Conversation</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {conversations.map((conversation) => {
                const otherUser = getOtherUser(conversation)
                return (
                  <Link key={conversation.id} href={`/dashboard/messages/${conversation.id}`} className="block">
                    <div className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarImage src={otherUser?.avatar_url || "/placeholder.svg?height=40&width=40"} />
                          <AvatarFallback>{getInitials(otherUser)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {otherUser?.full_name || otherUser?.username || otherUser?.email || "Unknown User"}
                          </p>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {conversation.last_message || "No messages yet"}
                          </p>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(conversation.updated_at), { addSuffix: true })}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}