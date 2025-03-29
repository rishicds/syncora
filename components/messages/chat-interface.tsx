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
import { ArrowLeft, Info, MoreVertical, Send, Smile, Paperclip, Bot, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { generateText } from "ai"
import { gemini } from "@ai-sdk/gemini"

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
  isNew?: boolean
}

interface Conversation {
  id: string
  user1_id: string
  user2_id: string
  created_at: string
  updated_at: string
  otherUserProfile: Profile
}

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
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Get the other user in the conversation with robust error handling
  const otherUser = conversation.otherUserProfile || {
    id: "unknown",
    username: "Unknown User",
    full_name: "Unknown User",
    avatar_url: "/placeholder.svg?height=32&width=32",
    email: "unknown@example.com",
  }

  // Get initials from name or email with robust fallback
  const getInitials = (profile?: Profile) => {
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

    // Optimistically add message to UI immediately
    const tempId = `temp-${Date.now()}`
    const tempMessage: Message = {
      id: tempId,
      conversation_id: conversation.id,
      sender_id: currentUser.id,
      content: newMessage,
      created_at: new Date().toISOString(),
      profiles: {
        id: currentUser.id,
        full_name: currentUser.user_metadata?.full_name,
        avatar_url: currentUser.user_metadata?.avatar_url,
      } as Profile,
      isNew: true,
    }

    setMessages((prev) => [...prev, tempMessage])
    setNewMessage("")

    // Focus back on textarea
    textareaRef.current?.focus()

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

      // Replace temp message with real one
      if (data && data[0]) {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === tempId ? { ...data[0], profiles: tempMessage.profiles } : msg)),
        )
      }
    } catch (error: any) {
      // Remove temp message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId))

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
      // Format conversation for Gemini
      const conversationText = messages
        .map((msg) => {
          const sender = msg.sender_id === currentUser.id ? "Me" : otherUser.full_name || "Other"
          return `${sender}: ${msg.content}`
        })
        .join("\n")

      // Generate summary using Gemini
      const { text: aiSummary } = await generateText({
        model: gemini("gemini-pro"),
        prompt: `Summarize the following conversation in a concise paragraph highlighting the key points:\n\n${conversationText}`,
      })

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
    } catch (error: any) {
      toast({
        title: "Error generating summary",
        description: error.message || "Failed to generate summary",
        variant: "destructive",
      })
    } finally {
      setIsSummarizing(false)
    }
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-3 backdrop-blur-sm bg-background/80 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/messages")} className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Avatar className="h-8 w-8 ring-2 ring-background">
            <AvatarImage src={otherUser.avatar_url || "/placeholder.svg?height=32&width=32"} />
            <AvatarFallback>{getInitials(otherUser)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">
              {otherUser.full_name || otherUser.username || otherUser.email || "Unknown User"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSummarize}
            disabled={isSummarizing}
            className="h-8 w-8 relative"
          >
            {isSummarizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
            <span className="sr-only">AI Summary</span>
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Info className="h-4 w-4" />
            <span className="sr-only">Info</span>
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">More</span>
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-3 space-y-3 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">No messages yet</p>
            <p className="text-sm text-muted-foreground">Send a message to start the conversation</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex group",
                message.sender_id === currentUser.id ? "justify-end" : "justify-start",
                message.isNew && "animate-fade-in",
              )}
            >
              <div className="flex max-w-[80%] gap-2 relative">
                {message.sender_id !== currentUser.id && message.sender_id !== "ai-assistant" && (
                  <Avatar className="h-8 w-8 mt-1 opacity-90">
                    <AvatarImage src={message.profiles?.avatar_url || "/placeholder.svg?height=32&width=32"} />
                    <AvatarFallback>{getInitials(message.profiles)}</AvatarFallback>
                  </Avatar>
                )}

                {message.sender_id === "ai-assistant" && (
                  <Avatar className="h-8 w-8 mt-1">
                    <AvatarFallback className="bg-secondary text-secondary-foreground">AI</AvatarFallback>
                  </Avatar>
                )}

                <div>
                  <Card
                    className={cn(
                      "p-2.5 shadow-sm transition-all",
                      message.sender_id === currentUser.id
                        ? "bg-primary text-primary-foreground rounded-tr-none"
                        : message.sender_id === "ai-assistant"
                          ? "bg-secondary text-secondary-foreground rounded-tl-none"
                          : "rounded-tl-none",
                      message.isNew && "animate-slide-up",
                    )}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </Card>
                  <p className="mt-1 text-xs text-muted-foreground opacity-70">
                    {new Date(message.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                {/* Summary button on the side of each message */}
                {message.sender_id !== "ai-assistant" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity absolute -right-7 top-1"
                    onClick={handleSummarize}
                    disabled={isSummarizing}
                  >
                    <Bot className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-3 backdrop-blur-sm bg-background/80 sticky bottom-0">
        <div className="flex items-end gap-2 relative">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
            <Paperclip className="h-4 w-4" />
            <span className="sr-only">Attach</span>
          </Button>
          <Textarea
            ref={textareaRef}
            placeholder="Type a message..."
            className="min-h-10 max-h-32 resize-none text-sm py-2 px-3 rounded-xl"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
          />
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
            <Smile className="h-4 w-4" />
            <span className="sr-only">Emoji</span>
          </Button>
          <Button
            size="icon"
            className={cn("h-8 w-8 shrink-0 transition-all duration-300", !newMessage.trim() && "opacity-50")}
            onClick={handleSendMessage}
            disabled={isLoading || !newMessage.trim()}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

