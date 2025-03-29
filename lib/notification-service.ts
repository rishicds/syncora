import { createClient } from "@supabase/supabase-js"
import { ERROR_CODES } from "@/types/error.types"
import { handleError } from "@/lib/error-handler"
import type { Notification } from "@/types/notification.types"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function createNotification(notification: Omit<Notification, "id" | "created_at">): Promise<Notification> {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .insert({
        user_id: notification.user_id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        link: notification.link,
        sender_id: notification.sender_id,
        entity_id: notification.entity_id,
        entity_type: notification.entity_type,
        is_read: false,
      })
      .select()
      .single()

    if (error) {
      throw {
        code: ERROR_CODES.DB_QUERY_ERROR,
        message: error.message,
      }
    }

    return data
  } catch (error) {
    const handledError = handleError(error)
    throw handledError
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", notificationId)

    if (error) {
      throw {
        code: ERROR_CODES.DB_QUERY_ERROR,
        message: error.message,
      }
    }
  } catch (error) {
    const handledError = handleError(error)
    throw handledError
  }
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false)

    if (error) {
      throw {
        code: ERROR_CODES.DB_QUERY_ERROR,
        message: error.message,
      }
    }
  } catch (error) {
    const handledError = handleError(error)
    throw handledError
  }
}

export async function deleteNotification(notificationId: string): Promise<void> {
  try {
    const { error } = await supabase.from("notifications").delete().eq("id", notificationId)

    if (error) {
      throw {
        code: ERROR_CODES.DB_QUERY_ERROR,
        message: error.message,
      }
    }
  } catch (error) {
    const handledError = handleError(error)
    throw handledError
  }
}

export async function getNotifications(userId: string, limit = 20, offset = 0): Promise<Notification[]> {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("*, profiles!notifications_sender_id_fkey(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw {
        code: ERROR_CODES.DB_QUERY_ERROR,
        message: error.message,
      }
    }

    return data || []
  } catch (error) {
    const handledError = handleError(error)
    throw handledError
  }
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false)

    if (error) {
      throw {
        code: ERROR_CODES.DB_QUERY_ERROR,
        message: error.message,
      }
    }

    return count || 0
  } catch (error) {
    const handledError = handleError(error)
    throw handledError
  }
}

export function subscribeToNotifications(userId: string, callback: (notification: Notification) => void) {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      async (payload) => {
        // Fetch the complete notification with sender profile
        const { data } = await supabase
          .from("notifications")
          .select("*, profiles!notifications_sender_id_fkey(*)")
          .eq("id", payload.new.id)
          .single()

        if (data) {
          callback(data)
        }
      },
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

