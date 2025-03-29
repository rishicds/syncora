"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { useSupabase } from "@/components/supabase-provider"
import type { Role } from "@/types/role.types"
import type { Group } from "@/types/group.types"

interface RoleManagementProps {
  group: Group
  roles: Role[]
  onRoleCreated: (role: Role) => void
  onRoleUpdated: (role: Role) => void
  onRoleDeleted: (roleId: string) => void
}

const formSchema = z.object({
  name: z
    .string()
    .min(2, "Role name must be at least 2 characters")
    .max(30, "Role name must be less than 30 characters"),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Must be a valid hex color"),
  position: z.number().min(0, "Position must be a positive number"),
  permissions: z.record(z.boolean()),
})

export function RoleManagement({ group, roles, onRoleCreated, onRoleUpdated, onRoleDeleted }: RoleManagementProps) {
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      color: "#9E9E9E",
      position: 0,
      permissions: {
        VIEW_CHANNELS: true,
        MANAGE_CHANNELS: false,
        MANAGE_ROLES: false,
        MANAGE_GROUP: false,
        KICK_MEMBERS: false,
        BAN_MEMBERS: false,

        SEND_MESSAGES: true,
        EMBED_LINKS: true,
        ATTACH_FILES: true,
        ADD_REACTIONS: true,
        USE_AI_FEATURES: false,
        MANAGE_MESSAGES: false,
        MENTION_EVERYONE: false,

        CONNECT: true,
        SPEAK: true,
        STREAM: false,
        MUTE_MEMBERS: false,
        DEAFEN_MEMBERS: false,
        MOVE_MEMBERS: false,
      },
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true)

    try {
      if (isCreating) {
        // Create new role
        const { data, error } = await supabase
          .from("roles")
          .insert({
            group_id: group.id,
            name: values.name,
            color: values.color,
            position: values.position,
            permissions: values.permissions,
            is_default: false,
          })
          .select()
          .single()

        if (error) throw error

        toast({
          title: "Role created",
          description: "The role has been created successfully.",
        })

        onRoleCreated(data)
        resetForm()
      } else if (selectedRole) {
        // Update existing role
        const { data, error } = await supabase
          .from("roles")
          .update({
            name: values.name,
            color: values.color,
            position: values.position,
            permissions: values.permissions,
          })
          .eq("id", selectedRole.id)
          .select()
          .single()

        if (error) throw error

        toast({
          title: "Role updated",
          description: "The role has been updated successfully.",
        })

        onRoleUpdated(data)
        resetForm()
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteRole = async () => {
    if (!selectedRole) return

    setIsLoading(true)

    try {
      // Check if it's a default role
      if (selectedRole.is_default) {
        throw new Error("Cannot delete default roles")
      }

      const { error } = await supabase.from("roles").delete().eq("id", selectedRole.id)

      if (error) throw error

      toast({
        title: "Role deleted",
        description: "The role has been deleted successfully.",
      })

      onRoleDeleted(selectedRole.id)
      resetForm()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setSelectedRole(null)
    setIsCreating(false)
    form.reset()
  }

  const selectRole = (role: Role) => {
    setSelectedRole(role)
    setIsCreating(false)

    form.reset({
      name: role.name,
      color: role.color,
      position: role.position,
      permissions: role.permissions as any,
    })
  }

  const startCreatingRole = () => {
    resetForm()
    setIsCreating(true)
  }

  // Sort roles by position
  const sortedRoles = [...roles].sort((a, b) => b.position - a.position)

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Roles</CardTitle>
          <CardDescription>Manage roles for your group</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button onClick={startCreatingRole}>Create New Role</Button>

            <div className="space-y-2">
              {sortedRoles.map((role) => (
                <div
                  key={role.id}
                  className={`flex items-center justify-between p-3 rounded-md border cursor-pointer hover:bg-accent ${
                    selectedRole?.id === role.id ? "bg-accent" : ""
                  }`}
                  onClick={() => selectRole(role)}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: role.color }}></div>
                    <span>{role.name}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">Position: {role.position}</div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{isCreating ? "Create Role" : selectedRole ? "Edit Role" : "Select a Role"}</CardTitle>
          <CardDescription>
            {isCreating
              ? "Create a new role"
              : selectedRole
                ? "Edit role settings and permissions"
                : "Select a role from the list to edit"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(isCreating || selectedRole) && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter role name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role Color</FormLabel>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full border" style={{ backgroundColor: field.value }}></div>
                        <FormControl>
                          <Input type="color" {...field} />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          onChange={(e) => field.onChange(Number.parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>Higher positions have more authority</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <h3 className="text-lg font-medium mb-2">Permissions</h3>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">General Permissions</h4>
                      <div className="space-y-2">
                        {[
                          { id: "VIEW_CHANNELS", label: "View Channels" },
                          { id: "MANAGE_CHANNELS", label: "Manage Channels" },
                          { id: "MANAGE_ROLES", label: "Manage Roles" },
                          { id: "MANAGE_GROUP", label: "Manage Group" },
                          { id: "KICK_MEMBERS", label: "Kick Members" },
                          { id: "BAN_MEMBERS", label: "Ban Members" },
                        ].map((permission) => (
                          <FormField
                            key={permission.id}
                            control={form.control}
                            name={`permissions.${permission.id}`}
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                                <FormLabel className="font-normal">{permission.label}</FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-sm font-medium mb-2">Channel Permissions</h4>
                      <div className="space-y-2">
                        {[
                          { id: "SEND_MESSAGES", label: "Send Messages" },
                          { id: "EMBED_LINKS", label: "Embed Links" },
                          { id: "ATTACH_FILES", label: "Attach Files" },
                          { id: "ADD_REACTIONS", label: "Add Reactions" },
                          { id: "USE_AI_FEATURES", label: "Use AI Features" },
                          { id: "MANAGE_MESSAGES", label: "Manage Messages" },
                          { id: "MENTION_EVERYONE", label: "Mention @everyone" },
                        ].map((permission) => (
                          <FormField
                            key={permission.id}
                            control={form.control}
                            name={`permissions.${permission.id}`}
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                                <FormLabel className="font-normal">{permission.label}</FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-sm font-medium mb-2">Voice Permissions</h4>
                      <div className="space-y-2">
                        {[
                          { id: "CONNECT", label: "Connect" },
                          { id: "SPEAK", label: "Speak" },
                          { id: "STREAM", label: "Video" },
                          { id: "MUTE_MEMBERS", label: "Mute Members" },
                          { id: "DEAFEN_MEMBERS", label: "Deafen Members" },
                          { id: "MOVE_MEMBERS", label: "Move Members" },
                        ].map((permission) => (
                          <FormField
                            key={permission.id}
                            control={form.control}
                            name={`permissions.${permission.id}`}
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                                <FormLabel className="font-normal">{permission.label}</FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Saving..." : isCreating ? "Create Role" : "Update Role"}
                  </Button>

                  {selectedRole && !selectedRole.is_default && (
                    <Button type="button" variant="destructive" onClick={handleDeleteRole} disabled={isLoading}>
                      Delete Role
                    </Button>
                  )}

                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

