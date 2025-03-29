"use client"

import { useState, useEffect } from "react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { useSupabase } from "@/components/supabase-provider"
import type { Channel } from "@/types/group.types"
import type { Role } from "@/types/role.types"

interface CreateChannelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupId: string
  onChannelCreated: (channel: Channel) => void
}

const formSchema = z.object({
  name: z
    .string()
    .min(2, "Channel name must be at least 2 characters")
    .max(50, "Channel name must be less than 50 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  type: z.enum(["text", "voice", "announcement"]),
  allowedRoleIds: z.array(z.string()).optional(),
})

export function CreateChannelDialog({ open, onOpenChange, groupId, onChannelCreated }: CreateChannelDialogProps) {
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [roles, setRoles] = useState<Role[]>([])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "text",
      allowedRoleIds: [],
    },
  })

  useEffect(() => {
    async function fetchRoles() {
      if (!groupId) return

      try {
        const { data, error } = await supabase.from("roles").select("*").eq("group_id", groupId)

        if (error) throw error

        setRoles(data || [])
      } catch (error) {
        console.error("Error fetching roles:", error)
      }
    }

    if (open) {
      fetchRoles()
    }
  }, [supabase, groupId, open])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true)

    try {
      // Create the channel
      const { data, error } = await supabase
        .from("channels")
        .insert({
          group_id: groupId,
          name: values.name,
          description: values.description || null,
          type: values.type,
          allowed_role_ids: values.allowedRoleIds?.length ? values.allowedRoleIds : null,
        })
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Channel created",
        description: "Your channel has been created successfully.",
      })

      onChannelCreated(data)
      onOpenChange(false)
      form.reset()
    } catch (error: any) {
      toast({
        title: "Error creating channel",
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
          <DialogTitle>Create New Channel</DialogTitle>
          <DialogDescription>Create a new channel in your group.</DialogDescription>
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
                    <Input placeholder="Enter channel name" {...field} />
                  </FormControl>
                  <FormDescription>This is the name of your channel.</FormDescription>
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
                    <Textarea placeholder="Enter channel description" className="resize-none" {...field} />
                  </FormControl>
                  <FormDescription>Optional description for your channel.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Channel Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select channel type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="text">Text Channel</SelectItem>
                      <SelectItem value="voice">Voice Channel</SelectItem>
                      <SelectItem value="announcement">Announcement Channel</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>The type of channel determines its functionality.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="allowedRoleIds"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">Allowed Roles</FormLabel>
                    <FormDescription>Select which roles can access this channel.</FormDescription>
                  </div>
                  {roles.map((role) => (
                    <FormField
                      key={role.id}
                      control={form.control}
                      name="allowedRoleIds"
                      render={({ field }) => {
                        return (
                          <FormItem key={role.id} className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(role.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...(field.value || []), role.id])
                                    : field.onChange(field.value?.filter((value) => value !== role.id))
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              <span
                                className="inline-block w-3 h-3 rounded-full mr-2"
                                style={{ backgroundColor: role.color }}
                              ></span>
                              {role.name}
                            </FormLabel>
                          </FormItem>
                        )
                      }}
                    />
                  ))}
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Channel"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

