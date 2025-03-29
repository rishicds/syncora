"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Bot, Languages } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface MessageActionsProps {
  conversationId: string
  onSummaryGenerated?: (summary: string) => void
  onTranslationGenerated?: (translation: string) => void
}

export function MessageActions({ conversationId, onSummaryGenerated, onTranslationGenerated }: MessageActionsProps) {
  const { toast } = useToast()
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [isTranslating, setIsTranslating] = useState(false)

  const handleSummarize = async () => {
    setIsSummarizing(true)

    try {
      // In a real implementation, this would call your AI service
      // For now, we'll simulate a response
      setTimeout(() => {
        const aiSummary =
          "This is an AI-generated summary of the conversation. The participants discussed project requirements, timelines, and next steps."

        if (onSummaryGenerated) {
          onSummaryGenerated(aiSummary)
        }

        toast({
          title: "Summary Generated",
          description: "AI has summarized the conversation.",
        })

        setIsSummarizing(false)
      }, 2000)
    } catch (error: any) {
      toast({
        title: "Error generating summary",
        description: error.message,
        variant: "destructive",
      })
      setIsSummarizing(false)
    }
  }

  const handleTranslate = async () => {
    setIsTranslating(true)

    try {
      // In a real implementation, this would call your AI service
      // For now, we'll simulate a response
      setTimeout(() => {
        const translation = "This is a simplified version of the technical discussion in layman's terms."

        if (onTranslationGenerated) {
          onTranslationGenerated(translation)
        }

        toast({
          title: "Translation Generated",
          description: "AI has translated technical terms to simpler language.",
        })

        setIsTranslating(false)
      }, 2000)
    } catch (error: any) {
      toast({
        title: "Error generating translation",
        description: error.message,
        variant: "destructive",
      })
      setIsTranslating(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={handleSummarize} disabled={isSummarizing}>
        <Bot className="mr-2 h-4 w-4" />
        {isSummarizing ? "Summarizing..." : "Summarize"}
      </Button>
      <Button variant="outline" size="sm" onClick={handleTranslate} disabled={isTranslating}>
        <Languages className="mr-2 h-4 w-4" />
        {isTranslating ? "Translating..." : "Simplify"}
      </Button>
    </div>
  )
}

