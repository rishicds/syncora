"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "../supabase-provider"
import Sidebar from "./sidebar"
import GroupView from "./group-view"
import { Button } from "../ui/button"
import { PlusIcon } from "lucide-react"
import CreateGroupDialog from "./create-group-dialog"

export default function SectorDashboard({
  user,
  profile,
  groups,
  groupMembers,
  roles,
}: {
  user: any
  profile: any
  groups: any[]
  groupMembers: any[]
  roles: any[]
}) {
  const router = useRouter()
  const { supabase } = useSupabase()
  const [selectedGroup, setSelectedGroup] = useState(groups[0] || null)
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  const handleGroupSelect = (group: any) => {
    setSelectedGroup(group)
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        user={user}
        profile={profile}
        groups={groups}
        onGroupSelect={handleGroupSelect}
        selectedGroup={selectedGroup}
        onSignOut={handleSignOut}
      >
        <div className="p-4">
          <Button onClick={() => setIsCreateGroupOpen(true)} className="w-full flex items-center gap-2">
            <PlusIcon size={16} />
            Create Group
          </Button>
        </div>
      </Sidebar>

      <div className="flex-1 overflow-hidden">
        {selectedGroup ? (
          <GroupView
            group={selectedGroup}
            user={user}
            roles={roles.filter((role) => role.group_id === selectedGroup.id)}
            userRoleIds={groupMembers.find((m) => m.group_id === selectedGroup.id)?.role_ids || []}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Welcome to Group Chat</h2>
              <p className="text-muted-foreground mb-6">Select a group or create a new one to get started</p>
              <Button onClick={() => setIsCreateGroupOpen(true)}>Create Your First Group</Button>
            </div>
          </div>
        )}
      </div>

      <CreateGroupDialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen} userId={user.id} />
    </div>
  )
}

