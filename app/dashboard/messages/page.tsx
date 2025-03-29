import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { MessagesOverview } from "@/components/messages/messages-overview"

export default async function MessagesPage() {
  const supabase = createServerComponentClient({ cookies })

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/login")
  }

  // Fetch user's conversations with explicit profile joins
  const { data: conversations } = await supabase
    .from("conversations")
    .select(`
      *,
      user1_profile:profiles!conversations_user1_id_fkey(id, username, full_name, avatar_url, email),
      user2_profile:profiles!conversations_user2_id_fkey(id, username, full_name, avatar_url, email)
    `)
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .order("updated_at", { ascending: false })

  return <MessagesOverview conversations={conversations || []} currentUser={user} />
}