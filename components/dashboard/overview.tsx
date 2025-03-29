import type React from "react"
import Link from "next/link"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageSquare, Plus, Users, ArrowRight, Sparkles, Zap } from "lucide-react"

interface Conversation {
  id: string
  user1_id: string
  user2_id: string
  created_at: string
  updated_at: string
  last_message?: string
}

interface DashboardOverviewProps {
  conversations: Conversation[]
}

export function DashboardOverview({ conversations }: DashboardOverviewProps) {
  return (
    <div className="p-6 md:p-8 lg:p-10">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[rgba(var(--accent-color),1)] to-[rgba(var(--accent-color-2),1)]">
              Dashboard
            </h1>
            <p className="mt-2 text-gray-400">Welcome back to your workspace</p>
          </div>
          <Button className="btn-glass">
            <Sparkles className="mr-2 h-4 w-4" />
            <span>New Project</span>
          </Button>
        </div>

        <div className="asymm-container">
          <div className="asymm-span-4 float float-delay-1">
            <div className="glass-card primary h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Messages</CardTitle>
                <MessageSquare className="h-4 w-4 text-[rgba(var(--accent-color),1)]" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[rgba(var(--accent-color),1)] to-[rgba(var(--accent-color-2),1)]">
                  {conversations.length}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {conversations.length > 0 ? "You have active conversations" : "No recent conversations"}
                </p>
                <div className="mt-6">
                  <Button asChild size="sm" className="btn-glass group">
                    <Link href="/dashboard/messages" className="flex items-center">
                      View Messages
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </div>
          </div>

          <div className="asymm-span-4 float">
            <div className="glass-card secondary h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Find Users</CardTitle>
                <Users className="h-4 w-4 text-[rgba(var(--accent-color-2),1)]" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-400 mt-1">Search for users by email to start a conversation</p>
                <div className="mt-6">
                  <Button asChild size="sm" className="btn-glass group">
                    <Link href="/dashboard/search" className="flex items-center">
                      Search Users
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </div>
          </div>

          <div className="asymm-span-4 float float-delay-2">
            <div className="glass-card tertiary h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Start Conversation</CardTitle>
                <Plus className="h-4 w-4 text-[rgba(var(--accent-color-3),1)]" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-400 mt-1">Begin a new conversation with a team member</p>
                <div className="mt-6">
                  <Button asChild size="sm" className="btn-glass group">
                    <Link href="/dashboard/search" className="flex items-center">
                      New Conversation
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </div>
          </div>
        </div>

        {conversations.length > 0 && (
          <div className="diagonal-section">
            <div className="glass-card glow asymm-span-12 asymm-offset-1">
              <CardHeader>
                <CardTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[rgba(var(--accent-color),1)] to-[rgba(var(--accent-color-2),1)]">
                  Recent Conversations
                </CardTitle>
                <CardDescription>Your most recent message exchanges</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {conversations.map((conversation, index) => (
                    <div
                      key={conversation.id}
                      className="glass relative overflow-hidden rounded-lg p-4 transition-all duration-300 hover:translate-x-1"
                      style={
                        {
                          "--glass-opacity": "0.1",
                          "--card-accent":
                            index % 3 === 0
                              ? "var(--accent-color)"
                              : index % 3 === 1
                                ? "var(--accent-color-2)"
                                : "var(--accent-color-3)",
                        } as React.CSSProperties
                      }
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium flex items-center">
                            <Zap className="mr-2 h-4 w-4 text-[rgba(var(--accent-color-2),1)]" />
                            Conversation #{conversation.id.substring(0, 8)}
                          </p>
                          <p className="mt-1 text-sm text-gray-400">{conversation.last_message || "No messages yet"}</p>
                        </div>
                        <Button asChild size="sm" className="btn-glass">
                          <Link href={`/dashboard/messages/${conversation.id}`} className="flex items-center">
                            Open
                            <ArrowRight className="ml-2 h-3 w-3" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

