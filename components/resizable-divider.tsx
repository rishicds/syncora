"use client"

import type React from "react"

import { useRef, useEffect, useState } from "react"

interface ResizableDividerProps {
  onResize: (delta: number) => void
  direction?: "horizontal" | "vertical"
  className?: string
}

export default function ResizableDivider({
  onResize,
  direction = "horizontal",
  className = "",
}: ResizableDividerProps) {
  const dividerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [startPosition, setStartPosition] = useState(0)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return

      const currentPosition = direction === "horizontal" ? e.clientX : e.clientY
      const delta = currentPosition - startPosition

      if (delta !== 0) {
        onResize(delta)
        setStartPosition(currentPosition)
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, startPosition, onResize, direction])

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setStartPosition(direction === "horizontal" ? e.clientX : e.clientY)
    document.body.style.cursor = direction === "horizontal" ? "col-resize" : "row-resize"
    document.body.style.userSelect = "none"
  }

  return (
    <div
      ref={dividerRef}
      className={`${
        direction === "horizontal"
          ? "w-1 cursor-col-resize hover:w-1.5 active:w-1.5"
          : "h-1 cursor-row-resize hover:h-1.5 active:h-1.5"
      } bg-border hover:bg-primary/50 active:bg-primary transition-all ${className}`}
      onMouseDown={handleMouseDown}
    />
  )
}

