"use client"

import { useState } from "react"
import type { User } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { useSupabase } from "@/components/supabase-provider"
import { Search, MessageSquare } from "lucide-react"

interface UserSearchProps {
  currentUser: User
}

interface Profile {
  id: string
  username?: string
  full_name?: string
  avatar_url?: string
  email?: string
}

export function UserSearch({ currentUser }: UserSearchProps) {
  const router = useRouter()
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isStartingConversation, setIsStartingConversation] = useState(false)

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

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    setSearchResults([])

    try {
      // Search by email
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .ilike("email", `%${searchQuery}%`)
        .neq("id", currentUser.id)
        .limit(10)

      if (error) throw error

      setSearchResults(data || [])

      if (data.length === 0) {
        toast({
          title: "No users found",
          description: "Try a different search term",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error searching users",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSearching(false)
    }
  }

  const startConversation = async (userId: string) => {
    setIsStartingConversation(true)

    try {
      // Check if conversation already exists
      const { data: existingConversation, error: existingError } = await supabase
        .from("conversations")
        .select("*")
        .or(
          `and(user1_id.eq.${currentUser.id},user2_id.eq.${userId}),and(user1_id.eq.${userId},user2_id.eq.${currentUser.id})`,
        )
        .maybeSingle()

      if (existingError) throw existingError

      if (existingConversation) {
        // Conversation exists, navigate to it
        console.log("Existing conversation found:", existingConversation.id)
        router.push(`/dashboard/messages/${existingConversation.id}`)
        return
      }

      // Create new conversation
      const { data: newConversation, error } = await supabase
        .from("conversations")
        .insert({
          user1_id: currentUser.id,
          user2_id: userId,
        })
        .select()
        .single()

      if (error) throw error

      console.log("New conversation created:", newConversation)
      console.log("Navigating to:", `/dashboard/messages/${newConversation.id}`)

      // Navigate to the new conversation
      router.push(`/dashboard/messages/${newConversation.id}`)
    } catch (error: any) {
      console.error("Conversation creation error:", error)
      toast({
        title: "Error starting conversation",
        description: error.message,
        variant: "destructive",
      })
      setIsStartingConversation(false)
    }
  }


  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Find Users</h1>

      <Card>
        <CardHeader>
          <CardTitle>Search Users</CardTitle>
          <CardDescription>Find users by email to start a conversation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Search by email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch()
                }
              }}
            />
            <Button onClick={handleSearch} disabled={isSearching}>
              <Search className="mr-2 h-4 w-4" />
              {isSearching ? "Searching..." : "Search"}
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="mt-6 space-y-4">
              <h3 className="font-medium">Search Results</h3>
              {searchResults.map((profile) => (
                <div key={profile.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={profile.avatar_url || "/placeholder.svg?height=40&width=40"} />
                      <AvatarFallback>{getInitials(profile)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{profile.full_name || profile.username || profile.email}</p>
                      <p className="text-sm text-muted-foreground">{profile.email}</p>
                    </div>
                  </div>
                  <Button onClick={() => startConversation(profile.id)} disabled={isStartingConversation}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Message
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

