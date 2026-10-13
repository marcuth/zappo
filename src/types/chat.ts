import { MediaType, MessageStatus } from "./message"

export interface LastMessagePreview {
    id: string
    text: string
    timestamp: number
    fromMe: boolean
    type: MediaType | "text"
    status?: MessageStatus
}

export interface GroupParticipant {
    jid: string
    phone?: string
    displayName?: string
    isAdmin: boolean
    isSuperAdmin: boolean
    avatarUrl?: string
}

export interface Chat {
    id: string
    jid: string
    name: string
    phoneNumber?: string
    avatarUrl?: string
    isGroup: boolean
    unreadCount: number
    pinned: boolean
    archived: boolean
    isMuted?: boolean
    muteEndTimestamp?: number
    lastMessage?: LastMessagePreview
    updatedAt: number
}
