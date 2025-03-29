import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect, notFound } from "next/navigation"
import { ChannelChat } from "@/components/groups/channel-chat"

export default async function ChannelPage({
  params,
}: {
  params: { groupId: string; channelId: string }
}) {
  const supabase = createServerComponentClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // Fetch channel details
  const { data: channel } = await supabase
    .from("channels")
    .select("*")
    .eq("id", params.channelId)
    .eq("group_id", params.groupId)
    .single()

  if (!channel) {
    notFound()
  }

  // Fetch group details
  const { data: group } = await supabase.from("groups").select("*, roles(*)").eq("id", params.groupId).single()

  if (!group) {
    notFound()
  }

  // Check if user is a member of this group
  const { data: membership } = await supabase
    .from("group_members")
    .select("*")
    .eq("group_id", params.groupId)
    .eq("user_id", session.user.id)
    .single()

  if (!membership) {
    redirect("/dashboard")
  }

  // Check if user has access to this channel
  if (channel.allowed_role_ids && channel.allowed_role_ids.length > 0) {
    const hasAccess = channel.allowed_role_ids.some((roleId) => membership.role_ids.includes(roleId))

    if (!hasAccess) {
      redirect(`/dashboard/groups/${params.groupId}`)
    }
  }

  // Fetch messages for this channel
  const { data: messages } = await supabase
    .from("channel_messages")
    .select("*, profiles(*)")
    .eq("channel_id", params.channelId)
    .order("created_at", { ascending: true })

  // Fetch members of this group with their profiles
  const { data: members } = await supabase.from("group_members").select("*, profiles(*)").eq("group_id", params.groupId)

  return (
    <ChannelChat
      channel={channel}
      group={group}
      messages={messages || []}
      members={members || []}
      currentUser={session.user}
    />
  )
}

