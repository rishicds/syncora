"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Paperclip, Send, Smile } from "lucide-react"

interface MessageInputProps {
  onSendMessage: (content: string) => Promise<void>
  isLoading?: boolean
}

export function MessageInput({ onSendMessage, isLoading = false }: MessageInputProps) {
  const [message, setMessage] = useState("")

  const handleSend = async () => {
    if (!message.trim()) return
    await onSendMessage(message)
    setMessage("")
  }

  return (
    <div className="flex items-end gap-2">
      <Button variant="ghost" size="icon" className="shrink-0">
        <Paperclip className="h-5 w-5" />
        <span className="sr-only">Attach</span>
      </Button>
      <Textarea
        placeholder="Type a message..."
        className="min-h-10 resize-none"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSend()
          }
        }}
      />
      <Button variant="ghost" size="icon" className="shrink-0">
        <Smile className="h-5 w-5" />
        <span className="sr-only">Emoji</span>
      </Button>
      <Button size="icon" className="shrink-0" onClick={handleSend} disabled={isLoading || !message.trim()}>
        <Send className="h-5 w-5" />
        <span className="sr-only">Send</span>
      </Button>
    </div>
  )
}

