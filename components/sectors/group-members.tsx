"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "../supabase-provider"
import { useToast } from "../ui/use-toast"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { ScrollArea } from "../ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Badge } from "../ui/badge"
import { Check, ChevronsUpDown, Loader2, Search, UserPlus } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { Command, CommandGroup, CommandItem } from "../ui/command"

export default function GroupMembers({
  members,
  roles,
  groupId,
  canManageMembers,
  isOwner,
  currentUserId,
}: {
  members: any[]
  roles: any[]
  groupId: string
  canManageMembers: boolean
  isOwner: boolean
  currentUserId: string
}) {
  const router = useRouter()
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
  const [isEditRolesOpen, setIsEditRolesOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [email, setEmail] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [openRolesPopover, setOpenRolesPopover] = useState(false)

  // Group members by their highest role
  const membersByRole = members.reduce(
    (acc, member) => {
      const highestRole = roles
        .filter((role) => member.role_ids?.includes(role.id))
        .sort((a, b) => b.position - a.position)[0]

      if (!highestRole) return acc

      if (!acc[highestRole.id]) {
        acc[highestRole.id] = { role: highestRole, members: [] }
      }

      acc[highestRole.id].members.push(member)
      return acc
    },
    {} as Record<string, { role: any; members: any[] }>,
  )

  const sortedRoleGroups = Object.values(membersByRole).sort((a, b) => b.role.position - a.role.position)

  const getInitials = (profile: any) => {
    if (!profile) return "U"
    return profile.full_name
      ? profile.full_name
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .toUpperCase()
      : profile.username
        ? profile.username.substring(0, 2).toUpperCase()
        : "U"
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setSearching(true)

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, email")
        .or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
        .limit(5)

      if (error) throw error

      // Filter out users who are already members
      const memberUserIds = members.map((m) => m.user_id)
      const filteredResults = data.filter((user) => !memberUserIds.includes(user.id))

      setSearchResults(filteredResults)
    } catch (error: any) {
      toast({
        title: "Error searching users",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setSearching(false)
    }
  }

  const handleAddMemberByEmail = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter an email",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const { data: userData, error: userError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .single()

      if (userError || !userData) {
        throw new Error("User not found")
      }

      const { error: memberError } = await supabase.from("group_members").insert({
        group_id: groupId,
        user_id: userData.id,
        role_ids: selectedRoleIds.length ? selectedRoleIds : [roles.find((r) => r.is_default)?.id].filter(Boolean),
        joined_at: new Date().toISOString(),
      })

      if (memberError) throw memberError

      toast({
        title: "Success",
        description: "Member added successfully",
      })

      setEmail("")
      setSelectedRoleIds([])
      setIsAddMemberOpen(false)
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error adding member",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddMember = async (userId: string) => {
    setLoading(true)

    try {
      // Get default role if available
      const defaultRole = roles.find((role) => role.is_default)
      const roleIds = defaultRole ? [defaultRole.id] : []

      const { error } = await supabase.from("group_members").insert({
        group_id: groupId,
        user_id: userId,
        role_ids: roleIds,
        joined_at: new Date().toISOString(),
      })

      if (error) throw error

      toast({
        title: "Member added",
        description: "User has been added to the group",
      })

      setIsAddMemberOpen(false)
      setSearchQuery("")
      setSearchResults([])
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error adding member",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveMember = async (memberId: string, userId: string) => {
    if (userId === currentUserId) {
      if (!confirm("Are you sure you want to leave this group?")) {
        return
      }
    } else {
      if (!confirm("Are you sure you want to remove this member from the group?")) {
        return
      }
    }

    try {
      const { error } = await supabase.from("group_members").delete().eq("id", memberId)

      if (error) throw error

      toast({
        title: "Member removed",
        description: userId === currentUserId ? "You have left the group" : "Member has been removed from the group",
      })

      if (userId === currentUserId) {
        router.push("/dashboard")
      } else {
        router.refresh()
      }
    } catch (error: any) {
      toast({
        title: "Error removing member",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleUpdateMemberRoles = async () => {
    setLoading(true)

    try {
      const { error } = await supabase
        .from("group_members")
        .update({
          role_ids: selectedRoleIds,
        })
        .eq("id", editingMember.id)

      if (error) throw error

      toast({
        title: "Roles updated",
        description: "Member roles have been updated",
      })

      setIsEditRolesOpen(false)
      setEditingMember(null)
      setSelectedRoleIds([])
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error updating roles",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const openEditRolesDialog = (member: any) => {
    setEditingMember(member)
    setSelectedRoleIds(member.role_ids || [])
    setIsEditRolesOpen(true)
  }

  const toggleRoleSelection = (roleId: string) => {
    setSelectedRoleIds((prev) => (prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]))
  }

  const getRoleColor = (roleId: string) => {
    const role = roles.find((r) => r.id === roleId)
    return role ? role.color : "#888888"
  }

  const getRoleName = (roleId: string) => {
    const role = roles.find((r) => r.id === roleId)
    return role ? role.name : "Unknown Role"
  }

  return (
    <>
      <div className="p-4 flex items-center justify-between">
        <h3 className="font-medium">Members ({members.length})</h3>
        {canManageMembers && (
          <Button variant="ghost" size="icon" onClick={() => setIsAddMemberOpen(true)}>
            <UserPlus size={16} />
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {sortedRoleGroups.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center p-4">No members found</p>
          ) : (
            sortedRoleGroups.map(({ role, members: roleMembers }) => (
              <div key={role.id} className="mt-4">
                <h4 className="text-sm font-medium mb-2 px-2" style={{ color: role.color }}>
                  {role.name} — {roleMembers.length}
                </h4>
                {roleMembers.map((member) => {
                  const profile = member.profiles
                  const isCurrentUser = member.user_id === currentUserId

                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-2 rounded-md hover:bg-accent/50 group"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={profile?.avatar_url} alt={profile?.username || "User"} />
                          <AvatarFallback>{getInitials(profile)}</AvatarFallback>
                        </Avatar>
                        <div className="font-medium">
                          {profile?.username || profile?.full_name || profile?.email || "Unknown User"}
                          {isCurrentUser && " (you)"}
                        </div>
                      </div>

                      {(canManageMembers || isCurrentUser) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="lucide lucide-more-vertical"
                              >
                                <circle cx="12" cy="12" r="1" />
                                <circle cx="12" cy="5" r="1" />
                                <circle cx="12" cy="19" r="1" />
                              </svg>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canManageMembers && !isCurrentUser && (
                              <>
                                <DropdownMenuItem onClick={() => openEditRolesDialog(member)}>
                                  Manage Roles
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleRemoveMember(member.id, member.user_id)}
                            >
                              {isCurrentUser ? "Leave Group" : "Remove Member"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  )
                })}
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Add Member Dialog */}
      <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Member</DialogTitle>
            <DialogDescription>Add a new member to your group.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <h4 className="text-sm font-medium">Add by Email</h4>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleAddMemberByEmail} disabled={loading || !email}>
                  Add
                </Button>
              </div>

              <Popover open={openRolesPopover} onOpenChange={setOpenRolesPopover}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between mt-2">
                    {selectedRoleIds.length ? `${selectedRoleIds.length} roles selected` : "Default: Everyone"}
                    <ChevronsUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandGroup>
                      {roles.map((role) => (
                        <CommandItem key={role.id} onSelect={() => toggleRoleSelection(role.id)}>
                          <Check
                            className={selectedRoleIds.includes(role.id) ? "mr-2 h-4 w-4" : "mr-2 h-4 w-4 opacity-0"}
                          />
                          {role.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2 mt-4">
              <h4 className="text-sm font-medium">Search Users</h4>
              <div className="flex items-center gap-2">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by username or name"
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleSearch()
                    }
                  }}
                />
                <Button type="button" onClick={handleSearch} disabled={searching || !searchQuery.trim()}>
                  {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>

              <div className="space-y-2 max-h-[200px] overflow-y-auto mt-2">
                {searchResults.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {searching ? "Searching..." : searchQuery ? "No users found" : "Search for users to add"}
                  </p>
                ) : (
                  searchResults.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-2 rounded-md hover:bg-accent/50">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar_url} alt={user.username || "User"} />
                          <AvatarFallback>{getInitials(user)}</AvatarFallback>
                        </Avatar>
                        <div className="font-medium">
                          {user.username || user.full_name || user.email || "Unknown User"}
                        </div>
                      </div>
                      <Button size="sm" onClick={() => handleAddMember(user.id)} disabled={loading}>
                        Add
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsAddMemberOpen(false)
                setSearchQuery("")
                setSearchResults([])
                setEmail("")
                setSelectedRoleIds([])
              }}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Roles Dialog */}
      <Dialog open={isEditRolesOpen} onOpenChange={setIsEditRolesOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Manage Roles</DialogTitle>
            <DialogDescription>
              {editingMember?.profiles?.username ||
                editingMember?.profiles?.full_name ||
                editingMember?.profiles?.email ||
                "User"}
              's roles in this group.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {roles.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No roles available</p>
              ) : (
                roles.map((role) => (
                  <div key={role.id} className="flex items-center justify-between p-2 rounded-md hover:bg-accent/50">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id={`role-${role.id}`}
                        checked={selectedRoleIds.includes(role.id)}
                        onChange={() => toggleRoleSelection(role.id)}
                        className="mr-2"
                        disabled={loading}
                      />
                      <Badge style={{ backgroundColor: role.color }}>{role.name}</Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsEditRolesOpen(false)
                setEditingMember(null)
                setSelectedRoleIds([])
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateMemberRoles} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

