"use client"

import { useState, useRef, useEffect } from "react"
import type { User } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useSupabase } from "@/components/supabase-provider"
import { ArrowLeft, Info, MoreVertical, Send, Smile, Paperclip, Bot } from "lucide-react"

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

interface Conversation {
  id: string
  user1_id: string
  user2_id: string
  created_at: string
  updated_at: string
  otherUserProfile: Profile  // Add this
}

// Modify the otherUser logic in the component


interface ChatInterfaceProps {
  conversation: Conversation
  messages: Message[]
  currentUser: User
}

export function ChatInterface({ conversation, messages: initialMessages, currentUser }: ChatInterfaceProps) {
  const router = useRouter()
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSummarizing, setIsSummarizing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Get the other user in the conversation with robust error handling
  const otherUser = conversation.otherUserProfile || {
    id: 'unknown',
    username: 'Unknown User',
    full_name: 'Unknown User',
    avatar_url: '/default-avatar.svg',
    email: 'unknown@example.com'
  }

  // Get initials from name or email with robust fallback
  const  getInitials = (profile?: Profile) => {
    if (!profile) return "U"
    
    if (profile.full_name) {
      return profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    } 
    
    if (profile.email) {
      return profile.email?.substring(0, 2).toUpperCase()
    }
    
    if (profile.username) {
      return profile.username.substring(0, 2).toUpperCase()
    }
    
    return "U"
  }

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Set up real-time subscription to messages
  useEffect(() => {
    const channel = supabase
      .channel(`conversation:${conversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversation.id}`,
        },
        async (payload) => {
          // Fetch the complete message with profile info
          const { data } = await supabase.from("messages").select("*, profiles(*)").eq("id", payload.new.id).single()

          if (data) {
            setMessages((prev) => [...prev, data])
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, conversation.id])

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return

    setIsLoading(true)

    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversation.id,
          sender_id: currentUser.id,
          content: newMessage,
        })
        .select()

      if (error) throw error

      // Update the conversation's last_message and updated_at
      await supabase
        .from("conversations")
        .update({
          last_message: newMessage,
          updated_at: new Date().toISOString(),
        })
        .eq("id", conversation.id)

      setNewMessage("")
    } catch (error: any) {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSummarize = async () => {
    if (messages.length < 3) {
      toast({
        title: "Not enough messages",
        description: "Need more messages to generate a summary.",
        variant: "destructive",
      })
      return
    }

    setIsSummarizing(true)

    try {
      // In a real implementation, this would call your AI service
      // For now, we'll simulate a response
      setTimeout(() => {
        const aiSummary =
          "This is an AI-generated summary of the conversation. The participants discussed project requirements, timelines, and next steps. Key points include setting up a meeting next week and sharing documentation."

        // Add the AI summary as a special message
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-summary-${Date.now()}`,
            conversation_id: conversation.id,
            sender_id: "ai-assistant",
            content: aiSummary,
            created_at: new Date().toISOString(),
            profiles: {
              id: "ai-assistant",
              full_name: "AI Assistant",
            } as Profile,
          } as Message,
        ])

        setIsSummarizing(false)
      }, 2000)
    } catch (error: any) {
      toast({
        title: "Error generating summary",
        description: error.message,
        variant: "destructive",
      })
      setIsSummarizing(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/messages")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Avatar className="h-8 w-8">
  <AvatarImage src={otherUser.avatar_url || "/placeholder.svg?height=32&width=32"} />
  <AvatarFallback>{getInitials(otherUser)}</AvatarFallback>
</Avatar>
<div>
  <p className="font-medium">
    {otherUser.full_name || otherUser.username || otherUser.email || "Unknown User"}
  </p>
</div>
          <div>
            <p className="font-medium">
              {otherUser.full_name || otherUser.username || otherUser.email || "Unknown User"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={handleSummarize} disabled={isSummarizing}>
            <Bot className="h-5 w-5" />
            <span className="sr-only">AI Summary</span>
          </Button>
          <Button variant="ghost" size="icon">
            <Info className="h-5 w-5" />
            <span className="sr-only">Info</span>
          </Button>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-5 w-5" />
            <span className="sr-only">More</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">No messages yet</p>
              <p className="text-sm text-muted-foreground">Send a message to start the conversation</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender_id === currentUser.id ? "justify-end" : "justify-start"}`}
              >
                <div className="flex max-w-[80%] gap-2">
                  {message.sender_id !== currentUser.id && message.sender_id !== "ai-assistant" && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={message.profiles?.avatar_url || "/placeholder.svg?height=32&width=32"} />
                      <AvatarFallback>{getInitials(message.profiles)}</AvatarFallback>
                    </Avatar>
                  )}

                  {message.sender_id === "ai-assistant" && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground">AI</AvatarFallback>
                    </Avatar>
                  )}

                  <div>
                    <Card
                      className={`p-3 ${
                        message.sender_id === currentUser.id
                          ? "bg-primary text-primary-foreground"
                          : message.sender_id === "ai-assistant"
                            ? "bg-secondary text-secondary-foreground"
                            : ""
                      }`}
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
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t p-4">
        <div className="flex items-end gap-2">
          <Button variant="ghost" size="icon" className="shrink-0">
            <Paperclip className="h-5 w-5" />
            <span className="sr-only">Attach</span>
          </Button>
          <Textarea
            placeholder="Type a message..."
            className="min-h-10 resize-none"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
          />
          <Button variant="ghost" size="icon" className="shrink-0">
            <Smile className="h-5 w-5" />
            <span className="sr-only">Emoji</span>
          </Button>
          <Button
            size="icon"
            className="shrink-0"
            onClick={handleSendMessage}
            disabled={isLoading || !newMessage.trim()}
          >
            <Send className="h-5 w-5" />
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </div>
    </div>
  )
}