import type { Profile } from "./user.types"

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
  is_ai_generated?: boolean
  ai_type?: string | null
  profiles?: Profile
}

export interface ChannelMessage {
  id: string
  channel_id: string
  sender_id: string
  content: string
  created_at: string
  updated_at: string
  is_ai_generated?: boolean
  ai_type?: string | null
  profiles?: Profile
}

export interface Conversation {
  id: string
  user1_id: string
  user2_id: string
  created_at: string
  updated_at: string
  last_message?: string | null
  profiles: Profile | Profile[]
}

export interface AIMessageType {
  SUMMARY: "summary"
  TRANSLATION: "translation"
  SENTIMENT: "sentiment"
}

export const AI_MESSAGE_TYPES = {
  SUMMARY: "summary",
  TRANSLATION: "translation",
  SENTIMENT: "sentiment",
} as const

