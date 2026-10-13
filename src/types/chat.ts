import { MediaType, MessageStatus } from "./message"

export interface LastMessagePreview {
    id: string
    text: string
    timestamp: number
    fromMe: boolean
    type: MediaType | "text"
    status?: MessageStatus
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
    lastMessage?: LastMessagePreview
    updatedAt: number
}
