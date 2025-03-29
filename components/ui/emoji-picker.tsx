"use client"
import data from "@emoji-mart/data"
import Picker from "@emoji-mart/react"
import { Smile } from "lucide-react"

import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"

export interface EmojiPickerProps {
  onEmojiSelect?: (emoji: any) => void
  disabled?: boolean
  className?: string
  triggerClassName?: string
}

export function EmojiPicker({ onEmojiSelect, disabled = false, className, triggerClassName }: EmojiPickerProps) {
  const { theme } = useTheme()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className={cn("h-9 w-9", triggerClassName)} disabled={disabled}>
          <Smile className="h-5 w-5" />
          <span className="sr-only">Emoji picker</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent side="top" align="end" className={cn("w-auto p-0", className)}>
        <Picker
          data={data}
          onEmojiSelect={onEmojiSelect}
          theme={theme === "dark" ? "dark" : "light"}
          previewPosition="none"
          skinTonePosition="none"
        />
      </PopoverContent>
    </Popover>
  )
}

