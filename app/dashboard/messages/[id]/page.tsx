import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect, notFound } from "next/navigation"
import { ChatInterface } from "@/components/messages/chat-interface"

export default async function ChatPage({ params }: { params: { id: string } }) {
  // Ensure params.id is properly handled
  const conversationId = params.id

  // Await the cookies before creating the Supabase client
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  try {
    // Use getUser instead of getSession for more secure authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      redirect("/login")
    }

    console.log("Fetching conversation details:", {
      conversationId,
      currentUserId: user.id
    })

    // Fetch conversation details with explicit profile joins
    const { data: conversation, error: conversationError } = await supabase
      .from("conversations")
      .select(`
        *,
        user1_profile:profiles!conversations_user1_id_fkey(id, username, full_name, avatar_url, email),
        user2_profile:profiles!conversations_user2_id_fkey(id, username, full_name, avatar_url, email)
      `)
      .eq("id", conversationId)
      .single()

    if (conversationError) {
      console.error("Conversation fetch error:", conversationError)
      notFound()
    }

    if (!conversation) {
      console.error("No conversation found for ID:", conversationId)
      notFound()
    }

    // Check if user is part of this conversation
    if (conversation.user1_id !== user.id && conversation.user2_id !== user.id) {
      console.error("User not part of conversation", {
        current_user_id: user.id,
        conversation_user1_id: conversation.user1_id,
        conversation_user2_id: conversation.user2_id
      })
      redirect("/dashboard/messages")
    }

    // Determine the other user's profile
    const otherUserProfile = conversation.user1_id === user.id 
      ? conversation.user2_profile 
      : conversation.user1_profile

    // Fetch messages for this conversation
    const { data: messages, error: messagesError } = await supabase
      .from("messages")
      .select("*, profiles(*)")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })

    if (messagesError) {
      console.error("Messages fetch error:", messagesError)
    }

    return <ChatInterface 
      conversation={{
        ...conversation,
        otherUserProfile
      }} 
      messages={messages || []} 
      currentUser={user} 
    />
  } catch (error) {
    console.error("Unexpected error in chat page:", error)
    notFound()
  }
}