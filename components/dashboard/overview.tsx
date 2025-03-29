import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageSquare, Plus, Users } from "lucide-react"

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
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversations.length}</div>
            <p className="text-xs text-muted-foreground">
              {conversations.length > 0 ? "You have active conversations" : "No recent conversations"}
            </p>
            <div className="mt-4">
              <Button asChild size="sm">
                <Link href="/dashboard/messages">View Messages</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Find Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Search for users by email to start a conversation</p>
            <div className="mt-4">
              <Button asChild size="sm">
                <Link href="/dashboard/search">Search Users</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Start Conversation</CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Begin a new conversation with a team member</p>
            <div className="mt-4">
              <Button asChild size="sm">
                <Link href="/dashboard/search">New Conversation</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {conversations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Conversations</CardTitle>
            <CardDescription>Your most recent message exchanges</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {conversations.map((conversation) => (
                <div key={conversation.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">Conversation #{conversation.id.substring(0, 8)}</p>
                    <p className="text-sm text-muted-foreground">{conversation.last_message || "No messages yet"}</p>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/dashboard/messages/${conversation.id}`}>Open</Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

