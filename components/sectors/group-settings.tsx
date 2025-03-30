"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "../supabase-provider"
import { useToast } from "../ui/use-toast"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import { ScrollArea } from "../ui/scroll-area"
import { Separator } from "../ui/separator"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"

export default function GroupSettings({
  group,
  roles,
  canManageRoles,
  isOwner,
}: {
  group: any
  roles: any[]
  canManageRoles: boolean
  isOwner: boolean
}) {
  const router = useRouter()
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [isEditGroupOpen, setIsEditGroupOpen] = useState(false)
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false)
  const [isEditRoleOpen, setIsEditRoleOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // Group form state
  const [groupName, setGroupName] = useState(group.name)
  const [groupDescription, setGroupDescription] = useState(group.description || "")

  // Role form state
  const [roleName, setRoleName] = useState("")
  const [roleColor, setRoleColor] = useState("#3B82F6")
  const [rolePosition, setRolePosition] = useState(1)
  const [rolePermissions, setRolePermissions] = useState({
    manage_channels: false,
    manage_roles: false,
    manage_members: false,
    send_messages: true,
    read_messages: true,
  })
  const [isDefault, setIsDefault] = useState(false)

  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!groupName.trim()) {
      toast({
        title: "Group name required",
        description: "Please enter a name for your group",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase
        .from("groups")
        .update({
          name: groupName,
          description: groupDescription,
          updated_at: new Date().toISOString(),
        })
        .eq("id", group.id)

      if (error) throw error

      toast({
        title: "Group updated",
        description: "Group settings have been updated successfully",
      })

      setIsEditGroupOpen(false)
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error updating group",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!roleName.trim()) {
      toast({
        title: "Role name required",
        description: "Please enter a name for the role",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.from("roles").insert({
        group_id: group.id,
        name: roleName,
        color: roleColor,
        position: rolePosition,
        permissions: rolePermissions,
        is_default: isDefault,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (error) throw error

      toast({
        title: "Role created",
        description: `${roleName} role has been created successfully`,
      })

      setIsCreateRoleOpen(false)
      resetRoleForm()
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error creating role",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!roleName.trim()) {
      toast({
        title: "Role name required",
        description: "Please enter a name for the role",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase
        .from("roles")
        .update({
          name: roleName,
          color: roleColor,
          position: rolePosition,
          permissions: rolePermissions,
          is_default: isDefault,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingRole.id)

      if (error) throw error

      toast({
        title: "Role updated",
        description: `${roleName} role has been updated successfully`,
      })

      setIsEditRoleOpen(false)
      resetRoleForm()
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error updating role",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRole = async (role: any) => {
    if (!confirm(`Are you sure you want to delete the ${role.name} role? This action cannot be undone.`)) {
      return
    }

    try {
      const { error } = await supabase.from("roles").delete().eq("id", role.id)

      if (error) throw error

      toast({
        title: "Role deleted",
        description: `${role.name} role has been deleted`,
      })

      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error deleting role",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const openEditRoleDialog = (role: any) => {
    setEditingRole(role)
    setRoleName(role.name)
    setRoleColor(role.color)
    setRolePosition(role.position)
    setRolePermissions(role.permissions)
    setIsDefault(role.is_default)
    setIsEditRoleOpen(true)
  }

  const resetRoleForm = () => {
    setRoleName("")
    setRoleColor("#3B82F6")
    setRolePosition(1)
    setRolePermissions({
      manage_channels: false,
      manage_roles: false,
      manage_members: false,
      send_messages: true,
      read_messages: true,
    })
    setIsDefault(false)
    setEditingRole(null)
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Group Settings</h3>
            {isOwner && <Button onClick={() => setIsEditGroupOpen(true)}>Edit Group</Button>}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{group.name}</CardTitle>
              <CardDescription>{group.description || "No description provided"}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Owner</span>
                  <span className="text-sm">{isOwner ? "You" : group.owner_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Created</span>
                  <span className="text-sm">{new Date(group.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Roles</h3>
            {canManageRoles && (
              <Button
                onClick={() => {
                  resetRoleForm()
                  setIsCreateRoleOpen(true)
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Role
              </Button>
            )}
          </div>

          <div className="space-y-4">
            {roles.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No roles found</p>
            ) : (
              roles
                .sort((a, b) => a.position - b.position)
                .map((role) => (
                  <Card key={role.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge style={{ backgroundColor: role.color }}>{role.name}</Badge>
                          {role.is_default && <Badge variant="outline">Default</Badge>}
                        </div>
                        {canManageRoles && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteRole(role)}
                            className="h-8 w-8"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm space-y-1">
                        <div className="grid grid-cols-2 gap-2">
                          <span className="text-muted-foreground">Manage Channels:</span>
                          <span>{role.permissions.manage_channels ? "Yes" : "No"}</span>

                          <span className="text-muted-foreground">Manage Roles:</span>
                          <span>{role.permissions.manage_roles ? "Yes" : "No"}</span>

                          <span className="text-muted-foreground">Manage Members:</span>
                          <span>{role.permissions.manage_members ? "Yes" : "No"}</span>

                          <span className="text-muted-foreground">Send Messages:</span>
                          <span>{role.permissions.send_messages ? "Yes" : "No"}</span>

                          <span className="text-muted-foreground">Read Messages:</span>
                          <span>{role.permissions.read_messages ? "Yes" : "No"}</span>
                        </div>
                      </div>
                    </CardContent>
                    {canManageRoles && (
                      <CardFooter>
                        <Button variant="outline" size="sm" className="w-full" onClick={() => openEditRoleDialog(role)}>
                          Edit Role
                        </Button>
                      </CardFooter>
                    )}
                  </Card>
                ))
            )}
          </div>
        </div>
      </div>

      {/* Edit Group Dialog */}
      <Dialog open={isEditGroupOpen} onOpenChange={setIsEditGroupOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleUpdateGroup}>
            <DialogHeader>
              <DialogTitle>Edit Group</DialogTitle>
              <DialogDescription>Update your group settings.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="group-name" className="text-sm font-medium">
                  Group Name
                </label>
                <Input
                  id="group-name"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="group-description" className="text-sm font-medium">
                  Description (optional)
                </label>
                <Textarea
                  id="group-description"
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditGroupOpen(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Role Dialog */}
      <Dialog open={isCreateRoleOpen} onOpenChange={setIsCreateRoleOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleCreateRole}>
            <DialogHeader>
              <DialogTitle>Create Role</DialogTitle>
              <DialogDescription>Add a new role to your group.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="role-name" className="text-sm font-medium">
                  Role Name
                </label>
                <Input
                  id="role-name"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="role-color" className="text-sm font-medium">
                  Color
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    id="role-color"
                    type="color"
                    value={roleColor}
                    onChange={(e) => setRoleColor(e.target.value)}
                    className="w-12 h-10 p-1"
                    disabled={loading}
                  />
                  <Input value={roleColor} onChange={(e) => setRoleColor(e.target.value)} disabled={loading} />
                </div>
              </div>
              <div className="grid gap-2">
                <label htmlFor="role-position" className="text-sm font-medium">
                  Position
                </label>
                <Input
                  id="role-position"
                  type="number"
                  min="1"
                  value={rolePosition}
                  onChange={(e) => setRolePosition(Number.parseInt(e.target.value))}
                  disabled={loading}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Permissions</label>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="manage-channels"
                      checked={rolePermissions.manage_channels}
                      onChange={(e) =>
                        setRolePermissions({
                          ...rolePermissions,
                          manage_channels: e.target.checked,
                        })
                      }
                      className="mr-2"
                      disabled={loading}
                    />
                    <label htmlFor="manage-channels">Manage Channels</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="manage-roles"
                      checked={rolePermissions.manage_roles}
                      onChange={(e) =>
                        setRolePermissions({
                          ...rolePermissions,
                          manage_roles: e.target.checked,
                        })
                      }
                      className="mr-2"
                      disabled={loading}
                    />
                    <label htmlFor="manage-roles">Manage Roles</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="manage-members"
                      checked={rolePermissions.manage_members}
                      onChange={(e) =>
                        setRolePermissions({
                          ...rolePermissions,
                          manage_members: e.target.checked,
                        })
                      }
                      className="mr-2"
                      disabled={loading}
                    />
                    <label htmlFor="manage-members">Manage Members</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="send-messages"
                      checked={rolePermissions.send_messages}
                      onChange={(e) =>
                        setRolePermissions({
                          ...rolePermissions,
                          send_messages: e.target.checked,
                        })
                      }
                      className="mr-2"
                      disabled={loading}
                    />
                    <label htmlFor="send-messages">Send Messages</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="read-messages"
                      checked={rolePermissions.read_messages}
                      onChange={(e) =>
                        setRolePermissions({
                          ...rolePermissions,
                          read_messages: e.target.checked,
                        })
                      }
                      className="mr-2"
                      disabled={loading}
                    />
                    <label htmlFor="read-messages">Read Messages</label>
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is-default"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="mr-2"
                  disabled={loading}
                />
                <label htmlFor="is-default">Default Role (automatically assigned to new members)</label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateRoleOpen(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Role
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={isEditRoleOpen} onOpenChange={setIsEditRoleOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleUpdateRole}>
            <DialogHeader>
              <DialogTitle>Edit Role</DialogTitle>
              <DialogDescription>Update role settings.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="edit-role-name" className="text-sm font-medium">
                  Role Name
                </label>
                <Input
                  id="edit-role-name"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="edit-role-color" className="text-sm font-medium">
                  Color
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    id="edit-role-color"
                    type="color"
                    value={roleColor}
                    onChange={(e) => setRoleColor(e.target.value)}
                    className="w-12 h-10 p-1"
                    disabled={loading}
                  />
                  <Input value={roleColor} onChange={(e) => setRoleColor(e.target.value)} disabled={loading} />
                </div>
              </div>
              <div className="grid gap-2">
                <label htmlFor="edit-role-position" className="text-sm font-medium">
                  Position
                </label>
                <Input
                  id="edit-role-position"
                  type="number"
                  min="1"
                  value={rolePosition}
                  onChange={(e) => setRolePosition(Number.parseInt(e.target.value))}
                  disabled={loading}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Permissions</label>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="edit-manage-channels"
                      checked={rolePermissions.manage_channels}
                      onChange={(e) =>
                        setRolePermissions({
                          ...rolePermissions,
                          manage_channels: e.target.checked,
                        })
                      }
                      className="mr-2"
                      disabled={loading}
                    />
                    <label htmlFor="edit-manage-channels">Manage Channels</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="edit-manage-roles"
                      checked={rolePermissions.manage_roles}
                      onChange={(e) =>
                        setRolePermissions({
                          ...rolePermissions,
                          manage_roles: e.target.checked,
                        })
                      }
                      className="mr-2"
                      disabled={loading}
                    />
                    <label htmlFor="edit-manage-roles">Manage Roles</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="edit-manage-members"
                      checked={rolePermissions.manage_members}
                      onChange={(e) =>
                        setRolePermissions({
                          ...rolePermissions,
                          manage_members: e.target.checked,
                        })
                      }
                      className="mr-2"
                      disabled={loading}
                    />
                    <label htmlFor="edit-manage-members">Manage Members</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="edit-send-messages"
                      checked={rolePermissions.send_messages}
                      onChange={(e) =>
                        setRolePermissions({
                          ...rolePermissions,
                          send_messages: e.target.checked,
                        })
                      }
                      className="mr-2"
                      disabled={loading}
                    />
                    <label htmlFor="edit-send-messages">Send Messages</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="edit-read-messages"
                      checked={rolePermissions.read_messages}
                      onChange={(e) =>
                        setRolePermissions({
                          ...rolePermissions,
                          read_messages: e.target.checked,
                        })
                      }
                      className="mr-2"
                      disabled={loading}
                    />
                    <label htmlFor="edit-read-messages">Read Messages</label>
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="edit-is-default"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="mr-2"
                  disabled={loading}
                />
                <label htmlFor="edit-is-default">Default Role (automatically assigned to new members)</label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditRoleOpen(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </ScrollArea>
  )
}

