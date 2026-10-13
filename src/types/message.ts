export type MediaType =
    "image" | "video" | "audio" | "document" | "sticker" | "voice"

export type MessageStatus = "pending" | "sent" | "delivered" | "read" | "failed"

export interface MediaAttachment {
    id: string
    mediaType: MediaType
    fileName?: string
    fileSize: number // In bytes
    mimeType: string
    thumbnailDataUrl?: string
    localPath?: string
    isDownloaded: boolean
    isDownloading?: boolean
    downloadProgress?: number // 0 to 100
    durationSeconds?: number
    directPath?: string
    mediaKey?: string
    fileSha256?: string
    fileEncSha256?: string
}

export interface QuotedMessage {
    id: string
    senderName: string
    text: string
}

export interface Message {
    id: string
    chatJid: string
    fromMe: boolean
    senderName?: string
    senderJid?: string
    text?: string
    timestamp: number
    status: MessageStatus
    media?: MediaAttachment
    replyTo?: QuotedMessage
}
