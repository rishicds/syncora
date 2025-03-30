"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useSupabase } from "../supabase-provider"
import { useToast } from "../ui/use-toast"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { ScrollArea } from "../ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Loader2, Send, User, Hash } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import type { RealtimeChannel } from "@supabase/supabase-js"

export default function ChannelView({
  channel,
  user,
  userRoles,
}: {
  channel: any
  user: any
  userRoles: any[]
}) {
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [messages, setMessages] = useState<any[]>([])
  const [profiles, setProfiles] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const realtimeChannelRef = useRef<RealtimeChannel | null>(null)

  const canSendMessages = userRoles.length > 0

  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from("channel_messages")
        .select("*")
        .eq("channel_id", channel.id)
        .order("created_at", { ascending: true })

      if (error) {
        toast({
          title: "Error loading messages",
          description: error.message,
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      setMessages(data || [])

      // Fetch profiles for all message senders
      const userIds = [...new Set(data?.map((msg) => msg.sender_id) || [])]
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url")
          .in("id", userIds)

        if (profilesData) {
          const profilesMap: Record<string, any> = {}
          profilesData.forEach((profile) => {
            profilesMap[profile.id] = profile
          })
          setProfiles(profilesMap)
        }
      }

      setLoading(false)
      scrollToBottom()
    }

    if (channel) {
      fetchMessages()

      // Set up realtime subscription
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current)
      }

      realtimeChannelRef.current = supabase
        .channel(`channel-messages-${channel.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "channel_messages",
            filter: `channel_id=eq.${channel.id}`,
          },
          async (payload) => {
            const newMessage = payload.new as any

            // Fetch profile if we don't have it
            if (!profiles[newMessage.sender_id]) {
              const { data } = await supabase
                .from("profiles")
                .select("id, username, full_name, avatar_url")
                .eq("id", newMessage.sender_id)
                .single()

              if (data) {
                setProfiles((prev) => ({
                  ...prev,
                  [data.id]: data,
                }))
              }
            }

            setMessages((prev) => [...prev, newMessage])
            scrollToBottom()
          },
        )
        .subscribe()
    }

    return () => {
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current)
      }
    }
  }, [supabase, channel, toast])

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 100)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!message.trim() || !canSendMessages) return

    setSending(true)

    try {
      const { error } = await supabase.from("channel_messages").insert({
        channel_id: channel.id,
        sender_id: user.id,
        content: message.trim(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (error) throw error

      setMessage("")
    } catch (error: any) {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-4">
        <h2 className="text-lg font-semibold flex items-center">
          <Hash className="mr-2 h-5 w-5" />
          {channel.name}
        </h2>
        {channel.description && <p className="text-sm text-muted-foreground">{channel.description}</p>}
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <ScrollArea className="flex-1 p-4">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Hash className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Welcome to #{channel.name}</h3>
              <p className="text-muted-foreground max-w-md mt-2">
                This is the start of the channel. Send a message to get the conversation going!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => {
                const profile = profiles[msg.sender_id]
                const isCurrentUser = msg.sender_id === user.id

                return (
                  <div key={msg.id} className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatar_url} alt={profile?.username || "User"} />
                      <AvatarFallback>
                        <User size={16} />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {profile?.username || profile?.full_name || "Unknown User"}
                          {isCurrentUser && " (you)"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="mt-1">{msg.content}</p>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        <form onSubmit={handleSendMessage} className="p-4 border-t">
          <div className="flex items-center gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={canSendMessages ? `Message #${channel.name}` : "You don't have permission to send messages"}
              disabled={sending || !canSendMessages}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={sending || !message.trim() || !canSendMessages}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

