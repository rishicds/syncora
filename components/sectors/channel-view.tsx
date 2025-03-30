"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { useSupabase } from "../supabase-provider"
import { useToast } from "../ui/use-toast"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { ScrollArea } from "../ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import {
  Loader2,
  Send,
  User,
  Hash,
  Sparkles,
  FileText,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Meh,
  RefreshCw,
  Paperclip,
  FileScanIcon as FileAnalytics,
  Users,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { Badge } from "../ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import GroupMembers from "./group-members"

// Type for sentiment analysis results
type Sentiment = "positive" | "neutral" | "negative"

// Type for file attachments
type FileAttachment = {
  id: string
  name: string
  size: number
  type: string
  url: string
  content?: string
  analysis?: string
  analyzing?: boolean
}

export default function ChannelView({
  channel,
  user,
  userRoles,
  group,
  roles,
  members,
  canManageMembers,
  isOwner,
}: {
  channel: any
  user: any
  userRoles: any[]
  group: any
  roles: any[]
  members: any[]
  canManageMembers: boolean
  isOwner: boolean
}) {
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [messages, setMessages] = useState<any[]>([])
  const [profiles, setProfiles] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [simplifiedMessages, setSimplifiedMessages] = useState<Record<string, string>>({})
  const [messageSentiments, setMessageSentiments] = useState<Record<string, Sentiment>>({})
  const [showSummaryDialog, setShowSummaryDialog] = useState(false)
  const [conversationSummary, setConversationSummary] = useState("")
  const [summarizing, setSummarizing] = useState(false)
  const [showMembersDrawer, setShowMembersDrawer] = useState(false)
  const [fileAttachments, setFileAttachments] = useState<FileAttachment[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const canSendMessages = userRoles.length > 0

  // Function to analyze sentiment using Gemini API (only when requested)
  const analyzeSentimentWithGemini = async (messageId: string, content: string) => {
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          task: "sentiment",
          content,
        }),
      })

      if (!response.ok) throw new Error("Failed to analyze sentiment")

      const data = await response.json()
      const sentiment = data.result.toLowerCase().trim() as Sentiment

      // Ensure we only accept valid sentiment values
      const validSentiment: Sentiment = ["positive", "negative", "neutral"].includes(sentiment) ? sentiment : "neutral"

      setMessageSentiments((prev) => ({
        ...prev,
        [messageId]: validSentiment,
      }))

      return validSentiment
    } catch (error) {
      console.error("Error analyzing sentiment:", error)
      return "neutral" as Sentiment
    }
  }

  // Function to analyze file content using Gemini API
  const analyzeFileWithGemini = async (fileId: string, content: string, fileName: string) => {
    try {
      setFileAttachments((prev) => prev.map((file) => (file.id === fileId ? { ...file, analyzing: true } : file)))

      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          task: "analyze_file",
          content: `Filename: ${fileName}\n\nContent: ${content}`,
        }),
      })

      if (!response.ok) throw new Error("Failed to analyze file")

      const data = await response.json()

      setFileAttachments((prev) =>
        prev.map((file) => (file.id === fileId ? { ...file, analysis: data.result, analyzing: false } : file)),
      )

      return data.result
    } catch (error) {
      console.error("Error analyzing file:", error)

      setFileAttachments((prev) =>
        prev.map((file) =>
          file.id === fileId ? { ...file, analysis: "Error analyzing file content", analyzing: false } : file,
        ),
      )

      throw error
    }
  }

  // Function to simplify text using Gemini API
  const simplifyTextWithGemini = async (content: string): Promise<string> => {
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          task: "simplify",
          content,
        }),
      })

      if (!response.ok) throw new Error("Failed to simplify text")

      const data = await response.json()
      return data.result
    } catch (error) {
      console.error("Error simplifying text:", error)
      throw error
    }
  }

  // Function to summarize conversation using Gemini API
  const summarizeConversationWithGemini = async (messages: any[]): Promise<string> => {
    try {
      // Format messages for the API
      const formattedConversation = messages
        .map((msg) => {
          const profile = profiles[msg.sender_id]
          const displayName = profile?.username || profile?.full_name || profile?.email || "Unknown User"
          return `${displayName}: ${msg.content}`
        })
        .join("\n")

      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          task: "summarize",
          content: formattedConversation,
        }),
      })

      if (!response.ok) throw new Error("Failed to summarize conversation")

      const data = await response.json()
      return data.result
    } catch (error) {
      console.error("Error summarizing conversation:", error)
      throw error
    }
  }

  const fetchMessages = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("channel_messages")
        .select("*")
        .eq("channel_id", channel.id)
        .order("created_at", { ascending: true })

      if (error) {
        toast({
          title: "Error loading messages",
          description: error.message,
          variant: "destructive",
        })
        return
      }

      // Set messages without animation
      setMessages(data || [])

      // Fetch profiles for all message senders
      const userIds = [...new Set(data?.map((msg) => msg.sender_id) || [])]
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url, email")
          .in("id", userIds)

        if (profilesData) {
          const profilesMap: Record<string, any> = {}
          profilesData.forEach((profile) => {
            profilesMap[profile.id] = profile
          })
          setProfiles(profilesMap)
        }
      }

      // Fetch file attachments for messages
      if (data && data.length > 0) {
        const messageIds = data.map((msg) => msg.id)
        const { data: attachmentsData, error: attachmentsError } = await supabase
          .from("message_attachments")
          .select("*")
          .in("message_id", messageIds)

        if (!attachmentsError && attachmentsData) {
          // Process attachments
          const newFileAttachments: FileAttachment[] = attachmentsData.map((attachment) => ({
            id: attachment.id,
            name: attachment.file_name,
            size: attachment.file_size,
            type: attachment.file_type,
            url: attachment.file_url,
            analysis: attachment.analysis || undefined,
          }))

          setFileAttachments(newFileAttachments)
        }
      }
    } catch (error) {
      console.error("Error fetching messages:", error)
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
      scrollToBottom()
    }
  }, [supabase, channel.id, toast])

  // Set up polling for new messages instead of real-time subscriptions
  useEffect(() => {
    fetchMessages()

    // Set up polling interval (every 10 seconds)
    refreshIntervalRef.current = setInterval(() => {
      fetchMessages()
    }, 100000)

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    }
  }, [fetchMessages])

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 100)
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchMessages()
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if ((!message.trim() && fileAttachments.length === 0) || !canSendMessages) return

    setSending(true)

    try {
      // Insert message
      const { data: messageData, error: messageError } = await supabase
        .from("channel_messages")
        .insert({
          channel_id: channel.id,
          sender_id: user.id,
          content: message.trim() || "(Attachment)",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()

      if (messageError) throw messageError

      // If there are file attachments, link them to the message
      if (fileAttachments.length > 0 && messageData) {
        const messageId = messageData[0].id

        // Update attachments with the message ID
        const attachmentUpdates = fileAttachments
          .filter((file) => !file.id.includes("temp-"))
          .map((file) => ({
            id: file.id,
            message_id: messageId,
          }))

        if (attachmentUpdates.length > 0) {
          const { error: attachmentError } = await supabase.from("message_attachments").upsert(attachmentUpdates)

          if (attachmentError) {
            console.error("Error linking attachments:", attachmentError)
          }
        }

        // Clear temporary attachments
        setFileAttachments([])
      }

      setMessage("")
      // Refresh messages to ensure immediate display
      fetchMessages()
    } catch (error: any) {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    setUploadProgress(0)

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const fileId = `temp-${Date.now()}-${i}`

        // Add file to state with temporary ID
        setFileAttachments((prev) => [
          ...prev,
          {
            id: fileId,
            name: file.name,
            size: file.size,
            type: file.type,
            url: URL.createObjectURL(file),
          },
        ])

        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            const newProgress = prev + 5
            if (newProgress >= 100) {
              clearInterval(progressInterval)
              return 100
            }
            return newProgress
          })
        }, 100)

        // Upload file to Supabase Storage
        const filePath = `channel-files/${channel.id}/${Date.now()}-${file.name}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("message-attachments")
          .upload(filePath, file)

        clearInterval(progressInterval)
        setUploadProgress(100)

        if (uploadError) {
          throw uploadError
        }

        // Get public URL
        const { data: urlData } = await supabase.storage.from("message-attachments").getPublicUrl(filePath)

        const publicUrl = urlData.publicUrl

        // Create attachment record
        const { data: attachmentData, error: attachmentError } = await supabase
          .from("message_attachments")
          .insert({
            file_name: file.name,
            file_size: file.size,
            file_type: file.type,
            file_url: publicUrl,
            uploaded_by: user.id,
            uploaded_at: new Date().toISOString(),
          })
          .select()

        if (attachmentError) {
          throw attachmentError
        }

        // Update file attachment with real ID
        setFileAttachments((prev) =>
          prev.map((f) => (f.id === attachmentData[0].id ? { ...f, id: attachmentData[0].id, url: publicUrl } : f)),
        )

        // If it's a text file, read and analyze it
        if (
          file.type.startsWith("text/") ||
          file.type === "application/json" ||
          file.type === "application/xml" ||
          file.name.endsWith(".md") ||
          file.name.endsWith(".csv")
        ) {
          const reader = new FileReader()
          reader.onload = async (event) => {
            const content = event.target?.result as string

            // Update file with content
            setFileAttachments((prev) => prev.map((f) => (f.id === attachmentData[0].id ? { ...f, content } : f)))

            // Analyze file content
            try {
              await analyzeFileWithGemini(attachmentData[0].id, content, file.name)
            } catch (error) {
              console.error("Error analyzing file:", error)
            }
          }
          reader.readAsText(file)
        }
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

      toast({
        title: "Files uploaded",
        description: `Successfully uploaded ${files.length} file(s)`,
      })
    } catch (error: any) {
      console.error("Error uploading file:", error)
      toast({
        title: "Error uploading file",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleSimplifyMessage = async (messageId: string, content: string) => {
    if (simplifiedMessages[messageId]) {
      // Toggle simplified view off if already simplified
      setSimplifiedMessages((prev) => {
        const newState = { ...prev }
        delete newState[messageId]
        return newState
      })
      return
    }

    try {
      toast({
        title: "Simplifying message...",
        description: "Please wait while we process your request",
      })

      const simplified = await simplifyTextWithGemini(content)
      setSimplifiedMessages((prev) => ({
        ...prev,
        [messageId]: simplified,
      }))
    } catch (error) {
      toast({
        title: "Error simplifying message",
        description: "Could not simplify this message",
        variant: "destructive",
      })
    }
  }

  const handleSummarizeConversation = async () => {
    setSummarizing(true)
    try {
      toast({
        title: "Generating summary...",
        description: "Please wait while we analyze the conversation",
      })

      const summary = await summarizeConversationWithGemini(messages)
      setConversationSummary(summary)
      setShowSummaryDialog(true)
    } catch (error) {
      toast({
        title: "Error summarizing conversation",
        description: "Could not generate a summary",
        variant: "destructive",
      })
    } finally {
      setSummarizing(false)
    }
  }

  const handleAnalyzeSentiment = async (messageId: string, content: string) => {
    try {
      toast({
        title: "Analyzing sentiment...",
        description: "Please wait while we process your request",
      })

      await analyzeSentimentWithGemini(messageId, content)

      toast({
        title: "Sentiment analyzed",
        description: "Message sentiment has been analyzed",
      })
    } catch (error) {
      toast({
        title: "Error analyzing sentiment",
        description: "Could not analyze sentiment for this message",
        variant: "destructive",
      })
    }
  }

  const getSentimentIcon = (sentiment: Sentiment) => {
    switch (sentiment) {
      case "positive":
        return <ThumbsUp className="h-4 w-4 text-green-500" />
      case "negative":
        return <ThumbsDown className="h-4 w-4 text-red-500" />
      default:
        return <Meh className="h-4 w-4 text-gray-500" />
    }
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) {
      return <img src="/placeholder.svg?height=24&width=24" alt="Image" className="h-6 w-6" />
    } else if (fileType.startsWith("video/")) {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6"
        >
          <polygon points="23 7 16 12 23 17 23 7" />
          <rect width="15" height="14" x="1" y="5" rx="2" ry="2" />
        </svg>
      )
    } else if (fileType.startsWith("audio/")) {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6"
        >
          <path d="M18 8a6 6 0 0 0-9.33-5" />
          <path d="m6 15-4-4 4-4" />
          <path d="M6 19v-5.5A6 6 0 0 1 18 8" />
        </svg>
      )
    } else if (fileType === "application/pdf") {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6"
        >
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      )
    } else {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6"
        >
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      )
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB"
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + " MB"
    else return (bytes / 1073741824).toFixed(1) + " GB"
  }

  const getMessageAttachments = (messageId: string) => {
    return fileAttachments.filter((file) => file.id.includes(messageId))
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold flex items-center">
            <Hash className="mr-2 h-5 w-5" />
            {channel.name}
          </h2>
          <div className="flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => setShowMembersDrawer(true)}>
                    <Users className="h-4 w-4" />
                    <span className="sr-only">Members</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View and manage members</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing} className="mr-2">
                    <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                    <span className="sr-only">Refresh</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Refresh messages</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSummarizeConversation}
                    disabled={summarizing || messages.length === 0}
                  >
                    {summarizing ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <FileText className="h-4 w-4 mr-1" />
                    )}
                    Summarize
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Summarize this conversation</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        {channel.description && <p className="text-sm text-muted-foreground">{channel.description}</p>}
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <ScrollArea className="flex-1 p-4">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Hash className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Welcome to #{channel.name}</h3>
              <p className="text-muted-foreground max-w-md mt-2">
                This is the start of the channel. Send a message to get the conversation going!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => {
                const profile = profiles[msg.sender_id]
                const isCurrentUser = msg.sender_id === user.id
                const sentiment = messageSentiments[msg.id]
                const displayName = profile?.username || profile?.full_name || profile?.email || "Unknown User"
                const messageAttachments = getMessageAttachments(msg.id)

                return (
                  <div key={msg.id} className="flex items-start gap-3 group relative">
                    <Avatar className="h-8 w-8 transition-transform hover:scale-110">
                      <AvatarImage src={profile?.avatar_url} alt={displayName} />
                      <AvatarFallback>
                        <User size={16} />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {displayName}
                          {isCurrentUser && " (you)"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                        </span>
                        {sentiment && (
                          <Badge variant="outline" className="ml-2 flex items-center gap-1">
                            {getSentimentIcon(sentiment)}
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 relative">
                        <p className={simplifiedMessages[msg.id] ? "text-muted-foreground text-sm" : ""}>
                          {simplifiedMessages[msg.id] || msg.content}
                        </p>

                        {/* File attachments */}
                        {messageAttachments.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {messageAttachments.map((file) => (
                              <div key={file.id} className="flex items-center p-2 rounded-md bg-accent/30">
                                <div className="mr-2">{getFileIcon(file.type)}</div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium truncate">{file.name}</div>
                                  <div className="text-xs text-muted-foreground">{formatFileSize(file.size)}</div>
                                </div>
                                <div className="flex gap-2">
                                  <a
                                    href={file.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-500 hover:underline"
                                  >
                                    Download
                                  </a>

                                  {file.content && !file.analysis && !file.analyzing && (
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                                          <FileAnalytics className="h-3 w-3 mr-1" />
                                          Analyze
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent>
                                        <DialogHeader>
                                          <DialogTitle>Analyze File</DialogTitle>
                                        </DialogHeader>
                                        <div className="mt-4">
                                          <Button
                                            onClick={() => analyzeFileWithGemini(file.id, file.content!, file.name)}
                                            className="w-full"
                                          >
                                            Analyze Content
                                          </Button>
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                  )}

                                  {file.analyzing && (
                                    <div className="text-xs text-muted-foreground flex items-center">
                                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                      Analyzing...
                                    </div>
                                  )}

                                  {file.analysis && (
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                                          <FileAnalytics className="h-3 w-3 mr-1" />
                                          View Analysis
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent className="max-w-3xl">
                                        <DialogHeader>
                                          <DialogTitle>File Analysis: {file.name}</DialogTitle>
                                        </DialogHeader>
                                        <div className="mt-4 max-h-[60vh] overflow-y-auto">
                                          <div className="whitespace-pre-wrap">{file.analysis}</div>
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => handleSimplifyMessage(msg.id, msg.content)}
                                >
                                  <Sparkles className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{simplifiedMessages[msg.id] ? "Show original" : "Simplify message"}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          {!sentiment && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => handleAnalyzeSentiment(msg.id, msg.content)}
                                  >
                                    <MessageSquare className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Analyze sentiment</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {uploading && (
          <div className="px-4 py-2 border-t">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm">Uploading files...</span>
              <span className="text-sm">{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-1" />
          </div>
        )}

        <form onSubmit={handleSendMessage} className="p-4 border-t">
          <div className="flex items-center gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={canSendMessages ? `Message #${channel.name}` : "You don't have permission to send messages"}
              disabled={sending || !canSendMessages}
              className="flex-1"
            />

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={!canSendMessages || uploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="transition-all hover:bg-primary/10"
                  >
                    <Paperclip className="h-4 w-4" />
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} multiple />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Attach files</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button
              type="submit"
              size="icon"
              disabled={sending || (!message.trim() && fileAttachments.length === 0) || !canSendMessages}
              className="transition-all hover:bg-primary/90 active:scale-95"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>

          {fileAttachments.length > 0 && fileAttachments.some((file) => file.id.includes("temp-")) && (
            <div className="mt-2 space-y-2">
              <div className="text-sm font-medium">Attachments:</div>
              <div className="flex flex-wrap gap-2">
                {fileAttachments
                  .filter((file) => file.id.includes("temp-"))
                  .map((file) => (
                    <div key={file.id} className="flex items-center p-2 rounded-md bg-accent/30 max-w-full">
                      <div className="mr-2">{getFileIcon(file.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{file.name}</div>
                        <div className="text-xs text-muted-foreground">{formatFileSize(file.size)}</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-2 h-6 w-6 p-0 text-destructive"
                        onClick={() => setFileAttachments((prev) => prev.filter((f) => f.id !== file.id))}
                      >
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
                        >
                          <path d="M18 6 6 18" />
                          <path d="m6 6 12 12" />
                        </svg>
                      </Button>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </form>
      </div>

      <Dialog open={showSummaryDialog} onOpenChange={setShowSummaryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Conversation Summary
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <p>{conversationSummary}</p>
          </div>
        </DialogContent>
      </Dialog>

      <Drawer open={showMembersDrawer} onOpenChange={setShowMembersDrawer}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Group Members</DrawerTitle>
          </DrawerHeader>
          <div className="h-[70vh]">
            <Tabs defaultValue="members">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="members">Members</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              <TabsContent value="members" className="h-[calc(70vh-40px)]">
                <GroupMembers
                  members={members}
                  roles={roles}
                  groupId={group}
                  canManageMembers={canManageMembers}
                  isOwner={isOwner}
                  currentUserId={user.id}
                />
              </TabsContent>
            </Tabs>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}

