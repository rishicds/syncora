"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "../supabase-provider"
import { useToast } from "../ui/use-toast"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog"

export default function CreateGroupDialog({
  open,
  onOpenChange,
  userId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
}) {
  const router = useRouter()
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast({
        title: "Group name required",
        description: "Please enter a name for your group",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // Create the group
      const { data: group, error: groupError } = await supabase
        .from("groups")
        .insert({
          name,
          description,
          owner_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (groupError) throw groupError

      // Create default roles
      const { error: roleError } = await supabase.from("roles").insert([
        {
          group_id: group.id,
          name: "Admin",
          color: "#FF5733",
          position: 1,
          permissions: { manage_channels: true, manage_roles: true, manage_members: true },
          is_default: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          group_id: group.id,
          name: "Member",
          color: "#33A1FF",
          position: 2,
          permissions: { send_messages: true, read_messages: true },
          is_default: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])

      if (roleError) throw roleError

      // Get the admin role
      const { data: roles, error: getRolesError } = await supabase
        .from("roles")
        .select("id")
        .eq("group_id", group.id)
        .eq("name", "Admin")

      if (getRolesError) throw getRolesError

      // Add the creator as a member with admin role
      const { error: memberError } = await supabase.from("group_members").insert({
        group_id: group.id,
        user_id: userId,
        role_ids: [roles[0].id],
        joined_at: new Date().toISOString(),
      })

      if (memberError) throw memberError

      // Create a general channel
      const { error: channelError } = await supabase.from("channels").insert({
        group_id: group.id,
        name: "general",
        description: "General discussion",
        type: "text",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (channelError) throw channelError

      toast({
        title: "Group created",
        description: `${name} has been created successfully`,
      })

      onOpenChange(false)
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error creating group",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create a new group</DialogTitle>
            <DialogDescription>Create a group to start chatting with your friends or team.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="name" className="text-sm font-medium">
                Group Name
              </label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter group name"
                disabled={loading}
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter group description (optional)"
                disabled={loading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Group"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

