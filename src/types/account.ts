export type AccountStatus =
    | "connected"
    | "connecting"
    | "disconnected"
    | "pairing"
    | "standby"

export interface Account {
    id: string
    name: string
    phone?: string
    pushName?: string
    statusText?: string
    avatarUrl?: string
    isActive: boolean
    status: AccountStatus
    createdAt: number
    lastConnectedAt?: number
    unreadCount?: number
}

export interface UserProfile {
    jid: string
    phone?: string
    name?: string
    status?: string
    avatarUrl?: string
}

export interface PairingCodeResponse {
    code: string
    expiresAt: number
}

export interface QrCodeResponse {
    qrData: string
    expiresAt: number
}
