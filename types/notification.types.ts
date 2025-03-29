import type { Profile } from "./user.types"

export type NotificationType =
  | "message"
  | "mention"
  | "reaction"
  | "group_invite"
  | "role_update"
  | "channel_invite"
  | "file_share"
  | "system"

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  link?: string | null
  sender_id?: string | null
  entity_id?: string | null
  entity_type?: string | null
  is_read: boolean
  created_at: string
  profiles?: Profile
}

