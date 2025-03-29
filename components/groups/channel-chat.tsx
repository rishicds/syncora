"use client"

import { useState, useRef, useEffect } from "react"
import type { User } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useSupabase } from "@/components/supabase-provider"
import type { Channel, Group, GroupMember } from "@/types/group.types"
import type { ChannelMessage } from "@/types/message.types"
import type { Role } from "@/types/role.types"
import type { Profile } from "@/types/user.types"
import { ChannelHeader } from "@/components/groups/channel-header"
import { ChannelMembers } from "@/components/groups/channel-members"
import { EmojiPicker } from "@/components/ui/emoji-picker"
import { FileUpload } from "@/components/ui/file-upload"
import {
  Bot,
  Send,
  Paperclip,
  Languages,
  BarChart,
  Loader2,
  FileIcon,
  FileTextIcon,
  ImageIcon,
  FileVideoIcon,
  FileAudioIcon,
  Download,
  X,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { summarizeConversation, simplifyTechnicalContent, analyzeSentiment } from "@/lib/ai-service"
import { hasPermission } from "@/lib/permissions"
import { uploadFile, type UploadedFile } from "@/lib/file-service"
import { handleError } from "@/lib/error-handler"

interface ChannelChatProps {
  channel: Channel
  group: Group & { roles: Role[] }
  messages: ChannelMessage[]
  members: (GroupMember & { profiles: Profile })[]
  currentUser: User
}

export function ChannelChat({ channel, group, messages: initialMessages, members, currentUser }: ChannelChatProps) {
  const router = useRouter()
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [messages, setMessages] = useState<ChannelMessage[]>(initialMessages)
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isAiProcessing, setIsAiProcessing] = useState(false)
  const [showMembers, setShowMembers] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showFileUpload, setShowFileUpload] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Get current user's roles in this group
  const currentMember = members.find((m) => m.user_id === currentUser.id)
  const userRoles = group.roles.filter((role) => currentMember?.role_ids.includes(role.id))

  // Check if user can use AI features
  const canUseAI = userRoles.some((role) => hasPermission(role.permissions, "USE_AI_FEATURES"))

  // Check if user can attach files
  const canAttachFiles = userRoles.some((role) => hasPermission(role.permissions, "ATTACH_FILES"))

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Set up real-time subscription to messages
  useEffect(() => {
    const setupChannel = async () => {
      const channelInstance = supabase
        .channel(`channel:${channel.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "channel_messages",
            filter: `channel_id=eq.${channel.id}`,
          },
          async (payload) => {
            // Fetch the complete message with profile info
            const { data } = await supabase
              .from("channel_messages")
              .select("*, profiles(*)")
              .eq("id", payload.new.id)
              .single()

            if (data) {
              setMessages((prev) => [...prev, data])
            }
          },
        )
        .subscribe()

      return channelInstance
    }

    const channelSubscription = setupChannel()

    return async () => {
      ;(await channelSubscription).unsubscribe()
    }
  }, [supabase, channel.id])

  const handleSendMessage = async () => {
    if (!newMessage.trim() && uploadedFiles.length === 0) return

    setIsLoading(true)

    try {
      // Prepare message content
      let content = newMessage.trim()

      // Add file attachments if any
      if (uploadedFiles.length > 0) {
        const fileAttachments = uploadedFiles.map((file) => ({
          id: file.id,
          name: file.name,
          type: file.type,
          size: file.size,
          url: file.url,
          thumbnailUrl: file.thumbnailUrl,
        }))

        // If there's no text message but there are files, add a placeholder
        if (!content && fileAttachments.length > 0) {
          content = "Shared files"
        }

        // Append file metadata as JSON
        content += `\n\n__FILE_ATTACHMENTS__${JSON.stringify(fileAttachments)}`
      }

      const { data, error } = await supabase
        .from("channel_messages")
        .insert({
          channel_id: channel.id,
          sender_id: currentUser.id,
          content: content,
          is_ai_generated: false,
        })
        .select()

      if (error) throw error

      setNewMessage("")
      setUploadedFiles([])
      setShowFileUpload(false)
    } catch (error) {
      const handledError = handleError(error)
      toast({
        title: "Error sending message",
        description: handledError.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAiAction = async (action: "summarize" | "simplify" | "sentiment") => {
    if (!canUseAI) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to use AI features.",
        variant: "destructive",
      })
      return
    }

    if (messages.length < 3 && action === "summarize") {
      toast({
        title: "Not enough messages",
        description: "Need more messages to generate a summary.",
        variant: "destructive",
      })
      return
    }

    setIsAiProcessing(true)

    try {
      let aiContent = ""
      let aiType = ""

      switch (action) {
        case "summarize":
          aiContent = await summarizeConversation(messages)
          aiType = "summary"
          break
        case "simplify":
          // Get the last non-AI message
          const lastMessage = [...messages].reverse().find((m) => !m.is_ai_generated && m.sender_id !== currentUser.id)

          if (!lastMessage) {
            toast({
              title: "No message to simplify",
              description: "There are no technical messages to simplify.",
              variant: "destructive",
            })
            setIsAiProcessing(false)
            return
          }

          aiContent = await simplifyTechnicalContent(lastMessage.content)
          aiType = "translation"
          break
        case "sentiment":
          // Get the last 10 messages
          const recentMessages = messages.slice(-10)
          const combinedContent = recentMessages.map((m) => m.content).join("\n")

          const sentimentResult = await analyzeSentiment(combinedContent)
          aiContent = `Sentiment Analysis:\n\nOverall sentiment: ${sentimentResult.sentiment}\nUrgency level: ${sentimentResult.urgency}\n\nThis conversation ${
            sentimentResult.sentiment === "positive"
              ? "has a positive tone"
              : sentimentResult.sentiment === "negative"
                ? "has some negative elements that might need attention"
                : "is generally neutral in tone"
          }. ${
            sentimentResult.urgency === "high"
              ? "There appears to be urgent matters that may require immediate attention."
              : sentimentResult.urgency === "medium"
                ? "There are some matters that may need attention soon."
                : "No urgent matters detected."
          }`
          aiType = "sentiment"
          break
      }

      // Add the AI message to the channel
      const { error } = await supabase.from("channel_messages").insert({
        channel_id: channel.id,
        sender_id: currentUser.id,
        content: aiContent,
        is_ai_generated: true,
        ai_type: aiType,
      })

      if (error) throw error
    } catch (error) {
      const handledError = handleError(error)
      toast({
        title: `Error with AI ${action}`,
        description: handledError.message,
        variant: "destructive",
      })
    } finally {
      setIsAiProcessing(false)
    }
  }

  const handleFileUpload = async (files: File[]) => {
    if (!canAttachFiles) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to attach files.",
        variant: "destructive",
      })
      return
    }

    if (files.length === 0) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const uploadedFiles: UploadedFile[] = []

      // Upload each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const progress = Math.round((i / files.length) * 100)
        setUploadProgress(progress)

        // Generate thumbnail for images
        const generateThumbnail = file.type.startsWith("image/")

        // Upload to storage
        const uploadedFile = await uploadFile(file, `channels/${channel.id}`, generateThumbnail)

        uploadedFiles.push(uploadedFile)
      }

      setUploadProgress(100)
      setUploadedFiles(uploadedFiles)

      toast({
        title: "Files uploaded",
        description: `Successfully uploaded ${uploadedFiles.length} file(s)`,
      })
    } catch (error) {
      const handledError = handleError(error)
      toast({
        title: "Error uploading files",
        description: handledError.message,
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  // Get initials from name or email
  const getInitials = (profile?: Profile) => {
    if (!profile) return "U"
    if (profile.full_name) {
      return profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    } else if (profile.email) {
      return profile.email?.substring(0, 2).toUpperCase()
    }
    return "U"
  }

  // Get user's highest role color
  const getUserRoleColor = (userId: string) => {
    const member = members.find((m) => m.user_id === userId)
    if (!member || !member.role_ids.length) return "#9E9E9E" // Default gray

    // Find the highest position role
    const memberRoles = group.roles
      .filter((role) => member.role_ids.includes(role.id))
      .sort((a, b) => b.position - a.position)

    return memberRoles[0]?.color || "#9E9E9E"
  }

  // Parse file attachments from message content
  const parseFileAttachments = (content: string) => {
    const fileAttachmentMatch = content.match(/__FILE_ATTACHMENTS__(.*)/s)
    if (!fileAttachmentMatch) return { content, files: [] }

    try {
      const fileAttachmentsJson = fileAttachmentMatch[1]
      const files = JSON.parse(fileAttachmentsJson)

      // Remove the file attachments part from the content
      const cleanContent = content.replace(/__FILE_ATTACHMENTS__.*$/s, "").trim()

      return { content: cleanContent, files }
    } catch (e) {
      return { content, files: [] }
    }
  }

  // Render file attachment
  const renderFileAttachment = (file: any) => {
    const fileType = file.type
    let fileIcon

    if (fileType.startsWith("image/")) {
      fileIcon = <ImageIcon className="h-5 w-5 text-blue-500" />
    } else if (fileType.startsWith("video/")) {
      fileIcon = <FileVideoIcon className="h-5 w-5 text-purple-500" />
    } else if (fileType.startsWith("audio/")) {
      fileIcon = <FileAudioIcon className="h-5 w-5 text-green-500" />
    } else if (fileType === "application/pdf") {
      fileIcon = <FileTextIcon className="h-5 w-5 text-red-500" />
    } else {
      fileIcon = <FileIcon className="h-5 w-5 text-gray-500" />
    }

    return (
      <div key={file.id} className="mt-2 flex items-center gap-2 rounded-md border p-2 bg-background">
        {fileType.startsWith("image/") && file.thumbnailUrl ? (
          <div className="relative h-10 w-10 overflow-hidden rounded-md">
            <img src={file.thumbnailUrl || "/placeholder.svg"} alt={file.name} className="h-full w-full object-cover" />
          </div>
        ) : (
          fileIcon
        )}
        <div className="flex-1 truncate">
          <p className="text-sm font-medium truncate">{file.name}</p>
          <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <a href={file.url} target="_blank" rel="noopener noreferrer" download>
            <Download className="h-4 w-4" />
            <span className="sr-only">Download</span>
          </a>
        </Button>
      </div>
    )
  }

  // Handle emoji selection
  const handleEmojiSelect = (emoji: any) => {
    setNewMessage((prev) => prev + emoji.native)
  }

  return (
    <div className="flex h-full">
      <div className="flex flex-1 flex-col h-full">
        <ChannelHeader
          channel={channel}
          group={group}
          memberCount={members.length}
          onToggleMembers={() => setShowMembers(!showMembers)}
        />

        <div className="flex-1 overflow-auto p-4">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground">No messages yet</p>
                <p className="text-sm text-muted-foreground">Send a message to start the conversation</p>
              </div>
            ) : (
              messages.map((message) => {
                const isCurrentUser = message.sender_id === currentUser.id
                const isAiMessage = message.is_ai_generated
                const senderProfile = message.profiles
                const roleColor = getUserRoleColor(message.sender_id)

                // Parse file attachments if any
                const { content: messageContent, files: attachedFiles } = parseFileAttachments(message.content)

                return (
                  <div key={message.id} className="flex gap-2">
                    {!isCurrentUser && !isAiMessage && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={senderProfile?.avatar_url || "/placeholder.svg?height=32&width=32"} />
                        <AvatarFallback>{getInitials(senderProfile)}</AvatarFallback>
                      </Avatar>
                    )}

                    {isAiMessage && (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-primary-foreground">AI</AvatarFallback>
                      </Avatar>
                    )}

                    <div className="flex-1">
                      {!isCurrentUser && !isAiMessage && (
                        <p className="text-sm font-medium mb-1" style={{ color: roleColor }}>
                          {senderProfile?.full_name || senderProfile?.username || "Unknown User"}
                        </p>
                      )}

                      {isAiMessage && (
                        <p className="text-sm font-medium mb-1 text-primary">
                          AI Assistant {message.ai_type && `(${message.ai_type})`}
                        </p>
                      )}

                      <Card
                        className={`p-3 ${
                          isCurrentUser && !isAiMessage
                            ? "bg-primary text-primary-foreground ml-auto"
                            : isAiMessage
                              ? "bg-secondary text-secondary-foreground"
                              : ""
                        } ${isCurrentUser && !isAiMessage ? "max-w-[80%]" : "max-w-[90%]"}`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{messageContent}</p>

                        {/* Render file attachments */}
                        {attachedFiles && attachedFiles.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {attachedFiles.map((file: any) => renderFileAttachment(file))}
                          </div>
                        )}
                      </Card>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(message.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {showFileUpload && (
          <div className="border-t p-4">
            <FileUpload
              onUpload={handleFileUpload}
              maxFiles={5}
              maxSize={10 * 1024 * 1024} // 10MB
              disabled={isUploading || isLoading}
              uploading={isUploading}
              progress={uploadProgress}
              value={[]}
              preview={true}
              accept={{
                "image/*": [],
                "application/pdf": [],
                "application/msword": [],
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [],
                "application/vnd.ms-excel": [],
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [],
                "text/plain": [],
                "application/zip": [],
                "application/x-zip-compressed": [],
                "video/*": [],
                "audio/*": [],
              }}
            />
          </div>
        )}

        <div className="border-t p-4">
          <div className="flex items-end gap-2">
            {canAttachFiles && (
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={() => setShowFileUpload(!showFileUpload)}
                disabled={isLoading || isUploading}
              >
                <Paperclip className="h-5 w-5" />
                <span className="sr-only">Attach</span>
              </Button>
            )}
            <Textarea
              placeholder="Type a message..."
              className="min-h-10 resize-none"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
              disabled={isLoading || isUploading}
            />

            <EmojiPicker onEmojiSelect={handleEmojiSelect} disabled={isLoading || isUploading} />

            {canUseAI && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    disabled={isAiProcessing || isLoading || isUploading}
                  >
                    {isAiProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Bot className="h-5 w-5" />}
                    <span className="sr-only">AI Actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleAiAction("summarize")}>
                    <Bot className="mr-2 h-4 w-4" />
                    <span>Summarize Conversation</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAiAction("simplify")}>
                    <Languages className="mr-2 h-4 w-4" />
                    <span>Simplify Technical Message</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAiAction("sentiment")}>
                    <BarChart className="mr-2 h-4 w-4" />
                    <span>Analyze Sentiment</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <Button
              size="icon"
              className="shrink-0"
              onClick={handleSendMessage}
              disabled={isLoading || isUploading || (!newMessage.trim() && uploadedFiles.length === 0)}
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              <span className="sr-only">Send</span>
            </Button>
          </div>

          {/* Show uploaded files preview */}
          {uploadedFiles.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium">Attached files:</p>
              <div className="flex flex-wrap gap-2">
                {uploadedFiles.map((file) => (
                  <div key={file.id} className="flex items-center gap-2 rounded-md border p-2 bg-background">
                    {file.type.startsWith("image/") && file.thumbnailUrl ? (
                      <div className="relative h-8 w-8 overflow-hidden rounded-md">
                        <img
                          src={file.thumbnailUrl || "/placeholder.svg"}
                          alt={file.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <FileIcon className="h-4 w-4" />
                    )}
                    <span className="text-xs truncate max-w-[100px]">{file.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setUploadedFiles((prev) => prev.filter((f) => f.id !== file.id))}
                    >
                      <X className="h-3 w-3" />
                      <span className="sr-only">Remove</span>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showMembers && (
        <ChannelMembers
          groupId={group.id}
          members={members}
          roles={group.roles}
          onClose={() => setShowMembers(false)}
          currentUserId={currentUser.id}
          refetchMembers={(): void => {
            // This would typically fetch the latest members data
            router.refresh()
          }}
        />
      )}
    </div>
  )
}

