"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Bot, Languages, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface MessageActionsProps {
  conversationId: string
  messages: any[]
  onAIResponseGenerated: (response: string, type: "summary" | "simplified") => void
  className?: string
}

export function MessageActions({
  conversationId,
  messages,
  onAIResponseGenerated,
  className = "",
}: MessageActionsProps) {
  const { toast } = useToast()
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [isTranslating, setIsTranslating] = useState(false)

  const handleSummarize = async () => {
    if (messages.length < 3) {
      toast({
        title: "Not enough messages",
        description: "Need more messages to generate a summary.",
        variant: "destructive",
      })
      return
    }

    setIsSummarizing(true)

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "summarize",
          messages,
          conversationId,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate summary")
      }

      const data = await response.json()
      onAIResponseGenerated(data.result, "summary")

      toast({
        title: "Summary Generated",
        description: "AI has summarized the conversation.",
      })
    } catch (error: any) {
      toast({
        title: "Error generating summary",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSummarizing(false)
    }
  }

  const handleTranslate = async () => {
    if (messages.length < 1) {
      toast({
        title: "Not enough messages",
        description: "Need more messages to simplify.",
        variant: "destructive",
      })
      return
    }

    setIsTranslating(true)

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "simplify",
          messages,
          conversationId,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to simplify conversation")
      }

      const data = await response.json()
      onAIResponseGenerated(data.result, "simplified")

      toast({
        title: "Simplification Complete",
        description: "AI has simplified the technical terms.",
      })
    } catch (error: any) {
      toast({
        title: "Error simplifying conversation",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsTranslating(false)
    }
  }

  return (
    <TooltipProvider>
      <div className={`flex items-center gap-2 ${className}`}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSummarize}
              disabled={isSummarizing || isTranslating}
              className="transition-all hover:bg-primary hover:text-primary-foreground"
            >
              {isSummarizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
              {isSummarizing ? "Summarizing..." : "Summarize"}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Generate an AI summary of this conversation</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleTranslate}
              disabled={isSummarizing || isTranslating}
              className="transition-all hover:bg-primary hover:text-primary-foreground"
            >
              {isTranslating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Languages className="mr-2 h-4 w-4" />
              )}
              {isTranslating ? "Simplifying..." : "Simplify"}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Translate technical terms into simpler language</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}

