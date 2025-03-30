"use client"

import type React from "react"

import { useState } from "react"
import { useSupabase } from "../supabase-provider"
import { useToast } from "../ui/use-toast"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import { ScrollArea } from "../ui/scroll-area"
import { Loader2, Hash, Plus, Settings } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu"

export default function ChannelList({
  channels,
  selectedChannel,
  onChannelSelect,
  groupId,
  canManageChannels,
  loading,
}: {
  channels: any[]
  selectedChannel: any
  onChannelSelect: (channel: any) => void
  groupId: string
  canManageChannels: boolean
  loading: boolean
}) {
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingChannel, setEditingChannel] = useState<any>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast({
        title: "Channel name required",
        description: "Please enter a name for your channel",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)

    try {
      const { data, error } = await supabase
        .from("channels")
        .insert({
          group_id: groupId,
          name: name.toLowerCase().replace(/\s+/g, "-"),
          description,
          type: "text",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Channel created",
        description: `#${name} has been created successfully`,
      })

      setIsCreateOpen(false)
      setName("")
      setDescription("")
      onChannelSelect(data)
    } catch (error: any) {
      toast({
        title: "Error creating channel",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditChannel = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast({
        title: "Channel name required",
        description: "Please enter a name for your channel",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)

    try {
      const { data, error } = await supabase
        .from("channels")
        .update({
          name: name.toLowerCase().replace(/\s+/g, "-"),
          description,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingChannel.id)
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Channel updated",
        description: `#${name} has been updated successfully`,
      })

      setIsEditOpen(false)
      setName("")
      setDescription("")
      setEditingChannel(null)

      if (selectedChannel?.id === data.id) {
        onChannelSelect(data)
      }
    } catch (error: any) {
      toast({
        title: "Error updating channel",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteChannel = async (channel: any) => {
    if (!confirm(`Are you sure you want to delete #${channel.name}? This action cannot be undone.`)) {
      return
    }

    try {
      const { error } = await supabase.from("channels").delete().eq("id", channel.id)

      if (error) throw error

      toast({
        title: "Channel deleted",
        description: `#${channel.name} has been deleted`,
      })

      if (selectedChannel?.id === channel.id) {
        onChannelSelect(channels.find((c) => c.id !== channel.id) || null)
      }
    } catch (error: any) {
      toast({
        title: "Error deleting channel",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (channel: any) => {
    setEditingChannel(channel)
    setName(channel.name)
    setDescription(channel.description || "")
    setIsEditOpen(true)
  }

  return (
    <>
      <div className="p-4 flex items-center justify-between">
        <h3 className="font-medium">Channels</h3>
        {canManageChannels && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setName("")
              setDescription("")
              setIsCreateOpen(true)
            }}
          >
            <Plus size={16} />
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {loading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : channels.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center p-4">No channels found</p>
          ) : (
            channels.map((channel) => (
              <div key={channel.id} className="flex items-center group">
                <Button
                  variant={selectedChannel?.id === channel.id ? "secondary" : "ghost"}
                  className="flex-1 justify-start h-8 px-2"
                  onClick={() => onChannelSelect(channel)}
                >
                  <Hash size={16} className="mr-2 text-muted-foreground" />
                  <span className="truncate">{channel.name}</span>
                </Button>
                {canManageChannels && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                        <Settings size={14} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(channel)}>Edit Channel</DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleDeleteChannel(channel)}
                      >
                        Delete Channel
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Create Channel Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleCreateChannel}>
            <DialogHeader>
              <DialogTitle>Create Channel</DialogTitle>
              <DialogDescription>Add a new channel to your group.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Channel Name
                </label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. general"
                  disabled={submitting}
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description (optional)
                </label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this channel about?"
                  disabled={submitting}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Creating..." : "Create Channel"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Channel Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleEditChannel}>
            <DialogHeader>
              <DialogTitle>Edit Channel</DialogTitle>
              <DialogDescription>Update channel details.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="edit-name" className="text-sm font-medium">
                  Channel Name
                </label>
                <Input
                  id="edit-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. general"
                  disabled={submitting}
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="edit-description" className="text-sm font-medium">
                  Description (optional)
                </label>
                <Textarea
                  id="edit-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this channel about?"
                  disabled={submitting}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

