import {
    LuCheck,
    LuDownload,
    LuFileText,
    LuImage,
    LuMic,
    LuPlay,
} from "react-icons/lu"
import { convertFileSrc } from "@tauri-apps/api/core"
import { useState } from "react"

import { MediaAttachment } from "../../types"
import { Spinner } from "../ui/spinner"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"

interface MediaMessageCardProps {
    media: MediaAttachment
    onDownload: () => void
}

export function MediaMessageCard({ media, onDownload }: MediaMessageCardProps) {
    const [failedSrc, setFailedSrc] = useState<string | null>(null)

    const formatBytes = (bytes: number) => {
        if (!bytes || bytes === 0) return "0 B"
        const k = 1024
        const sizes = ["B", "KB", "MB", "GB"]
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
    }

    const isSticker = media.mediaType === "sticker"
    const isImage = media.mediaType === "image"
    const isVideo = media.mediaType === "video"
    const isAudio = media.mediaType === "audio" || media.mediaType === "voice"

    // Convert local file path to Tauri asset URL safely
    const mediaSrc = media.localPath ? convertFileSrc(media.localPath) : ""
    const hasImageError = Boolean(mediaSrc && failedSrc === mediaSrc)

    // 1. STICKERS (FIGURINHAS)
    if (isSticker) {
        if (media.isDownloaded && mediaSrc && !hasImageError) {
            return (
                <div className="relative inline-block my-1 select-none">
                    <img
                        key={mediaSrc}
                        src={mediaSrc}
                        alt="Figurinha"
                        className="w-32 h-32 md:w-36 md:h-36 object-contain drop-shadow-md hover:scale-105 transition-transform"
                        onError={() => setFailedSrc(mediaSrc)}
                        loading="lazy"
                    />
                </div>
            )
        }

        // Sticker not downloaded yet or failed
        return (
            <div className="w-32 h-32 rounded-2xl border border-dashed border-border flex flex-col items-center justify-center p-2 text-center bg-muted/30">
                <LuImage className="w-6 h-6 text-muted-foreground/60 mb-1" />
                <span className="text-[10px] text-muted-foreground font-medium mb-1">
                    Figurinha
                </span>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={onDownload}
                    disabled={media.isDownloading}
                    className="h-6 text-[10px] px-2 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                >
                    {media.isDownloading ? (
                        <Spinner className="size-3" />
                    ) : (
                        "Baixar"
                    )}
                </Button>
            </div>
        )
    }

    // 2. DOWNLOADED MEDIA
    if (media.isDownloaded && mediaSrc) {
        if (isImage && !hasImageError) {
            return (
                <div className="mt-1.5 rounded-2xl overflow-hidden border border-border/60 bg-black/30 shadow-md max-w-sm">
                    <div className="relative overflow-hidden group">
                        <img
                            key={mediaSrc}
                            src={mediaSrc}
                            alt={media.fileName || "Foto"}
                            className="max-h-80 w-auto object-cover rounded-2xl transition-transform duration-300 group-hover:scale-[1.01]"
                            onError={() => setFailedSrc(mediaSrc)}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
                            <span className="text-[11px] text-white/90 truncate font-mono">
                                {media.fileName || "Foto recebida"} •{" "}
                                {formatBytes(media.fileSize)}
                            </span>
                        </div>
                    </div>
                </div>
            )
        }

        if (isVideo) {
            return (
                <div className="mt-1.5 rounded-2xl overflow-hidden border border-border/60 bg-black/40 shadow-md max-w-sm">
                    <video
                        src={mediaSrc}
                        controls
                        preload="metadata"
                        className="max-h-80 w-full rounded-2xl"
                    />
                    {media.fileName && (
                        <div className="px-3 py-1.5 bg-black/40 text-[10px] text-muted-foreground truncate font-mono">
                            {media.fileName} • {formatBytes(media.fileSize)}
                        </div>
                    )}
                </div>
            )
        }

        if (isAudio) {
            return (
                <div className="mt-1.5 p-3 rounded-2xl border border-border/60 bg-card/90 shadow-sm max-w-xs space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                            <LuMic className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-semibold text-foreground">
                            {media.mediaType === "voice"
                                ? "Mensagem de Voz"
                                : "Áudio"}
                        </span>
                        <span className="text-[10px] text-muted-foreground ml-auto font-mono">
                            {formatBytes(media.fileSize)}
                        </span>
                    </div>
                    <audio src={mediaSrc} controls className="w-full h-8" />
                </div>
            )
        }

        // Document or generic file downloaded
        return (
            <div className="mt-1.5 p-3 rounded-2xl border border-border/60 bg-card/90 shadow-sm max-w-sm">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center shrink-0 text-purple-400">
                        <LuFileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h5 className="text-xs font-semibold text-foreground truncate">
                            {media.fileName || "Documento anexado"}
                        </h5>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
                            <LuCheck className="w-3 h-3 text-emerald-500" />
                            <span>Salvo no disco</span>
                            <span>•</span>
                            <span>{formatBytes(media.fileSize)}</span>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // 3. NOT DOWNLOADED YET (PREVIEW FAKE COM BLUR ESTÉTICO)
    if (isImage || isVideo) {
        return (
            <div className="mt-1.5 rounded-2xl overflow-hidden border border-white/10 shadow-lg max-w-sm relative group">
                {/* Visual Fake Blur Preview */}
                <div className="relative w-64 h-48 sm:w-72 sm:h-52 overflow-hidden bg-gradient-to-tr from-emerald-950/70 via-slate-900 to-indigo-950/70 flex flex-col items-center justify-center p-4">
                    {/* Background real thumbnail if available, or simulated blurred photographic backdrop */}
                    {media.thumbnailDataUrl ? (
                        <img
                            src={media.thumbnailDataUrl}
                            alt="Preview miniatura"
                            className="absolute inset-0 w-full h-full object-cover blur-md scale-110 opacity-70"
                        />
                    ) : (
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-600/20 via-primary/10 to-transparent blur-xl" />
                    )}

                    {/* Dark Glassmorphism Overlay */}
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-md" />

                    {/* Centered Content & Download Action */}
                    <div className="relative z-10 flex flex-col items-center text-center gap-2.5 max-w-[90%]">
                        <div className="w-11 h-11 rounded-2xl bg-black/50 border border-white/20 backdrop-blur-md shadow-xl flex items-center justify-center text-white/90">
                            {isVideo ? (
                                <LuPlay className="w-5 h-5 ml-0.5 text-blue-400" />
                            ) : (
                                <LuImage className="w-5 h-5 text-emerald-400" />
                            )}
                        </div>

                        <div className="space-y-0.5">
                            <span className="text-xs font-semibold text-white/95 line-clamp-1 break-all">
                                {media.fileName ||
                                    (isVideo
                                        ? "Vídeo não baixado"
                                        : "Foto não baixada")}
                            </span>
                            <div className="flex items-center justify-center gap-1.5 text-[10px] text-white/70 font-mono">
                                <span>{isVideo ? "Vídeo" : "Foto"}</span>
                                <span>•</span>
                                <span>{formatBytes(media.fileSize)}</span>
                            </div>
                        </div>

                        <Button
                            size="sm"
                            onClick={onDownload}
                            disabled={media.isDownloading}
                            className="h-8 px-4 text-xs font-medium gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400/30 shadow-lg shadow-emerald-950/50 rounded-xl"
                        >
                            {media.isDownloading ? (
                                <>
                                    <Spinner className="size-3.5 text-white" />
                                    <span>
                                        Baixando ({media.downloadProgress || 20}
                                        %)...
                                    </span>
                                </>
                            ) : (
                                <>
                                    <LuDownload className="h-3.5 w-3.5" />
                                    <span>
                                        Baixar ({formatBytes(media.fileSize)})
                                    </span>
                                </>
                            )}
                        </Button>
                    </div>

                    <Badge
                        variant="outline"
                        className="absolute top-2.5 right-2.5 text-[9px] px-1.5 py-0 h-4 border-white/20 text-white/80 bg-black/40 backdrop-blur-md"
                    >
                        Prévia
                    </Badge>
                </div>
            </div>
        )
    }

    // Audio or Document not downloaded
    return (
        <div className="mt-1.5 rounded-2xl overflow-hidden border border-border/80 bg-background/50 shadow-sm max-w-sm">
            <div className="p-3 bg-gradient-to-br from-card/90 to-muted/80 backdrop-blur space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                            {isAudio ? (
                                <LuMic className="h-5 w-5 text-amber-400" />
                            ) : (
                                <LuFileText className="h-5 w-5 text-purple-400" />
                            )}
                        </div>
                        <div className="min-w-0">
                            <h5 className="text-xs font-semibold text-foreground truncate max-w-[170px]">
                                {media.fileName ||
                                    (isAudio
                                        ? "Áudio anexado"
                                        : "Documento anexado")}
                            </h5>
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                <span>{isAudio ? "Áudio" : "Documento"}</span>
                                <span>•</span>
                                <span className="font-mono">
                                    {formatBytes(media.fileSize)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <Badge
                        variant="outline"
                        className="text-[9px] px-1.5 py-0 h-4 border-amber-500/30 text-amber-500 bg-amber-500/10 shrink-0"
                    >
                        Sob demanda
                    </Badge>
                </div>

                <Button
                    size="sm"
                    onClick={onDownload}
                    disabled={media.isDownloading}
                    className="w-full h-8 text-xs font-medium gap-1.5 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 shadow-none rounded-xl"
                >
                    {media.isDownloading ? (
                        <>
                            <Spinner className="size-3.5" />
                            <span>
                                Baixando ({media.downloadProgress || 20}%)...
                            </span>
                        </>
                    ) : (
                        <>
                            <LuDownload className="h-3.5 w-3.5" />
                            <span>Baixar ({formatBytes(media.fileSize)})</span>
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}
