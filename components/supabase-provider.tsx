"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/components/ui/use-toast"
import type { RealtimeChannel } from "@supabase/supabase-js"

type SupabaseContext = {
  supabase: ReturnType<typeof createClientComponentClient>
  user: any
  subscribeToChannel: (channelId: string, callback: (payload: any) => void) => RealtimeChannel
  unsubscribeFromChannel: (channel: RealtimeChannel) => void
}

const Context = createContext<SupabaseContext | undefined>(undefined)

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)

      const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        setUser(session?.user ?? null)
      })

      return () => {
        authListener.subscription.unsubscribe()
      }
    }

    getUser()
  }, [supabase.auth])

  const subscribeToChannel = (channelId: string, callback: (payload: any) => void) => {
    const channel = supabase
      .channel(`channel-${channelId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "channel_messages",
          filter: `channel_id=eq.${channelId}`,
        },
        callback,
      )
      .subscribe((status) => {
        if (status !== "SUBSCRIBED") {
          toast({
            title: "Realtime connection issue",
            description: "Could not connect to realtime updates",
            variant: "destructive",
          })
        }
      })

    return channel
  }

  const unsubscribeFromChannel = (channel: RealtimeChannel) => {
    supabase.removeChannel(channel)
  }

  const value: SupabaseContext = {
    supabase: supabase as ReturnType<typeof createClientComponentClient>,
    user,
    subscribeToChannel,
    unsubscribeFromChannel,
  }

  return <Context.Provider value={value}>{!loading && children}</Context.Provider>
}

export function useSupabase() {
  const context = useContext(Context)
  if (context === undefined) {
    throw new Error("useSupabase must be used inside SupabaseProvider")
  }
  return context
}

