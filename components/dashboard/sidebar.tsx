"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, MessageSquare, Search, Settings, User, Bell, FileText, Hash, Plus, Mic, Megaphone, Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSupabase } from "@/components/supabase-provider"
import { type Group, CHANNEL_TYPES } from "@/types/group.types"
import { CreateGroupDialog } from "@/components/groups/create-group-dialog"
import { CreateChannelDialog } from "@/components/groups/create-channel-dialog"
import { hasPermission } from "@/lib/permissions"
import { Badge } from "@/components/ui/badge"
import { getUnreadNotificationCount } from "@/lib/notification-service"
import { handleError } from "@/lib/error-handler"
import { useToast } from "@/hooks/use-toast"

export function DashboardSidebar() {
  const pathname = usePathname()
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [showCreateChannel, setShowCreateChannel] = useState(false)
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [unreadNotifications, setUnreadNotifications] = useState(0)

  // Navigation routes
  const routes = [
    { title: "Dashboard", icon: Home, href: "/dashboard", active: pathname === "/dashboard" },
    { title: "Messages", icon: MessageSquare, href: "/dashboard/messages", active: pathname.startsWith("/dashboard/messages") && !pathname.includes("/groups") },
    { title: "Search", icon: Search, href: "/dashboard/search", active: pathname === "/dashboard/search" },
    { title: "Notifications", icon: Bell, href: "/dashboard/notifications", active: pathname === "/dashboard/notifications", badge: unreadNotifications },
   
    { title: "Profile", icon: User, href: "/dashboard/profile", active: pathname === "/dashboard/profile" },
    { title: "Settings", icon: Settings, href: "/dashboard/settings", active: pathname === "/dashboard/settings" },
  ]

  // Fetch groups and notifications
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Fetch groups
        const { data: groupsData } = await supabase
          .from("groups")
          .select("*, channels(*), group_members!inner(role_ids), roles(*)")
          .eq("group_members.user_id", user.id)

        setGroups(groupsData || [])

        // Fetch notifications
        const count = await getUnreadNotificationCount(user.id)
        setUnreadNotifications(count)
      } catch (error) {
        toast({
          title: "Error loading data",
          description: handleError(error).message,
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Real-time subscription for notifications
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (user) getUnreadNotificationCount(user.id).then(setUnreadNotifications)
        })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, toast])

  // Check channel creation permissions
  const canCreateChannel = (group: Group): boolean => {
    if (!group.roles || !group.group_members?.[0]?.role_ids) return false
    
    return group.roles
      .filter(role => group.group_members[0].role_ids.includes(role.id))
      .some(role => hasPermission(role.permissions, "MANAGE_CHANNELS"))
  }

  // Get appropriate channel icon
  const getChannelIcon = (type: string) => {
    switch (type) {
      case CHANNEL_TYPES.TEXT: return <Hash className="h-4 w-4" />
      case CHANNEL_TYPES.VOICE: return <Mic className="h-4 w-4" />
      case CHANNEL_TYPES.ANNOUNCEMENT: return <Megaphone className="h-4 w-4" />
      default: return <Hash className="h-4 w-4" />
    }
  }

  return (
    <>
      <aside className="fixed inset-y-0 z-50 flex h-screen w-64 flex-col border-r border-white/10 bg-gradient-to-b from-gray-900/80 to-gray-800/80 backdrop-blur-lg">
        {/* Header */}
        <header className="flex items-center justify-between p-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Syncora
            </span>
          </Link>
        </header>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            {routes.map(route => (
              <Link
                key={route.href}
                href={route.href}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                  route.active 
                    ? "bg-primary/10 text-white shadow-lg" 
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${
                  route.active 
                    ? "bg-primary/20 text-primary" 
                    : "bg-white/5 text-gray-400 group-hover:bg-primary/10 group-hover:text-primary"
                }`}>
                  <route.icon className="h-4 w-4" />
                </div>
                <span>{route.title}</span>
                {route.badge ? (
                  <Badge className="ml-auto bg-primary text-primary-foreground">
                    {route.badge}
                  </Badge>
                ) : null}
              </Link>
            ))}
          </div>

          {/* Groups section */}
          <div className="mt-8">
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Groups</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 rounded-lg bg-white/5 p-0 hover:bg-primary/10 hover:text-primary"
                onClick={() => setShowCreateGroup(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {loading ? (
              <div className="space-y-2 py-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2">
                    <div className="h-8 w-8 rounded-lg bg-gray-700/50 animate-pulse" />
                    <div className="h-4 flex-1 rounded bg-gray-700/50 animate-pulse" />
                  </div>
                ))}
              </div>
            ) : groups.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-400">No groups yet</div>
            ) : (
              <div className="space-y-2 py-2">
                {groups.map(group => (
                  <div key={group.id} className="group">
                    <div className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-white/5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/20 text-secondary">
                        {group.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-300">{group.name}</span>
                    </div>
                    
                    <div className="ml-12 mt-1 space-y-1">
                      {group.channels?.length ? (
                        group.channels.map(channel => (
                          <Link
                            key={channel.id}
                            href={`/dashboard/groups/${group.id}/channels/${channel.id}`}
                            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-all ${
                              pathname === `/dashboard/groups/${group.id}/channels/${channel.id}`
                                ? "bg-primary/10 text-primary"
                                : "text-gray-400 hover:bg-white/5 hover:text-white"
                            }`}
                          >
                            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-white/5">
                              {getChannelIcon(channel.type)}
                            </div>
                            <span>{channel.name}</span>
                          </Link>
                        ))
                      ) : (
                        <div className="px-3 py-1 text-xs text-gray-500">No channels</div>
                      )}

                      {canCreateChannel(group) && (
                        <button
                          onClick={() => {
                            setSelectedGroupId(group.id)
                            setShowCreateChannel(true)
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-gray-400 hover:bg-white/5 hover:text-white"
                        >
                          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-white/5">
                            <Plus className="h-3 w-3" />
                          </div>
                          <span>Add Channel</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Footer */}
        <footer className="border-t border-white/10 p-4">
          <p className="text-xs text-gray-400">
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text font-bold text-transparent">
              Syncora
            </span> v0.2.0
          </p>
        </footer>
      </aside>

      {/* Dialogs */}
      <CreateGroupDialog
        open={showCreateGroup}
        onOpenChange={setShowCreateGroup}
        onGroupCreated={(newGroup) => {
          setGroups(prev => [...prev, newGroup])
        }}
      />

      {selectedGroupId && (
        <CreateChannelDialog
          open={showCreateChannel}
          onOpenChange={setShowCreateChannel}
          groupId={selectedGroupId}
          onChannelCreated={(newChannel) => {
            setGroups(prev => prev.map(group => 
              group.id === selectedGroupId 
                ? { ...group, channels: [...(group.channels || []), newChannel] } 
                : group
            ))
          }}
        />
      )}
    </>
  )
}