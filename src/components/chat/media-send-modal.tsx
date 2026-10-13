import {
    LuFileText,
    LuImage,
    LuMusic,
    LuSend,
    LuSmile,
    LuVideo,
    LuX,
} from "react-icons/lu"
import { useEffect, useRef, useState, KeyboardEvent } from "react"

import { EmojiStickerPicker } from "./emoji-sticker-picker"
import { Spinner } from "../ui/spinner"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"

interface MediaSendModalProps {
    file: File | null
    isOpen: boolean
    initialCaption?: string
    onClose: () => void
    onSend: (file: File, caption?: string) => Promise<void>
}

export function MediaSendModal({
    file,
    isOpen,
    initialCaption = "",
    onClose,
    onSend,
}: MediaSendModalProps) {
    const [caption, setCaption] = useState(initialCaption)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [isSending, setIsSending] = useState(false)
    const [isEmojiOpen, setIsEmojiOpen] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (isOpen && file) {
            setCaption(initialCaption || "")
            const url = URL.createObjectURL(file)
            setPreviewUrl(url)
            setTimeout(() => inputRef.current?.focus(), 150)
            return () => {
                URL.revokeObjectURL(url)
                setPreviewUrl(null)
            }
        } else {
            setPreviewUrl(null)
            setIsSending(false)
        }
    }, [isOpen, file, initialCaption])

    if (!isOpen || !file) return null

    const formatBytes = (bytes: number) => {
        if (!bytes || bytes === 0) return "0 B"
        const k = 1024
        const sizes = ["B", "KB", "MB", "GB"]
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
    }

    const isImage = file.type.startsWith("image/")
    const isVideo = file.type.startsWith("video/")
    const isAudio = file.type.startsWith("audio/")
    const isDoc = !isImage && !isVideo && !isAudio

    const handleSend = async () => {
        if (isSending) return
        setIsSending(true)
        try {
            await onSend(file, caption.trim() ? caption : undefined)
            onClose()
        } catch (err) {
            console.error("Falha ao enviar arquivo com legenda:", err)
        } finally {
            setIsSending(false)
        }
    }

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const handleEmojiSelect = (emoji: string) => {
        setCaption((prev) => prev + emoji)
        setIsEmojiOpen(false)
        inputRef.current?.focus()
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-5 py-3.5 border-b border-border flex items-center justify-between bg-muted/40">
                    <div className="flex items-center gap-2.5 min-w-0">
                        {isImage && (
                            <LuImage className="h-5 w-5 text-emerald-500 shrink-0" />
                        )}
                        {isVideo && (
                            <LuVideo className="h-5 w-5 text-sky-500 shrink-0" />
                        )}
                        {isAudio && (
                            <LuMusic className="h-5 w-5 text-purple-500 shrink-0" />
                        )}
                        {isDoc && (
                            <LuFileText className="h-5 w-5 text-amber-500 shrink-0" />
                        )}
                        <div className="min-w-0">
                            <h3 className="text-sm font-semibold truncate text-foreground">
                                {file.name}
                            </h3>
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                <span>{formatBytes(file.size)}</span>
                                <span>•</span>
                                <Badge
                                    variant="outline"
                                    className="text-[10px] py-0 px-1.5 h-4"
                                >
                                    {isImage
                                        ? "Foto"
                                        : isVideo
                                          ? "Vídeo"
                                          : isAudio
                                            ? "Áudio"
                                            : "Documento"}
                                </Badge>
                            </div>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                        onClick={onClose}
                        disabled={isSending}
                    >
                        <LuX className="h-4 w-4" />
                    </Button>
                </div>

                {/* Preview Area */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center bg-black/40 min-h-[220px] max-h-[420px]">
                    {isImage && previewUrl && (
                        <img
                            src={previewUrl}
                            alt="Prévia do anexo"
                            className="max-h-72 max-w-full rounded-xl object-contain shadow-lg"
                        />
                    )}

                    {isVideo && previewUrl && (
                        <video
                            src={previewUrl}
                            controls
                            className="max-h-72 max-w-full rounded-xl shadow-lg"
                        />
                    )}

                    {isAudio && previewUrl && (
                        <div className="w-full max-w-md p-6 bg-card/80 border border-border rounded-xl text-center space-y-3">
                            <LuMusic className="h-10 w-10 text-primary mx-auto" />
                            <p className="text-xs font-medium text-foreground truncate">
                                {file.name}
                            </p>
                            <audio
                                src={previewUrl}
                                controls
                                className="w-full mt-2"
                            />
                        </div>
                    )}

                    {isDoc && (
                        <div className="p-8 bg-card/80 border border-border/80 rounded-2xl flex flex-col items-center gap-3 text-center max-w-sm">
                            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                                <LuFileText className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-foreground truncate max-w-[240px]">
                                    {file.name}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {formatBytes(file.size)} •{" "}
                                    {file.type || "Documento"}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Caption Input & Actions */}
                <div className="p-4 border-t border-border bg-card space-y-3">
                    <div className="relative flex items-center gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className={`h-9 w-9 shrink-0 ${
                                isEmojiOpen
                                    ? "text-primary bg-primary/10"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                            onClick={() => setIsEmojiOpen(!isEmojiOpen)}
                            title="Inserir emoji na legenda"
                        >
                            <LuSmile className="h-5 w-5" />
                        </Button>

                        {/* Emoji Picker Popover */}
                        {isEmojiOpen && (
                            <div className="absolute bottom-12 left-0 z-50">
                                <EmojiStickerPicker
                                    open={isEmojiOpen}
                                    onSelectEmoji={handleEmojiSelect}
                                    onSendStickerFile={() => {}}
                                    onClose={() => setIsEmojiOpen(false)}
                                />
                            </div>
                        )}

                        <input
                            ref={inputRef}
                            type="text"
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={isSending}
                            placeholder="Adicione uma legenda... (*negrito*, _itálico_, ~tachado~)"
                            className="flex-1 h-10 px-3.5 text-xs bg-muted/60 border border-input rounded-xl focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/60 text-foreground"
                        />

                        <Button
                            onClick={handleSend}
                            disabled={isSending}
                            className="h-10 px-4 rounded-xl gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-xs shadow-sm"
                        >
                            {isSending ? (
                                <Spinner className="size-4" />
                            ) : (
                                <>
                                    <span>Enviar</span>
                                    <LuSend className="h-3.5 w-3.5" />
                                </>
                            )}
                        </Button>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
                        <span>Pressione Enter para enviar</span>
                        <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-[11px] text-muted-foreground hover:text-destructive"
                            onClick={onClose}
                            disabled={isSending}
                        >
                            Cancelar
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
