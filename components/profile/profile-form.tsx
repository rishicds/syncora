"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"
import { useSupabase } from "@/components/supabase-provider"
import type { Profile } from "@/types/user.types"
import { USER_STATUSES } from "@/types/user.types"

interface ProfileFormProps {
  profile: Profile
}

const formSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters").max(50),
  username: z.string().min(3, "Username must be at least 3 characters").max(30),
  bio: z.string().max(160, "Bio must be less than 160 characters").optional(),
  status: z.enum(["available", "busy", "away", "offline"]),
})

export function ProfileForm({ profile }: ProfileFormProps) {
  const router = useRouter()
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: profile?.full_name || "",
      username: profile?.username || "",
      bio: profile?.bio || "",
      status: (profile?.status as any) || "available",
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true)

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: values.full_name,
          username: values.username,
          bio: values.bio,
          status: values.status,
        })
        .eq("id", profile.id)

      if (error) throw error

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      })

      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Get initials from name or email
  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    } else if (profile?.email) {
      return profile.email.substring(0, 2).toUpperCase()
    }
    return "U"
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Your Profile</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your personal information and preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="flex flex-col items-center justify-center gap-4 mb-6">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profile?.avatar_url || "/placeholder.svg?height=96&width=96"} />
                    <AvatarFallback className="text-2xl">{getInitials()}</AvatarFallback>
                  </Avatar>
                  <Button variant="outline" type="button">
                    Change Avatar
                  </Button>
                </div>

                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Your username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Tell us about yourself" className="resize-none" {...field} />
                      </FormControl>
                      <FormDescription>Brief description for your profile. Max 160 characters.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {USER_STATUSES.map((status) => (
                            <SelectItem key={status.id} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your account details and preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium mb-1">Email</h3>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
            </div>
            <div>
              <h3 className="font-medium mb-1">Account ID</h3>
              <p className="text-sm text-muted-foreground">{profile?.id}</p>
            </div>
            <div>
              <h3 className="font-medium mb-1">Roles</h3>
              <div className="flex flex-wrap gap-2 mt-2">
                {profile.role_ids && profile.role_ids.length > 0 ? (
                  profile.role_ids.map((roleId, index) => (
                    <div key={index} className="px-2 py-1 text-xs rounded-full bg-primary/10">
                      {roleId}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No roles assigned</p>
                )}
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-1">Notification Preferences</h3>
              <div className="mt-2">
                <Button variant="outline" className="w-full">
                  Manage Notifications
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-start gap-2">
            <h3 className="font-medium">Account Actions</h3>
            <div className="grid w-full gap-2">
              <Button variant="outline">Change Password</Button>
              <Button variant="destructive">Delete Account</Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

