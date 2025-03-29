import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"

interface Profile {
  id: string
  username?: string
  full_name?: string
  avatar_url?: string
  email?: string
}

interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
  profiles: Profile
}

interface MessageListProps {
  messages: Message[]
  currentUserId: string
}

export function MessageList({ messages, currentUserId }: MessageListProps) {
  // Get initials from name or email
  const getInitials = (profile: Profile) => {
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
    <div className="space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.sender_id === currentUserId ? "justify-end" : "justify-start"}`}
        >
          <div className="flex max-w-[80%] gap-2">
            {message.sender_id !== currentUserId && (
              <Avatar className="h-8 w-8">
                <AvatarImage src={message.profiles?.avatar_url || "/placeholder.svg?height=32&width=32"} />
                <AvatarFallback>{getInitials(message.profiles)}</AvatarFallback>
              </Avatar>
            )}

            <div>
              <Card
                className={`p-3 ${message.sender_id === currentUserId ? "bg-primary text-primary-foreground" : ""}`}
              >
                <p className="text-sm">{message.content}</p>
              </Card>
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(message.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

