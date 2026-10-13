import { z } from "zod"

export const autoDownloadSettingsSchema = z.object({
    images: z.boolean(),
    videos: z.boolean(),
    audio: z.boolean(),
    documents: z.boolean(),
    stickers: z.boolean(),
    maxFileSizeMb: z.number().min(0).max(500),
    autoDownloadOnWifi: z.boolean(),
    autoDownloadOnCellular: z.boolean(),
})

export const appSettingsSchema = z.object({
    theme: z.enum(["light", "dark", "system"]),
    notifications: z.boolean(),
    notificationSound: z.boolean(),
    autoDownload: autoDownloadSettingsSchema,
    performanceMode: z.boolean(),
    hardwareAcceleration: z.boolean(),
    storagePath: z.string().optional(),
})

export type AutoDownloadSettingsInput = z.infer<
    typeof autoDownloadSettingsSchema
>
export type AppSettingsInput = z.infer<typeof appSettingsSchema>
