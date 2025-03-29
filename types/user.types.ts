export interface Profile {
  id: string
  username?: string | null
  full_name?: string | null
  avatar_url?: string | null
  email?: string | null
  bio?: string | null
  role_ids?: string[] | null
  status?: string | null
  created_at: string
  updated_at: string
}

export interface UserStatus {
  id: string
  label: string
  value: string
}

export const USER_STATUSES: UserStatus[] = [
  { id: "available", label: "Available", value: "available" },
  { id: "busy", label: "Busy", value: "busy" },
  { id: "away", label: "Away", value: "away" },
  { id: "offline", label: "Offline", value: "offline" },
]

