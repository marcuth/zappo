export interface AutoDownloadSettings {
    images: boolean
    videos: boolean
    audio: boolean
    documents: boolean
    stickers: boolean
    maxFileSizeMb: number // 0 = unlimited, otherwise threshold e.g. 10
    autoDownloadOnWifi: boolean
    autoDownloadOnCellular: boolean
}

export interface AppSettings {
    theme: "light" | "dark" | "system"
    notifications: boolean
    notificationSound: boolean
    autoDownload: AutoDownloadSettings
    performanceMode: boolean // Reduz animações pesadas e libera cache de imagens
    hardwareAcceleration: boolean
    autoPurgeRevokedMessages?: boolean // Purgar permanentemente mensagens revogadas e apagar mídia local
    storagePath?: string
}
