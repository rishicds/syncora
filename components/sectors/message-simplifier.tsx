"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, Loader2 } from "lucide-react"

// This is a standalone component that could be used elsewhere in the app
export function MessageSimplifier() {
  const [originalText, setOriginalText] = useState("")
  const [simplifiedText, setSimplifiedText] = useState("")
  const [isSimplifying, setIsSimplifying] = useState(false)

  const handleSimplify = async () => {
    if (!originalText.trim()) return

    setIsSimplifying(true)

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          task: "simplify",
          content: originalText,
        }),
      })

      if (!response.ok) throw new Error("Failed to simplify text")

      const data = await response.json()
      setSimplifiedText(data.result)
    } catch (error) {
      console.error("Error simplifying text:", error)
      setSimplifiedText("Could not simplify the text. Please try again.")
    } finally {
      setIsSimplifying(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Message Simplifier
        </CardTitle>
        <CardDescription>Paste technical text to get a simplified explanation</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Textarea
            placeholder="Paste technical message here..."
            value={originalText}
            onChange={(e) => setOriginalText(e.target.value)}
            rows={5}
            className="resize-none"
          />
        </div>
        {simplifiedText && (
          <div className="p-4 bg-muted rounded-md">
            <h4 className="text-sm font-medium mb-2">Simplified Explanation:</h4>
            <p>{simplifiedText}</p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleSimplify}
          disabled={isSimplifying || !originalText.trim()}
          className="transition-all hover:bg-primary/90 active:scale-95"
        >
          {isSimplifying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Simplifying...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Simplify
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

