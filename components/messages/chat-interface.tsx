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
import { ArrowLeft, Info, MoreVertical, Send, Smile, Paperclip, Bot, ImageIcon, Mic } from "lucide-react"
import { MessageActions } from "./message-actions"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

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
  is_ai?: boolean
  ai_type?: "summary" | "simplified"
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
  const [showActionsForMessage, setShowActionsForMessage] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

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

  // Handle click outside to hide message actions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (messagesContainerRef.current && !messagesContainerRef.current.contains(event.target as Node)) {
        setShowActionsForMessage(null)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

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

  const handleAIResponse = (response: string, type: "summary" | "simplified") => {
    // Add the AI response as a special message
    setMessages((prev) => [
      ...prev,
      {
        id: `ai-${type}-${Date.now()}`,
        conversation_id: conversation.id,
        sender_id: "ai-assistant",
        content: response,
        created_at: new Date().toISOString(),
        profiles: {
          id: "ai-assistant",
          full_name: type === "summary" ? "AI Summary" : "AI Simplification",
        } as Profile,
        is_ai: true,
        ai_type: type,
      } as Message,
    ])
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getMessageGroupDate = (index: number) => {
    if (index === 0) return new Date(messages[0].created_at).toLocaleDateString()

    const currentDate = new Date(messages[index].created_at).toLocaleDateString()
    const prevDate = new Date(messages[index - 1].created_at).toLocaleDateString()

    if (currentDate !== prevDate) return currentDate
    return null
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-3 shadow-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard/messages")}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Avatar className="h-10 w-10 border-2 border-primary/10">
            <AvatarImage src={otherUser.avatar_url || "/placeholder.svg?height=40&width=40"} />
            <AvatarFallback className="bg-primary/10 text-primary">{getInitials(otherUser)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">
              {otherUser.full_name || otherUser.username || otherUser.email || "Unknown User"}
            </p>
            <p className="text-xs text-muted-foreground">Active now</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="rounded-full">
            <Info className="h-5 w-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>View Profile</DropdownMenuItem>
              <DropdownMenuItem>Search in Conversation</DropdownMenuItem>
              <DropdownMenuItem>Mute Notifications</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Block User</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-4" ref={messagesContainerRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Bot className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No messages yet</p>
            <p className="text-sm text-muted-foreground">Send a message to start the conversation</p>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((message, index) => {
              const dateHeader = getMessageGroupDate(index)
              const isCurrentUser = message.sender_id === currentUser.id
              const isAI = message.is_ai || message.sender_id === "ai-assistant"

              return (
                <div key={message.id} className="space-y-4">
                  {dateHeader && (
                    <div className="flex justify-center my-4">
                      <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">{dateHeader}</div>
                    </div>
                  )}

                  <div
                    className={`group relative flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                    onMouseEnter={() => !isAI && setShowActionsForMessage(message.id)}
                    onMouseLeave={() => setShowActionsForMessage(null)}
                  >
                    <div className="flex max-w-[80%] gap-2">
                      {!isCurrentUser && !isAI && (
                        <Avatar className="h-8 w-8 mt-1">
                          <AvatarImage src={message.profiles?.avatar_url || "/placeholder.svg?height=32&width=32"} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(message.profiles)}
                          </AvatarFallback>
                        </Avatar>
                      )}

                      {isAI && (
                        <Avatar className="h-8 w-8 mt-1">
                          <AvatarFallback className="bg-secondary text-secondary-foreground">AI</AvatarFallback>
                        </Avatar>
                      )}

                      <div>
                        <Card
                          className={`p-3 ${
                            isCurrentUser
                              ? "bg-primary text-primary-foreground"
                              : isAI
                                ? "bg-secondary border-secondary text-secondary-foreground"
                                : "bg-muted"
                          } ${
                            message.ai_type === "summary"
                              ? "border-l-4 border-l-yellow-500"
                              : message.ai_type === "simplified"
                                ? "border-l-4 border-l-blue-500"
                                : ""
                          }`}
                        >
                          {isAI && (
                            <div className="text-xs font-medium mb-1">
                              {message.profiles?.full_name || "AI Assistant"}
                            </div>
                          )}
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </Card>
                        <p className="mt-1 text-xs text-muted-foreground">{formatDate(message.created_at)}</p>
                      </div>

                      {isCurrentUser && (
                        <Avatar className="h-8 w-8 mt-1">
                          <AvatarImage
                            src={currentUser.user_metadata?.avatar_url || "/placeholder.svg?height=32&width=32"}
                          />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {currentUser.user_metadata?.full_name?.substring(0, 2).toUpperCase() || "ME"}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>

                    {/* AI Actions that appear on hover */}
                    {showActionsForMessage === message.id && !isAI && (
                      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MessageActions
                          conversationId={conversation.id}
                          messages={messages.slice(0, index + 1)}
                          onAIResponseGenerated={handleAIResponse}
                          className="bg-background shadow-md rounded-full p-1"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t p-3">
        <div className="flex items-end gap-2 bg-muted p-2 rounded-lg">
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
              <Paperclip className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
              <ImageIcon className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
              <Mic className="h-5 w-5" />
            </Button>
          </div>
          <Textarea
            ref={textareaRef}
            placeholder="Type a message..."
            className="min-h-10 resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
          />
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
              <Smile className="h-5 w-5" />
            </Button>
            <Button
              size="icon"
              className={`rounded-full h-9 w-9 ${newMessage.trim() ? "bg-primary text-primary-foreground" : "bg-muted-foreground/20 text-muted-foreground"}`}
              onClick={handleSendMessage}
              disabled={isLoading || !newMessage.trim()}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

