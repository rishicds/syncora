import { createClient } from "@supabase/supabase-js"
import { v4 as uuidv4 } from "uuid"
import { ERROR_CODES } from "@/types/error.types"
import { handleError } from "@/lib/error-handler"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  thumbnailUrl?: string
  createdAt: string
}

export async function uploadFile(file: File, path = "public", generateThumbnail = false): Promise<UploadedFile> {
  try {
    if (!file) {
      throw new Error("No file provided")
    }

    // Generate a unique file name
    const fileExt = file.name.split(".").pop()
    const fileName = `${uuidv4()}.${fileExt}`
    const filePath = `${path}/${fileName}`

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage.from("files").upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (error) {
      throw {
        code: ERROR_CODES.STORAGE_UPLOAD_FAILED,
        message: error.message,
      }
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from("files").getPublicUrl(filePath)

    let thumbnailUrl

    // Generate thumbnail for images if requested
    if (generateThumbnail && file.type.startsWith("image/")) {
      const thumbnailPath = `${path}/thumbnails/${fileName}`

      // For simplicity, we're just using the same image as the thumbnail
      // In a real app, you'd want to resize the image here
      const { data: thumbnailData, error: thumbnailError } = await supabase.storage
        .from("files")
        .copy(filePath, thumbnailPath)

      if (!thumbnailError) {
        const { data: thumbnailUrlData } = supabase.storage.from("files").getPublicUrl(thumbnailPath)

        thumbnailUrl = thumbnailUrlData.publicUrl
      }
    }

    return {
      id: data?.path || "",
      name: file.name,
      size: file.size,
      type: file.type,
      url: urlData.publicUrl,
      thumbnailUrl,
      createdAt: new Date().toISOString(),
    }
  } catch (error) {
    const handledError = handleError(error)
    throw handledError
  }
}

export async function deleteFile(filePath: string): Promise<void> {
  try {
    const { error } = await supabase.storage.from("files").remove([filePath])

    if (error) {
      throw {
        code: ERROR_CODES.STORAGE_FILE_NOT_FOUND,
        message: error.message,
      }
    }
  } catch (error) {
    const handledError = handleError(error)
    throw handledError
  }
}

export async function getFileUrl(filePath: string): Promise<string> {
  try {
    const { data } = supabase.storage.from("files").getPublicUrl(filePath)

    return data.publicUrl
  } catch (error) {
    const handledError = handleError(error)
    throw handledError
  }
}

export function getFileTypeIcon(fileType: string): string {
  if (fileType.startsWith("image/")) {
    return "image"
  } else if (fileType.startsWith("video/")) {
    return "video"
  } else if (fileType.startsWith("audio/")) {
    return "audio"
  } else if (fileType === "application/pdf") {
    return "pdf"
  } else if (
    fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    fileType === "application/msword"
  ) {
    return "word"
  } else if (
    fileType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    fileType === "application/vnd.ms-excel"
  ) {
    return "excel"
  } else if (
    fileType === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
    fileType === "application/vnd.ms-powerpoint"
  ) {
    return "powerpoint"
  } else if (fileType === "application/zip" || fileType === "application/x-zip-compressed") {
    return "zip"
  } else {
    return "file"
  }
}

