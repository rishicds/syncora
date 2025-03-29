export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      conversations: {
        Row: {
          id: string
          user1_id: string
          user2_id: string
          created_at: string
          updated_at: string
          last_message: string | null
        }
        Insert: {
          id?: string
          user1_id: string
          user2_id: string
          created_at?: string
          updated_at?: string
          last_message?: string | null
        }
        Update: {
          id?: string
          user1_id?: string
          user2_id?: string
          created_at?: string
          updated_at?: string
          last_message?: string | null
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          content: string
          created_at: string
          is_ai_generated: boolean
          ai_type: string | null
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          content: string
          created_at?: string
          is_ai_generated?: boolean
          ai_type?: string | null
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          content?: string
          created_at?: string
          is_ai_generated?: boolean
          ai_type?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          email: string | null
          bio: string | null
          role_ids: string[] | null
          status: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          email?: string | null
          bio?: string | null
          role_ids?: string[] | null
          status?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          email?: string | null
          bio?: string | null
          role_ids?: string[] | null
          status?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      groups: {
        Row: {
          id: string
          name: string
          description: string | null
          icon_url: string | null
          owner_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          icon_url?: string | null
          owner_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          icon_url?: string | null
          owner_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      channels: {
        Row: {
          id: string
          group_id: string
          name: string
          description: string | null
          type: string
          allowed_role_ids: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          group_id: string
          name: string
          description?: string | null
          type: string
          allowed_role_ids?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          name?: string
          description?: string | null
          type?: string
          allowed_role_ids?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      channel_messages: {
        Row: {
          id: string
          channel_id: string
          sender_id: string
          content: string
          created_at: string
          updated_at: string
          is_ai_generated: boolean
          ai_type: string | null
        }
        Insert: {
          id?: string
          channel_id: string
          sender_id: string
          content: string
          created_at?: string
          updated_at?: string
          is_ai_generated?: boolean
          ai_type?: string | null
        }
        Update: {
          id?: string
          channel_id?: string
          sender_id?: string
          content?: string
          created_at?: string
          updated_at?: string
          is_ai_generated?: boolean
          ai_type?: string | null
        }
      }
      group_members: {
        Row: {
          id: string
          group_id: string
          user_id: string
          role_ids: string[]
          joined_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          role_ids: string[]
          joined_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          role_ids?: string[]
          joined_at?: string
        }
      }
      roles: {
        Row: {
          id: string
          group_id: string | null
          name: string
          color: string
          position: number
          permissions: Json
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          group_id?: string | null
          name: string
          color: string
          position: number
          permissions: Json
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          group_id?: string | null
          name?: string
          color?: string
          position?: number
          permissions?: Json
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

