"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  MessageSquare,
  Search,
  Settings,
  User,
  Bell,
  FileText,
  Menu,
  Hash,
  Plus,
  ChevronDown,
  Mic,
  Megaphone,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
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
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [unreadNotifications, setUnreadNotifications] = useState(0)

  const routes = [
    {
      title: "Dashboard",
      icon: Home,
      href: "/dashboard",
      active: pathname === "/dashboard",
    },
    {
      title: "Direct Messages",
      icon: MessageSquare,
      href: "/dashboard/messages",
      active: pathname.startsWith("/dashboard/messages") && !pathname.includes("/groups"),
    },
    {
      title: "Search Users",
      icon: Search,
      href: "/dashboard/search",
      active: pathname === "/dashboard/search",
    },
    {
      title: "Notifications",
      icon: Bell,
      href: "/dashboard/notifications",
      active: pathname === "/dashboard/notifications",
      badge: unreadNotifications > 0 ? unreadNotifications : undefined,
    },
    {
      title: "Files",
      icon: FileText,
      href: "/dashboard/files",
      active: pathname === "/dashboard/files",
    },
    {
      title: "Profile",
      icon: User,
      href: "/dashboard/profile",
      active: pathname === "/dashboard/profile",
    },
    {
      title: "Settings",
      icon: Settings,
      href: "/dashboard/settings",
      active: pathname === "/dashboard/settings",
    },
  ]

  useEffect(() => {
    async function fetchGroups() {
      try {
        const { data: userData } = await supabase.auth.getUser()
        if (!userData.user) return

        // Fetch groups the user is a member of
        const { data: memberData } = await supabase
          .from("group_members")
          .select("group_id, role_ids")
          .eq("user_id", userData.user.id)

        if (!memberData || memberData.length === 0) {
          setLoading(false)
          return
        }

        const groupIds = memberData.map((m) => m.group_id)

        // Fetch group details
        const { data: groupsData } = await supabase.from("groups").select("*, channels(*)").in("id", groupIds)

        if (groupsData) {
          // Fetch roles for each group
          const { data: rolesData } = await supabase.from("roles").select("*").in("group_id", groupIds)

          // Combine data
          const groupsWithRoles = groupsData.map((group) => {
            const groupRoles = rolesData?.filter((role) => role.group_id === group.id) || []
            const memberRoleIds = memberData.find((m) => m.group_id === group.id)?.role_ids || []

            return {
              ...group,
              roles: groupRoles,
              userRoleIds: memberRoleIds,
            }
          })

          setGroups(groupsWithRoles)
        }

        // Fetch unread notification count
        const count = await getUnreadNotificationCount(userData.user.id)
        setUnreadNotifications(count)
      } catch (error) {
        const handledError = handleError(error)
        toast({
          title: "Error fetching groups",
          description: handledError.message,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchGroups()

    // Set up real-time subscription for notifications
    const setupNotificationSubscription = async () => {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return

      const channel = supabase
        .channel(`notifications:${userData.user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userData.user.id}`,
          },
          async () => {
            // Update notification count
            const count = await getUnreadNotificationCount(userData.user.id)
            setUnreadNotifications(count)
          },
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }

    const unsubscribe = setupNotificationSubscription()

    return () => {
      unsubscribe.then((unsub) => unsub && unsub())
    }
  }, [supabase, toast])

  const getChannelIcon = (type: string) => {
    switch (type) {
      case CHANNEL_TYPES.TEXT:
        return <Hash className="h-4 w-4" />
      case CHANNEL_TYPES.VOICE:
        return <Mic className="h-4 w-4" />
      case CHANNEL_TYPES.ANNOUNCEMENT:
        return <Megaphone className="h-4 w-4" />
      default:
        return <Hash className="h-4 w-4" />
    }
  }

  const canCreateChannel = (group: Group) => {
    if (!group.roles || !group.userRoleIds) return false

    const userRoles = group.roles.filter((role) => group.userRoleIds?.includes(role.id))

    return userRoles.some((role) => hasPermission(role.permissions, "MANAGE_CHANNELS"))
  }

  return (
    <>
      <Sidebar variant="responsive" isCollapsed={isCollapsed}>
        <SidebarHeader className="flex items-center justify-between px-4 py-2">
          <Link href="/dashboard" className="flex items-center gap-2">
            {!isCollapsed && <span className="text-xl font-bold">Syncora</span>}
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(!isCollapsed)} className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {routes.map((route) => (
              <SidebarMenuItem key={route.href}>
                <SidebarMenuButton asChild isActive={route.active}>
                  <Link href={route.href} className="relative">
                    <route.icon className="h-5 w-5" />
                    {!isCollapsed && <span>{route.title}</span>}
                    {route.badge && (
                      <Badge
                        variant="destructive"
                        className="absolute -right-2 -top-2 h-5 w-5 p-0 flex items-center justify-center"
                      >
                        {route.badge}
                      </Badge>
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>

          <SidebarGroup>
            <div className="flex items-center justify-between px-2 py-2">
              {!isCollapsed && <SidebarGroupLabel>Groups</SidebarGroupLabel>}
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setShowCreateGroup(true)}>
                <Plus className="h-4 w-4" />
                <span className="sr-only">Create Group</span>
              </Button>
            </div>
            <SidebarGroupContent>
              {loading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : groups.length === 0 ? (
                <div className="px-2 py-1 text-sm text-muted-foreground">{!isCollapsed && "No groups yet"}</div>
              ) : (
                <SidebarMenu>
                  {groups.map((group) => (
                    <Collapsible key={group.id} defaultOpen className="group/collapsible">
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton>
                            <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                              {group.name.charAt(0).toUpperCase()}
                            </div>
                            {!isCollapsed && (
                              <>
                                <span>{group.name}</span>
                                <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                              </>
                            )}
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {group.channels && group.channels.length > 0 ? (
                              <>
                                {group.channels.map((channel) => (
                                  <SidebarMenuSubItem key={channel.id}>
                                    <SidebarMenuSubButton
                                      asChild
                                      isActive={pathname === `/dashboard/groups/${group.id}/channels/${channel.id}`}
                                    >
                                      <Link href={`/dashboard/groups/${group.id}/channels/${channel.id}`}>
                                        {getChannelIcon(channel.type)}
                                        {!isCollapsed && <span>{channel.name}</span>}
                                      </Link>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                ))}
                              </>
                            ) : (
                              <div className="px-2 py-1 text-xs text-muted-foreground">
                                {!isCollapsed && "No channels"}
                              </div>
                            )}

                            {canCreateChannel(group) && (
                              <SidebarMenuSubItem>
                                <SidebarMenuSubButton
                                  asChild
                                  onClick={() => {
                                    setSelectedGroupId(group.id)
                                    setShowCreateChannel(true)
                                  }}
                                >
                                  <div className="flex items-center text-muted-foreground hover:text-foreground cursor-pointer">
                                    <Plus className="h-4 w-4 mr-1" />
                                    {!isCollapsed && <span>Add Channel</span>}
                                  </div>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            )}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  ))}
                </SidebarMenu>
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <div className="p-2">{!isCollapsed && <p className="text-xs text-muted-foreground">Syncora v0.2.0</p>}</div>
        </SidebarFooter>
      </Sidebar>

      <CreateGroupDialog
        open={showCreateGroup}
        onOpenChange={setShowCreateGroup}
        onGroupCreated={(newGroup) => {
          setGroups((prev) => [...prev, newGroup])
        }}
      />

      {selectedGroupId && (
        <CreateChannelDialog
          open={showCreateChannel}
          onOpenChange={setShowCreateChannel}
          groupId={selectedGroupId}
          onChannelCreated={(newChannel) => {
            setGroups((prev) =>
              prev.map((group) => {
                if (group.id === selectedGroupId) {
                  return {
                    ...group,
                    channels: [...(group.channels || []), newChannel],
                  }
                }
                return group
              }),
            )
          }}
        />
      )}
    </>
  )
}

