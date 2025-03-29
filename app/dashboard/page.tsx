import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { DashboardOverview } from "@/components/dashboard/overview"

export default async function DashboardPage() {
  const supabase = createServerComponentClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // Fetch user's recent conversations
  const { data: conversations } = await supabase
    .from("conversations")
    .select("*")
    .or(`user1_id.eq.${session.user.id},user2_id.eq.${session.user.id}`)
    .order("updated_at", { ascending: false })
    .limit(5)

  return <DashboardOverview conversations={conversations || []} />
}

