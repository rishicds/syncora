import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import SectorDashboard from "@/components/sectors/SectorDash"

export default async function DashboardPage() {
  const supabase = createServerComponentClient({ cookies })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return redirect("/login")
  }

  // Fetch user profile
  const { data: profile } = await supabase
  .from("profiles")
  .select("id, username, full_name, avatar_url, email, bio, status, created_at, updated_at")
  .eq("id", session.user.id)
  .single()

  // Fetch groups the user is a member of
  const { data: groupMembers } = await supabase
    .from("group_members")
    .select(`
    id,
    group_id,
    user_id,
    role_ids,
    joined_at,
    profiles:user_id(id, username, full_name, avatar_url, email)
  `)
    .eq("user_id", session.user.id)

  const groupIds = groupMembers?.map((member) => member.group_id) || []

  // Fetch groups data
  const { data: groups } = await supabase
    .from("groups")
    .select("*")
    .in("id", groupIds.length > 0 ? groupIds : ["no-groups"])

  // Fetch roles
  const { data: roles } = await supabase
    .from("roles")
    .select("*")
    .in("group_id", groupIds.length > 0 ? groupIds : ["no-groups"])

  return (
    <SectorDashboard
      user={session.user}
      profile={profile}
      groups={groups || []}
      groupMembers={groupMembers || []}
      roles={roles || []}
    />
  )
}

