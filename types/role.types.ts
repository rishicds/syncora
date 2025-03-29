export interface Role {
  id: string
  group_id: string | null
  name: string
  color: string
  position: number
  permissions: RolePermissions
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface RolePermissions {
  // General permissions
  VIEW_CHANNELS: boolean
  MANAGE_CHANNELS: boolean
  MANAGE_ROLES: boolean
  MANAGE_GROUP: boolean
  KICK_MEMBERS: boolean
  BAN_MEMBERS: boolean

  // Channel permissions
  SEND_MESSAGES: boolean
  EMBED_LINKS: boolean
  ATTACH_FILES: boolean
  ADD_REACTIONS: boolean
  USE_AI_FEATURES: boolean
  MANAGE_MESSAGES: boolean
  MENTION_EVERYONE: boolean

  // Voice permissions
  CONNECT: boolean
  SPEAK: boolean
  STREAM: boolean
  MUTE_MEMBERS: boolean
  DEAFEN_MEMBERS: boolean
  MOVE_MEMBERS: boolean
}

export const DEFAULT_PERMISSIONS: RolePermissions = {
  VIEW_CHANNELS: true,
  MANAGE_CHANNELS: false,
  MANAGE_ROLES: false,
  MANAGE_GROUP: false,
  KICK_MEMBERS: false,
  BAN_MEMBERS: false,

  SEND_MESSAGES: true,
  EMBED_LINKS: true,
  ATTACH_FILES: true,
  ADD_REACTIONS: true,
  USE_AI_FEATURES: false,
  MANAGE_MESSAGES: false,
  MENTION_EVERYONE: false,

  CONNECT: true,
  SPEAK: true,
  STREAM: false,
  MUTE_MEMBERS: false,
  DEAFEN_MEMBERS: false,
  MOVE_MEMBERS: false,
}

export const ADMIN_PERMISSIONS: RolePermissions = {
  VIEW_CHANNELS: true,
  MANAGE_CHANNELS: true,
  MANAGE_ROLES: true,
  MANAGE_GROUP: true,
  KICK_MEMBERS: true,
  BAN_MEMBERS: true,

  SEND_MESSAGES: true,
  EMBED_LINKS: true,
  ATTACH_FILES: true,
  ADD_REACTIONS: true,
  USE_AI_FEATURES: true,
  MANAGE_MESSAGES: true,
  MENTION_EVERYONE: true,

  CONNECT: true,
  SPEAK: true,
  STREAM: true,
  MUTE_MEMBERS: true,
  DEAFEN_MEMBERS: true,
  MOVE_MEMBERS: true,
}

export const MODERATOR_PERMISSIONS: RolePermissions = {
  VIEW_CHANNELS: true,
  MANAGE_CHANNELS: false,
  MANAGE_ROLES: false,
  MANAGE_GROUP: false,
  KICK_MEMBERS: true,
  BAN_MEMBERS: false,

  SEND_MESSAGES: true,
  EMBED_LINKS: true,
  ATTACH_FILES: true,
  ADD_REACTIONS: true,
  USE_AI_FEATURES: true,
  MANAGE_MESSAGES: true,
  MENTION_EVERYONE: false,

  CONNECT: true,
  SPEAK: true,
  STREAM: true,
  MUTE_MEMBERS: true,
  DEAFEN_MEMBERS: true,
  MOVE_MEMBERS: false,
}

export const DEFAULT_ROLES = [
  {
    name: "Admin",
    color: "#E91E63",
    position: 100,
    permissions: ADMIN_PERMISSIONS,
    is_default: false,
  },
  {
    name: "Moderator",
    color: "#2196F3",
    position: 50,
    permissions: MODERATOR_PERMISSIONS,
    is_default: false,
  },
  {
    name: "Technical",
    color: "#4CAF50",
    position: 30,
    permissions: {
      ...DEFAULT_PERMISSIONS,
      USE_AI_FEATURES: true,
    },
    is_default: false,
  },
  {
    name: "Non-Technical",
    color: "#FF9800",
    position: 20,
    permissions: DEFAULT_PERMISSIONS,
    is_default: false,
  },
  {
    name: "Everyone",
    color: "#9E9E9E",
    position: 0,
    permissions: DEFAULT_PERMISSIONS,
    is_default: true,
  },
]

