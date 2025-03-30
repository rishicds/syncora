"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "../supabase-provider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import ChannelList from "./channel-list"
import ChannelView from "./channel-view"
import GroupSettings from "./group-settings"
import GroupMembers from "./group-members"
import { hasPermission } from "@/lib/permissions"
import { Menu, X } from "lucide-react"
import { Button } from "../ui/button"

export default function GroupView({
  group,
  user,
  roles,
  userRoleIds,
}: {
  group: any
  user: any
  roles: any[]
  userRoleIds: string[]
}) {
  const { supabase } = useSupabase()
  const [channels, setChannels] = useState<any[]>([])
  const [selectedChannel, setSelectedChannel] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("channels")
  const [loading, setLoading] = useState(true)
  const [members, setMembers] = useState<any[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const userRoles = roles.filter((role) => userRoleIds.includes(role.id))
  const canManageChannels = hasPermission(userRoles, "manage_channels")
  const canManageRoles = hasPermission(userRoles, "manage_roles")
  const canManageMembers = hasPermission(userRoles, "manage_members")
  const isOwner = group.owner_id === user.id

  useEffect(() => {
    const fetchChannels = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from("channels")
        .select("*")
        .eq("group_id", group.id)
        .order("created_at", { ascending: true })

      if (!error && data) {
        setChannels(data)
        if (data.length > 0 && !selectedChannel) {
          setSelectedChannel(data[0])
        }
      }
      setLoading(false)
    }

    const fetchMembers = async () => {
      const { data: membersData, error: membersError } = await supabase
        .from("group_members")
        .select(`
      id,
      user_id,
      role_ids,
      joined_at,
      profiles:user_id(id, username, full_name, avatar_url, email)
    `)
        .eq("group_id", group.id)

      if (!membersError && membersData) {
        // Ensure profiles data is properly loaded
        const membersWithProfiles = membersData.map((member) => {
          if (!member.profiles) {
            // If profiles is null, create a placeholder
            return {
              ...member,
              profiles: { id: member.user_id },
            }
          }
          return member
        })
        setMembers(membersWithProfiles)
      }
    }

    if (group) {
      fetchChannels()
      fetchMembers()
    }

    // Set up realtime subscription for channels
    const channelsSubscription = supabase
      .channel("public:channels")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "channels",
          filter: `group_id=eq.${group.id}`,
        },
        () => {
          fetchChannels()
        },
      )
      .subscribe()

    // Set up realtime subscription for members
    const membersSubscription = supabase
      .channel("public:group_members")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "group_members",
          filter: `group_id=eq.${group.id}`,
        },
        () => {
          fetchMembers()
        },
      )
      .subscribe()

    // Handle responsive layout
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false)
      } else {
        setSidebarOpen(true)
      }
    }

    // Set initial state based on window size
    handleResize()

    // Add event listener for window resize
    window.addEventListener('resize', handleResize)

    return () => {
      supabase.removeChannel(channelsSubscription)
      supabase.removeChannel(membersSubscription)
      window.removeEventListener('resize', handleResize)
    }
  }, [supabase, group, selectedChannel])

  const handleChannelSelect = (channel: any) => {
    setSelectedChannel(channel)
    // Auto-close sidebar on mobile after selection
    if (window.innerWidth < 768) {
      setSidebarOpen(false)
    }
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold truncate">{group.name}</h1>
          <p className="text-sm text-muted-foreground truncate max-w-md">{group.description}</p>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar}
          className="md:hidden"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar with overlay on mobile */}
        <div 
          className={`${
            sidebarOpen 
              ? "absolute md:relative inset-0 z-10 md:z-auto bg-background md:w-64 md:flex" 
              : "hidden md:block md:w-64"
          } border-r flex flex-col overflow-hidden`}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="channels" className="flex-1 text-xs md:text-sm">
                Channels
              </TabsTrigger>
              <TabsTrigger value="members" className="flex-1 text-xs md:text-sm">
                Members
              </TabsTrigger>
              {(isOwner || canManageRoles || canManageChannels) && (
                <TabsTrigger value="settings" className="flex-1 text-xs md:text-sm">
                  Settings
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="channels" className="flex-1 overflow-hidden flex flex-col">
              <ChannelList
                channels={channels}
                selectedChannel={selectedChannel}
                onChannelSelect={handleChannelSelect}
                groupId={group.id}
                canManageChannels={canManageChannels}
                loading={loading}
              />
            </TabsContent>

            <TabsContent value="members" className="flex-1 overflow-hidden">
              <GroupMembers
                members={members}
                roles={roles}
                groupId={group.id}
                canManageMembers={canManageMembers}
                isOwner={isOwner}
                currentUserId={user.id}
              />
            </TabsContent>

            {(isOwner || canManageRoles || canManageChannels) && (
              <TabsContent value="settings" className="flex-1 overflow-hidden">
                <GroupSettings group={group} roles={roles} canManageRoles={canManageRoles} isOwner={isOwner} />
              </TabsContent>
            )}
          </Tabs>
        </div>

        {/* Main content area */}
        <div className="flex-1 overflow-hidden">
          {!sidebarOpen && selectedChannel && (
            <div className="p-2 border-b flex items-center">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleSidebar}
                className="mr-2 md:hidden"
              >
                <Menu size={18} />
              </Button>
              <span className="font-medium truncate">{selectedChannel.name}</span>
            </div>
          )}
          
          {selectedChannel ? (
            <ChannelView channel={selectedChannel} user={user} userRoles={userRoles} group={undefined} roles={[]} members={[]} canManageMembers={false} isOwner={false} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Select a channel to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}