import {
    LuFileText,
    LuImage,
    LuMusic,
    LuRotateCcw,
    LuRotateCw,
    LuSend,
    LuSettings,
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
    onSend: (
        file: File,
        caption?: string,
        isViewOnce?: boolean,
    ) => Promise<void>
}

type FilterType = "normal" | "grayscale" | "sepia" | "invert" | "vintage"

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
    const [isViewOnce, setIsViewOnce] = useState(false)

    // Image Editing State
    const [isEditing, setIsEditing] = useState(false)
    const [rotation, setRotation] = useState(0) // 0, 90, 180, 270
    const [brightness, setBrightness] = useState(100)
    const [contrast, setContrast] = useState(100)
    const [activeFilter, setActiveFilter] = useState<FilterType>("normal")
    const [cropAspect, setCropAspect] = useState<"free" | "1:1" | "4:5">("free")

    const inputRef = useRef<HTMLInputElement>(null)
    const imageRef = useRef<HTMLImageElement>(null)

    useEffect(() => {
        if (isOpen && file) {
            setCaption(initialCaption || "")
            setIsViewOnce(false)
            setIsEditing(false)
            setRotation(0)
            setBrightness(100)
            setContrast(100)
            setActiveFilter("normal")
            setCropAspect("free")

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
            setIsEditing(false)
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

    // Gera arquivo modificado se houve edição na imagem
    const getProcessedImageFile = async (): Promise<File> => {
        if (!isImage) return file
        const hasModifications =
            rotation !== 0 ||
            brightness !== 100 ||
            contrast !== 100 ||
            activeFilter !== "normal" ||
            cropAspect !== "free"

        if (!hasModifications) return file

        return new Promise((resolve) => {
            const img = new Image()
            img.crossOrigin = "anonymous"
            img.onload = () => {
                const canvas = document.createElement("canvas")
                const ctx = canvas.getContext("2d")
                if (!ctx) return resolve(file)

                // Dimensões baseadas em crop aspect ratio
                let sourceX = 0
                let sourceY = 0
                let sourceW = img.width
                let sourceH = img.height

                if (cropAspect === "1:1") {
                    const minDim = Math.min(img.width, img.height)
                    sourceX = (img.width - minDim) / 2
                    sourceY = (img.height - minDim) / 2
                    sourceW = minDim
                    sourceH = minDim
                } else if (cropAspect === "4:5") {
                    const targetAspect = 4 / 5
                    if (img.width / img.height > targetAspect) {
                        sourceW = img.height * targetAspect
                        sourceX = (img.width - sourceW) / 2
                    } else {
                        sourceH = img.width / targetAspect
                        sourceY = (img.height - sourceH) / 2
                    }
                }

                // Ajusta canvas para rotação
                const isSideways = rotation === 90 || rotation === 270
                canvas.width = isSideways ? sourceH : sourceW
                canvas.height = isSideways ? sourceW : sourceH

                ctx.save()
                ctx.translate(canvas.width / 2, canvas.height / 2)
                ctx.rotate((rotation * Math.PI) / 180)

                // Filtros CSS no canvas
                let filterStr = `brightness(${brightness}%) contrast(${contrast}%)`
                if (activeFilter === "grayscale")
                    filterStr += " grayscale(100%)"
                if (activeFilter === "sepia") filterStr += " sepia(100%)"
                if (activeFilter === "invert") filterStr += " invert(100%)"
                if (activeFilter === "vintage")
                    filterStr += " sepia(50%) contrast(120%) saturate(140%)"

                ctx.filter = filterStr

                ctx.drawImage(
                    img,
                    sourceX,
                    sourceY,
                    sourceW,
                    sourceH,
                    -sourceW / 2,
                    -sourceH / 2,
                    sourceW,
                    sourceH,
                )
                ctx.restore()

                canvas.toBlob(
                    (blob) => {
                        if (!blob) return resolve(file)
                        const processedFile = new File([blob], file.name, {
                            type: file.type || "image/jpeg",
                        })
                        resolve(processedFile)
                    },
                    file.type || "image/jpeg",
                    0.92,
                )
            }
            img.onerror = () => resolve(file)
            img.src = previewUrl || ""
        })
    }

    const handleSend = async () => {
        if (isSending) return
        setIsSending(true)
        try {
            const finalFile = await getProcessedImageFile()
            await onSend(
                finalFile,
                caption.trim() ? caption : undefined,
                (isImage || isVideo) && isViewOnce ? true : undefined,
            )
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

    // Estilos dinâmicos de prévia da imagem para o editor
    const getImageFilterStyle = () => {
        let f = `brightness(${brightness}%) contrast(${contrast}%)`
        if (activeFilter === "grayscale") f += " grayscale(100%)"
        if (activeFilter === "sepia") f += " sepia(100%)"
        if (activeFilter === "invert") f += " invert(100%)"
        if (activeFilter === "vintage")
            f += " sepia(50%) contrast(120%) saturate(140%)"
        return f
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[92vh]">
                {/* Header */}
                <div className="px-5 py-3 border-b border-border flex items-center justify-between bg-muted/40">
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

                    <div className="flex items-center gap-1.5">
                        {isImage && (
                            <Button
                                variant={isEditing ? "default" : "outline"}
                                size="sm"
                                onClick={() => setIsEditing((prev) => !prev)}
                                className="h-8 text-xs gap-1.5 rounded-lg border-primary/30"
                                title="Abrir ferramentas de edição da imagem"
                            >
                                <LuSettings className="h-3.5 w-3.5" />
                                <span>{isEditing ? "Concluir" : "Editar"}</span>
                            </Button>
                        )}

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
                </div>

                {/* Image Editor Tools Drawer (quando isEditing ativo) */}
                {isImage && isEditing && (
                    <div className="px-4 py-2.5 bg-muted/70 border-b border-border/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                        {/* Rotação */}
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-[11px] gap-1"
                                onClick={() =>
                                    setRotation(
                                        (prev) => (prev - 90 + 360) % 360,
                                    )
                                }
                                title="Girar para esquerda 90°"
                            >
                                <LuRotateCcw className="h-3.5 w-3.5" />
                                <span>-90°</span>
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-[11px] gap-1"
                                onClick={() =>
                                    setRotation((prev) => (prev + 90) % 360)
                                }
                                title="Girar para direita 90°"
                            >
                                <LuRotateCw className="h-3.5 w-3.5" />
                                <span>+90°</span>
                            </Button>
                        </div>

                        {/* Proporção / Enquadramento */}
                        <div className="flex items-center gap-1 bg-background/60 p-0.5 rounded-lg border border-border/60">
                            {(["free", "1:1", "4:5"] as const).map((asp) => (
                                <button
                                    key={asp}
                                    onClick={() => setCropAspect(asp)}
                                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                                        cropAspect === asp
                                            ? "bg-primary text-primary-foreground shadow-xs"
                                            : "text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    {asp === "free" ? "Original" : asp}
                                </button>
                            ))}
                        </div>

                        {/* Filtros */}
                        <div className="flex items-center gap-1">
                            {(
                                [
                                    ["normal", "Normal"],
                                    ["grayscale", "P&B"],
                                    ["sepia", "Sépia"],
                                    ["vintage", "Vintage"],
                                ] as const
                            ).map(([k, label]) => (
                                <button
                                    key={k}
                                    onClick={() =>
                                        setActiveFilter(k as FilterType)
                                    }
                                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                                        activeFilter === k
                                            ? "bg-emerald-600 text-white"
                                            : "bg-muted text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        {/* Sliders de Brilho & Contraste */}
                        <div className="w-full flex items-center gap-4 pt-1.5 border-t border-border/40 text-[11px] text-muted-foreground">
                            <div className="flex items-center gap-2 flex-1">
                                <span>Brilho</span>
                                <input
                                    type="range"
                                    min="50"
                                    max="150"
                                    value={brightness}
                                    onChange={(e) =>
                                        setBrightness(Number(e.target.value))
                                    }
                                    className="w-full accent-primary h-1 bg-muted-foreground/30 rounded cursor-pointer"
                                />
                                <span className="font-mono text-[10px] w-8 text-right">
                                    {brightness}%
                                </span>
                            </div>
                            <div className="flex items-center gap-2 flex-1">
                                <span>Contraste</span>
                                <input
                                    type="range"
                                    min="50"
                                    max="150"
                                    value={contrast}
                                    onChange={(e) =>
                                        setContrast(Number(e.target.value))
                                    }
                                    className="w-full accent-primary h-1 bg-muted-foreground/30 rounded cursor-pointer"
                                />
                                <span className="font-mono text-[10px] w-8 text-right">
                                    {contrast}%
                                </span>
                            </div>
                            <button
                                onClick={() => {
                                    setRotation(0)
                                    setBrightness(100)
                                    setContrast(100)
                                    setActiveFilter("normal")
                                    setCropAspect("free")
                                }}
                                className="text-[10px] text-muted-foreground hover:text-destructive underline cursor-pointer"
                            >
                                Redefinir
                            </button>
                        </div>
                    </div>
                )}

                {/* Preview Area */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center bg-black/40 min-h-[220px] max-h-[420px] relative">
                    {isImage && previewUrl && (
                        <div
                            className={`transition-all duration-200 flex items-center justify-center overflow-hidden rounded-xl ${
                                cropAspect === "1:1"
                                    ? "aspect-square max-h-72"
                                    : cropAspect === "4:5"
                                      ? "aspect-[4/5] max-h-72"
                                      : ""
                            }`}
                        >
                            <img
                                ref={imageRef}
                                src={previewUrl}
                                alt="Prévia do anexo"
                                style={{
                                    transform: `rotate(${rotation}deg)`,
                                    filter: getImageFilterStyle(),
                                }}
                                className="max-h-72 max-w-full rounded-xl object-contain shadow-lg transition-transform duration-200"
                            />
                        </div>
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

                        {/* Botão de Visualização Única (Foto e Vídeo) */}
                        {(isImage || isVideo) && (
                            <button
                                type="button"
                                onClick={() => setIsViewOnce((prev) => !prev)}
                                title={
                                    isViewOnce
                                        ? "Visualização única ativada (destinatário só visualiza 1 vez)"
                                        : "Clique para ativar envio de visualização única"
                                }
                                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all cursor-pointer shrink-0 border ${
                                    isViewOnce
                                        ? "bg-amber-500 text-black border-amber-400 scale-105 shadow-md shadow-amber-500/20"
                                        : "bg-muted/60 text-muted-foreground border-border hover:text-foreground hover:border-muted-foreground/40"
                                }`}
                            >
                                ①
                            </button>
                        )}

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
                        <div className="flex items-center gap-2">
                            <span>Pressione Enter para enviar</span>
                            {isViewOnce && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-amber-500 font-medium bg-amber-500/10 px-1.5 py-0.5 rounded">
                                    ① Mensagem temporária (visualização única)
                                </span>
                            )}
                        </div>
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
