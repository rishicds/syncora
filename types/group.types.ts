import type { Profile } from "./user.types"
import type { Role } from "./role.types"

export interface Group {
  id: string
  name: string
  description?: string | null
  icon_url?: string | null
  owner_id: string
  created_at: string
  updated_at: string
  members?: GroupMember[]
  channels?: Channel[]
  roles?: Role[]
}

export interface GroupMember {
  id: string
  group_id: string
  user_id: string
  role_ids: string[]
  joined_at: string
  profile?: Profile
  roles?: Role[]
}

export interface Channel {
  id: string
  group_id: string
  name: string
  description?: string | null
  type: ChannelType
  allowed_role_ids?: string[] | null
  created_at: string
  updated_at: string
}

export type ChannelType = "text" | "voice" | "announcement"

export const CHANNEL_TYPES = {
  TEXT: "text" as ChannelType,
  VOICE: "voice" as ChannelType,
  ANNOUNCEMENT: "announcement" as ChannelType,
}

