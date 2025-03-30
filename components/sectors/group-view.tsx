"use client"

import { useState, useEffect, useRef } from "react"
import { useSupabase } from "../supabase-provider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import ChannelList from "./channel-list"
import ChannelView from "./channel-view"
import GroupSettings from "./group-settings"
import GroupMembers from "./group-members"
import ResizableDivider from "../resizable-divider"
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
  const [sidebarWidth, setSidebarWidth] = useState(256) // Default width in pixels
  const sidebarRef = useRef<HTMLDivElement>(null)

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
        // Set a smaller sidebar width for mobile when it reopens
        setSidebarWidth(Math.min(sidebarWidth, window.innerWidth * 0.8))
      } else {
        setSidebarOpen(true)
      }
    }

    // Set initial state based on window size
    handleResize()

    // Add event listener for window resize
    window.addEventListener("resize", handleResize)

    // Load saved sidebar width from localStorage if available
    const savedWidth = localStorage.getItem("sidebarWidth")
    if (savedWidth) {
      setSidebarWidth(Number(savedWidth))
    }

    return () => {
      supabase.removeChannel(channelsSubscription)
      supabase.removeChannel(membersSubscription)
      window.removeEventListener("resize", handleResize)
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

  const handleSidebarResize = (delta: number) => {
    const newWidth = Math.max(200, Math.min(sidebarWidth + delta, window.innerWidth * 0.7))
    setSidebarWidth(newWidth)
    localStorage.setItem("sidebarWidth", newWidth.toString())
  }

  return (
    <div className="flex flex-col h-full max-h-full">
      <div className="border-b p-2 md:p-4 flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-lg md:text-2xl font-bold truncate">{group.name}</h1>
          <p className="text-xs md:text-sm text-muted-foreground truncate max-w-full">{group.description}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={toggleSidebar} className="ml-2 md:hidden">
          {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar with visible scrollbar */}
        <div
          ref={sidebarRef}
          style={{ width: sidebarOpen ? (window.innerWidth < 768 ? "100%" : `${sidebarWidth}px`) : "0px" }}
          className={`${
            sidebarOpen ? "fixed md:relative inset-0 z-20 md:z-auto bg-background md:flex" : "hidden md:block md:w-0"
          } border-r flex flex-col h-full transition-width duration-200 ease-in-out`}
        >
          <div className="flex items-center justify-between p-2 md:hidden">
            <h2 className="font-semibold">Group Menu</h2>
            <Button variant="ghost" size="sm" onClick={toggleSidebar}>
              <X size={18} />
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col">
            <TabsList className="w-full justify-start px-1 sticky top-0 z-10 bg-background">
              <TabsTrigger value="channels" className="flex-1 text-xs">
                Channels
              </TabsTrigger>
              <TabsTrigger value="members" className="flex-1 text-xs">
                Members
              </TabsTrigger>
              {(isOwner || canManageRoles || canManageChannels) && (
                <TabsTrigger value="settings" className="flex-1 text-xs">
                  Settings
                </TabsTrigger>
              )}
            </TabsList>

            <div className="flex-1 overflow-hidden flex flex-col">
              <TabsContent value="channels" className="flex-1 mt-0 p-0 h-full">
                <div className="h-full overflow-y-auto scrollbar-style">
                  <ChannelList
                    channels={channels}
                    selectedChannel={selectedChannel}
                    onChannelSelect={handleChannelSelect}
                    groupId={group.id}
                    canManageChannels={canManageChannels}
                    loading={loading}
                  />
                </div>
              </TabsContent>

              <TabsContent value="members" className="flex-1 mt-0 p-0 h-full">
                <div className="h-full overflow-y-auto scrollbar-style">
                  <GroupMembers
                    members={members}
                    roles={roles}
                    groupId={group.id}
                    canManageMembers={canManageMembers}
                    isOwner={isOwner}
                    currentUserId={user.id}
                  />
                </div>
              </TabsContent>

              {(isOwner || canManageRoles || canManageChannels) && (
                <TabsContent value="settings" className="flex-1 mt-0 p-0 h-full">
                  <div className="h-full overflow-y-auto scrollbar-style pb-20">
                    <GroupSettings group={group} roles={roles} canManageRoles={canManageRoles} isOwner={isOwner} />
                  </div>
                </TabsContent>
              )}
            </div>
          </Tabs>
        </div>

        {/* Resizable divider - only visible when sidebar is open on desktop */}
        {sidebarOpen && window.innerWidth >= 768 && <ResizableDivider onResize={handleSidebarResize} />}

        {/* Main content area with visible scrollbar */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!sidebarOpen && selectedChannel && (
            <div className="p-2 border-b flex items-center">
              <Button variant="ghost" size="sm" onClick={toggleSidebar} className="mr-2 md:hidden">
                <Menu size={18} />
              </Button>
              <span className="font-medium truncate">{selectedChannel.name}</span>
            </div>
          )}

          <div className="flex-1 overflow-hidden">
            {selectedChannel ? (
              <ChannelView
                channel={selectedChannel}
                user={user}
                userRoles={userRoles}
                group={group}
                roles={roles}
                members={members}
                canManageMembers={canManageMembers}
                isOwner={isOwner}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Select a channel to start chatting</p>
              </div>
            )}
          </div>
        </div>

        {/* Semi-transparent overlay for mobile when sidebar is open */}
        {sidebarOpen && <div className="fixed inset-0 bg-black/20 z-10 md:hidden" onClick={toggleSidebar} />}
      </div>

      {/* Add global styles for scrollbars and transitions */}
      <style jsx global>{`
        /* Custom scrollbar styles */
        .scrollbar-style::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        .scrollbar-style::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 4px;
        }
        
        .scrollbar-style::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
        }
        
        .scrollbar-style::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.3);
        }
        
        /* For Firefox */
        .scrollbar-style {
          scrollbar-width: thin;
          scrollbar-color: rgba(0, 0, 0, 0.2) rgba(0, 0, 0, 0.05);
        }

        /* Add transition for width changes */
        .transition-width {
          transition-property: width;
        }
      `}</style>
    </div>
  )
}

