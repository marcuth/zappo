export interface StorageCategoryStats {
    count: number
    sizeBytes: number
}

export interface ChatStorageUsage {
    chatJid: string
    chatName: string
    mediaCount: number
    sizeBytes: number
}

export interface StorageStats {
    totalSizeBytes: number
    images: StorageCategoryStats
    videos: StorageCategoryStats
    audio: StorageCategoryStats
    documents: StorageCategoryStats
    stickers: StorageCategoryStats
    databaseSizeBytes: number
    tempCacheSizeBytes: number
    topChats: ChatStorageUsage[]
}
