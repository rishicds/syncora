"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"
import { useSupabase } from "@/components/supabase-provider"
import type { Group } from "@/types/group.types"
import { DEFAULT_ROLES } from "@/types/role.types"

interface CreateGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onGroupCreated: (group: Group) => void
}

const formSchema = z.object({
  name: z
    .string()
    .min(3, "Group name must be at least 3 characters")
    .max(50, "Group name must be less than 50 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
})

export function CreateGroupDialog({ open, onOpenChange, onGroupCreated }: CreateGroupDialogProps) {
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true)

    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        throw new Error("User not authenticated")
      }

      // Create the group
      const { data: groupData, error: groupError } = await supabase
        .from("groups")
        .insert({
          name: values.name,
          description: values.description || null,
          owner_id: userData.user.id,
        })
        .select()
        .single()

      if (groupError) throw groupError

      // Create default roles for the group
      const rolesToCreate = DEFAULT_ROLES.map((role) => ({
        ...role,
        group_id: groupData.id,
      }))

      const { data: rolesData, error: rolesError } = await supabase.from("roles").insert(rolesToCreate).select()

      if (rolesError) throw rolesError

      // Find the admin role ID
      const adminRole = rolesData.find((role) => role.name === "Admin")
      const everyoneRole = rolesData.find((role) => role.name === "Everyone")

      // Add the creator as a member with admin role
      const { error: memberError } = await supabase.from("group_members").insert({
        group_id: groupData.id,
        user_id: userData.user.id,
        role_ids: [adminRole?.id, everyoneRole?.id].filter(Boolean),
      })

      if (memberError) throw memberError

      // Create a default general channel
      const { data: channelData, error: channelError } = await supabase
        .from("channels")
        .insert({
          group_id: groupData.id,
          name: "general",
          type: "text",
          allowed_role_ids: [everyoneRole?.id].filter(Boolean),
        })
        .select()

      if (channelError) throw channelError

      // Combine all data for the callback
      const newGroup: Group = {
        ...groupData,
        channels: channelData,
        roles: rolesData,
      }

      toast({
        title: "Group created",
        description: "Your group has been created successfully.",
      })

      onGroupCreated(newGroup)
      onOpenChange(false)
      form.reset()
    } catch (error: any) {
      toast({
        title: "Error creating group",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Group</DialogTitle>
          <DialogDescription>Create a new group to collaborate with your team.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter group name" {...field} />
                  </FormControl>
                  <FormDescription>This is the name of your group.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter group description" className="resize-none" {...field} />
                  </FormControl>
                  <FormDescription>Optional description for your group.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Group"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

