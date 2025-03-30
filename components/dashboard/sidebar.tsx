"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, MessageSquare, Search, Settings, User, Bell, FileText, Hash, Plus, Mic, Megaphone, Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSupabase } from "@/components/supabase-provider"
import { type Group, CHANNEL_TYPES } from "@/types/group.types"
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
    { title: "Sectors", icon: Settings, href: "/sectors", active: pathname === "/sectors" },
  ]

  // Fetch groups and notifications
  
  // Get appropriate channel icon
 

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
    </>
  )
}