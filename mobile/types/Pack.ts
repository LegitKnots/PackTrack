export interface PackDetails {
    id: string
    name: string
    description?: string
    imageUrl?: string
    owner: string
    members: string[]
    visibility: "private" | "public"
    shareCode: string
    tags?: string[]
    options?: {
      hasChat: boolean
      [key: string]: any
    }
    createdAt?: string
    updatedAt?: string
  }
  