"use client"

import * as React from "react"
import { useDropzone } from "react-dropzone"
import { UploadCloud, X, FileIcon, ImageIcon, FileTextIcon, FileVideoIcon, FileAudioIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

export interface FileUploadProps extends React.HTMLAttributes<HTMLDivElement> {
  onUpload: (files: File[]) => void
  onRemove?: (file: File) => void
  maxFiles?: number
  maxSize?: number
  accept?: Record<string, string[]>
  disabled?: boolean
  uploading?: boolean
  progress?: number
  value?: File[]
  preview?: boolean
}

const FileUpload = React.forwardRef<HTMLDivElement, FileUploadProps>(
  (
    {
      className,
      onUpload,
      onRemove,
      maxFiles = 5,
      maxSize = 5 * 1024 * 1024, // 5MB
      accept,
      disabled = false,
      uploading = false,
      progress = 0,
      value = [],
      preview = true,
      ...props
    },
    ref,
  ) => {
    const [files, setFiles] = React.useState<File[]>(value)

    React.useEffect(() => {
      setFiles(value)
    }, [value])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop: (acceptedFiles) => {
        const newFiles = [...files, ...acceptedFiles].slice(0, maxFiles)
        setFiles(newFiles)
        onUpload(newFiles)
      },
      maxFiles,
      maxSize,
      accept,
      disabled: disabled || uploading,
    })

    const handleRemove = (file: File) => {
      const newFiles = files.filter((f) => f !== file)
      setFiles(newFiles)
      if (onRemove) {
        onRemove(file)
      } else {
        onUpload(newFiles)
      }
    }

    const getFileIcon = (file: File) => {
      if (file.type.startsWith("image/")) {
        return <ImageIcon className="h-6 w-6 text-blue-500" />
      } else if (file.type.startsWith("video/")) {
        return <FileVideoIcon className="h-6 w-6 text-purple-500" />
      } else if (file.type.startsWith("audio/")) {
        return <FileAudioIcon className="h-6 w-6 text-green-500" />
      } else if (file.type === "application/pdf") {
        return <FileTextIcon className="h-6 w-6 text-red-500" />
      } else {
        return <FileIcon className="h-6 w-6 text-gray-500" />
      }
    }

    const renderPreview = (file: File) => {
      if (!preview) return null

      if (file.type.startsWith("image/")) {
        return (
          <div className="relative h-16 w-16 overflow-hidden rounded-md">
            <img
              src={URL.createObjectURL(file) || "/placeholder.svg"}
              alt={file.name}
              className="h-full w-full object-cover"
              onLoad={() => URL.revokeObjectURL(URL.createObjectURL(file))}
            />
          </div>
        )
      }
      return null
    }

    return (
      <div ref={ref} className={cn("space-y-4", className)} {...props}>
        <div
          {...getRootProps()}
          className={cn(
            "flex flex-col items-center justify-center rounded-lg border border-dashed p-6 transition-colors",
            isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
            disabled || uploading
              ? "cursor-not-allowed opacity-60"
              : "cursor-pointer hover:border-primary/50 hover:bg-primary/5",
            className,
          )}
        >
          <input {...getInputProps()} />
          <UploadCloud className="mb-2 h-10 w-10 text-muted-foreground" />
          <div className="text-center">
            <p className="text-sm font-medium">{isDragActive ? "Drop files here" : "Drag and drop files here"}</p>
            <p className="text-xs text-muted-foreground">
              or click to browse (max {maxFiles} files, {(maxSize / (1024 * 1024)).toFixed(0)}MB each)
            </p>
          </div>
        </div>

        {uploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Uploading...</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        {files.length > 0 && (
          <div className="space-y-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center gap-2 rounded-md border p-2">
                {renderPreview(file) || getFileIcon(file)}
                <div className="flex-1 truncate">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleRemove(file)}
                  disabled={disabled || uploading}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Remove file</span>
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  },
)
FileUpload.displayName = "FileUpload"

export { FileUpload }

