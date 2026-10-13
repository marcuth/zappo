import {
    LuCheckCheck,
    LuEllipsisVertical,
    LuEraser,
    LuEyeOff,
    LuHistory,
    LuMic,
    LuPaperclip,
    LuRefreshCw,
    LuReply,
    LuSend,
    LuShieldCheck,
    LuSmile,
    LuTrash2,
    LuUsers,
    LuX,
} from "react-icons/lu"
import { useCallback, useEffect, useRef, useState, KeyboardEvent } from "react"
import { convertFileSrc } from "@tauri-apps/api/core"
import fixWebmDuration from "fix-webm-duration"
import { toast } from "sonner"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { formatPhoneNumber, getSenderColor } from "../../lib/format-sender"
import { WhatsAppService } from "../../services/whatsapp-service"
import { EmojiStickerPicker } from "./emoji-sticker-picker"
import { ImageLightboxModal } from "./image-lightbox-modal"
import { MessageContextMenu } from "./message-context-menu"
import { useAccount } from "../providers/account-provider"
import { GroupMembersModal } from "./group-members-modal"
import { MediaMessageCard } from "./media-message-card"
import { MessageInfoModal } from "./message-info-modal"
import { MediaSendModal } from "./media-send-modal"
import { FormattedText } from "./formatted-text"
import { ChatAvatar } from "./chat-avatar"
import { Spinner } from "../ui/spinner"
import { Message } from "../../types"
import { Button } from "../ui/button"

// Map: messageId -> emoji[]
type ReactionsMap = Record<string, string[]>

function ExpandableMessageText({
    text,
    isFromMe,
}: {
    text: string
    isFromMe: boolean
}) {
    const [isExpanded, setIsExpanded] = useState(false)
    const isLong = text.length > 380 || (text.match(/\n/g) || []).length > 8

    if (!isLong) {
        return (
            <div className="text-xs leading-relaxed pt-0.5">
                <FormattedText text={text} />
            </div>
        )
    }

    const displayText = isExpanded ? text : text.slice(0, 320).trim() + "..."

    return (
        <div className="text-xs leading-relaxed pt-0.5">
            <FormattedText text={displayText} />
            <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className={`text-[11px] mt-1 inline-block font-semibold cursor-pointer select-none transition-opacity hover:opacity-80 ${
                    isFromMe
                        ? "text-primary-foreground underline"
                        : "text-primary hover:underline"
                }`}
            >
                {isExpanded ? "Ler menos" : "Ler mais..."}
            </button>
        </div>
    )
}

export function ChatView() {
    const {
        activeAccount,
        activeChat,
        messages,
        sendMessage,
        sendMedia,
        downloadMedia,
        deleteChat,
        clearChatMessages,
        syncGroups,
    } = useAccount()

    const [inputText, setInputText] = useState("")
    const [isPickerOpen, setIsPickerOpen] = useState(false)
    const [reactingMessageId, setReactingMessageId] = useState<string | null>(
        null,
    )
    const [pendingFile, setPendingFile] = useState<File | null>(null)
    const [isMediaModalOpen, setIsMediaModalOpen] = useState(false)
    const [isSyncingGroups, setIsSyncingGroups] = useState(false)
    const [isGroupMembersOpen, setIsGroupMembersOpen] = useState(false)
    const [replyingMessage, setReplyingMessage] = useState<Message | null>(null)

    // Context menu
    const [contextMenu, setContextMenu] = useState<{
        isOpen: boolean
        x: number
        y: number
        message: Message | null
    }>({ isOpen: false, x: 0, y: 0, message: null })

    // Message info modal
    const [infoMessage, setInfoMessage] = useState<Message | null>(null)

    // Media Lightbox Gallery navigation
    const [viewerMediaIndex, setViewerMediaIndex] = useState<number | null>(
        null,
    )

    // Voice recording state
    const [isRecording, setIsRecording] = useState(false)
    const [isRecordingViewOnce, setIsRecordingViewOnce] = useState(false)
    const [recordingDuration, setRecordingDuration] = useState(0)
    const [isProcessingAudio, setIsProcessingAudio] = useState(false)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioChunksRef = useRef<Blob[]>([])
    const recordingTimerRef = useRef<number | null>(null)

    // Revealed revoked messages (messageId set that user clicked to reveal)
    const [revealedRevokedMessages, setRevealedRevokedMessages] = useState<
        Record<string, boolean>
    >({})

    // Reactions map: messageId -> list of emoji strings added locally
    const [reactions, setReactions] = useState<ReactionsMap>({})

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const openContextMenu = useCallback(
        (e: React.MouseEvent | React.TouchEvent, message: Message) => {
            if ("preventDefault" in e) e.preventDefault()
            const clientX =
                "touches" in e
                    ? e.touches[0].clientX
                    : (e as React.MouseEvent).clientX
            const clientY =
                "touches" in e
                    ? e.touches[0].clientY
                    : (e as React.MouseEvent).clientY
            setContextMenu({ isOpen: true, x: clientX, y: clientY, message })
        },
        [],
    )

    const handleReact = useCallback(
        (messageId: string, emoji: string) => {
            setReactions((prev) => {
                const current = prev[messageId] ?? []
                const next = current.includes(emoji)
                    ? current.filter((e) => e !== emoji)
                    : [...current, emoji]
                return { ...prev, [messageId]: next }
            })

            // Dispara para o WhatsApp via Rust backend
            if (activeChat) {
                const targetMsg = messages.find((m) => m.id === messageId)
                if (targetMsg) {
                    WhatsAppService.sendReaction(
                        activeChat.jid,
                        messageId,
                        targetMsg.fromMe,
                        emoji,
                        targetMsg.senderJid,
                    ).catch((err) => {
                        console.warn("Erro ao enviar reação ao WhatsApp:", err)
                    })
                }
            }
        },
        [activeChat, messages],
    )

    // Auto-scroll to bottom on new message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    // List of media messages in this chat for gallery navigation (photos, videos, audio, documents)
    const mediaMessages = messages.filter(
        (m) =>
            m.media &&
            (m.media.mediaType === "image" ||
                m.media.mediaType === "video" ||
                m.media.mediaType === "audio" ||
                m.media.mediaType === "voice" ||
                m.media.mediaType === "document"),
    )

    const activeViewerMsg =
        viewerMediaIndex !== null ? mediaMessages[viewerMediaIndex] : null
    const activeViewerMedia = activeViewerMsg?.media
    const activeViewerMediaSrc = activeViewerMedia?.localPath
        ? convertFileSrc(activeViewerMedia.localPath)
        : null

    if (!activeChat) return null

    const handleSend = async () => {
        if (!inputText.trim()) return
        const text = inputText
        const replyId = replyingMessage?.id
        setInputText("")
        setReplyingMessage(null)
        await sendMessage(text, replyId)
    }

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const handlePaste = (e: React.ClipboardEvent) => {
        const items = e.clipboardData?.items
        if (!items || items.length === 0) return

        for (let i = 0; i < items.length; i++) {
            const item = items[i]
            if (item.kind === "file") {
                const file = item.getAsFile()
                if (file) {
                    e.preventDefault()
                    setPendingFile(file)
                    setIsMediaModalOpen(true)
                    return
                }
            }
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setPendingFile(file)
        setIsMediaModalOpen(true)
        e.target.value = ""
    }

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            })
            const mimeType = MediaRecorder.isTypeSupported(
                "audio/ogg;codecs=opus",
            )
                ? "audio/ogg;codecs=opus"
                : MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
                  ? "audio/webm;codecs=opus"
                  : MediaRecorder.isTypeSupported("audio/webm")
                    ? "audio/webm"
                    : "audio/ogg"

            const recorder = new MediaRecorder(stream, { mimeType })
            audioChunksRef.current = []

            recorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) {
                    audioChunksRef.current.push(e.data)
                }
            }

            recorder.start(100)
            mediaRecorderRef.current = recorder
            setIsRecording(true)
            setIsRecordingViewOnce(false)
            setRecordingDuration(0)

            if (recordingTimerRef.current)
                clearInterval(recordingTimerRef.current)
            recordingTimerRef.current = window.setInterval(() => {
                setRecordingDuration((prev) => prev + 1)
            }, 1000)
        } catch (err) {
            console.error("Erro ao acessar microfone:", err)
            toast.error("Não foi possível acessar o microfone para gravação.")
        }
    }

    const cancelRecording = () => {
        if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current)
            recordingTimerRef.current = null
        }
        if (mediaRecorderRef.current) {
            try {
                mediaRecorderRef.current.stream
                    .getTracks()
                    .forEach((t) => t.stop())
                mediaRecorderRef.current.stop()
            } catch {
                // ignore
            }
            mediaRecorderRef.current = null
        }
        audioChunksRef.current = []
        setIsRecording(false)
        setIsRecordingViewOnce(false)
        setRecordingDuration(0)
    }

    const stopAndSendRecording = async () => {
        if (!mediaRecorderRef.current) return

        if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current)
            recordingTimerRef.current = null
        }

        const recorder = mediaRecorderRef.current
        const viewOnceEnabled = isRecordingViewOnce
        setIsProcessingAudio(true)

        recorder.onstop = async () => {
            try {
                recorder.stream.getTracks().forEach((t) => t.stop())
                const audioBlob = new Blob(audioChunksRef.current, {
                    type: recorder.mimeType || "audio/ogg",
                })

                if (audioBlob.size === 0) {
                    toast.error("Áudio gravado está vazio.")
                    return
                }

                let finalBlob = audioBlob
                const durationMs = Math.max(1000, recordingDuration * 1000)

                // Inject duration header into the container so mobile and desktop players know exact length
                try {
                    finalBlob = await fixWebmDuration(audioBlob, durationMs)
                } catch (metaErr) {
                    console.warn(
                        "Não foi possível injetar duração no cabeçalho do áudio:",
                        metaErr,
                    )
                }

                const ext = recorder.mimeType.includes("ogg") ? "ogg" : "webm"
                const audioFile = new File(
                    [finalBlob],
                    `voice_note_${Date.now()}.${ext}`,
                    { type: recorder.mimeType || "audio/ogg" },
                )

                await sendMedia(
                    audioFile,
                    undefined,
                    "voice",
                    viewOnceEnabled ? true : undefined,
                )
                toast.success(
                    viewOnceEnabled
                        ? "Mensagem de voz temporária enviada (1 visualização)!"
                        : "Mensagem de voz enviada!",
                )
            } catch (err) {
                console.error("Erro ao processar áudio gravado:", err)
                toast.error("Falha ao enviar mensagem de voz.")
            } finally {
                setIsRecording(false)
                setIsRecordingViewOnce(false)
                setIsProcessingAudio(false)
                setRecordingDuration(0)
                mediaRecorderRef.current = null
                audioChunksRef.current = []
            }
        }

        try {
            recorder.stop()
        } catch (err) {
            console.error("Erro ao parar gravador:", err)
            cancelRecording()
            setIsProcessingAudio(false)
        }
    }

    const handleSendMediaWithCaption = async (
        file: File,
        caption?: string,
        isViewOnce?: boolean,
    ) => {
        await sendMedia(file, caption, undefined, isViewOnce)
        if (caption && caption === inputText) {
            setInputText("")
        }
    }

    const handleConvertToSticker = async (message: Message) => {
        if (!message.media || message.media.mediaType !== "image") return

        try {
            toast.loading("Criando figurinha a partir da imagem...", {
                id: "create-sticker",
            })

            // Obtém URL da imagem (local convertida para asset ou thumbnail)
            let src = ""
            if (message.media.localPath) {
                src = convertFileSrc(message.media.localPath)
            } else if (message.media.thumbnailDataUrl) {
                src = message.media.thumbnailDataUrl
            } else {
                toast.error("Baixe a foto antes de converter em figurinha.", {
                    id: "create-sticker",
                })
                return
            }

            const img = new Image()
            img.crossOrigin = "anonymous"
            await new Promise<void>((resolve, reject) => {
                img.onload = () => resolve()
                img.onerror = reject
                img.src = src
            })

            const canvas = document.createElement("canvas")
            canvas.width = 512
            canvas.height = 512
            const ctx = canvas.getContext("2d")
            if (!ctx) throw new Error("Canvas context not available")

            ctx.clearRect(0, 0, 512, 512)

            const scale = Math.min(512 / img.width, 512 / img.height)
            const w = img.width * scale
            const h = img.height * scale
            const x = (512 - w) / 2
            const y = (512 - h) / 2

            ctx.drawImage(img, x, y, w, h)

            const blob = await new Promise<Blob | null>((resolve) => {
                canvas.toBlob((b) => resolve(b), "image/webp", 0.85)
            })

            if (!blob) throw new Error("Falha ao gerar WebP")

            const file = new File([blob], `sticker_${Date.now()}.webp`, {
                type: "image/webp",
            })

            await sendMedia(file, undefined, "sticker")
            toast.success("Figurinha enviada com sucesso!", {
                id: "create-sticker",
            })
        } catch (err) {
            console.error("Erro ao converter figurinha:", err)
            toast.error("Erro ao criar figurinha a partir da imagem.", {
                id: "create-sticker",
            })
        }
    }

    const handleClearMessages = async () => {
        if (!activeChat) return
        if (
            window.confirm(
                `Deseja realmente limpar todas as mensagens de "${activeChat.name}"?`,
            )
        ) {
            await clearChatMessages(activeChat.jid)
        }
    }

    const handleDeleteChat = async () => {
        if (!activeChat) return
        if (
            window.confirm(
                `Deseja realmente excluir a conversa com "${activeChat.name}"?`,
            )
        ) {
            await deleteChat(activeChat.jid)
        }
    }

    const handleSyncGroup = async () => {
        setIsSyncingGroups(true)
        try {
            await syncGroups()
        } finally {
            setIsSyncingGroups(false)
        }
    }

    return (
        <section className="flex-1 flex flex-col h-screen bg-background overflow-hidden select-none">
            {/* Header */}
            <div className="h-16 px-4 border-b border-border bg-card/70 backdrop-blur flex items-center justify-between shrink-0">
                <div
                    onClick={() => {
                        if (activeChat.isGroup) setIsGroupMembersOpen(true)
                    }}
                    className={`flex items-center gap-3 min-w-0 ${
                        activeChat.isGroup
                            ? "cursor-pointer hover:opacity-80 transition-opacity"
                            : ""
                    }`}
                >
                    <ChatAvatar
                        jid={activeChat.jid}
                        name={activeChat.name}
                        isGroup={activeChat.isGroup}
                        sizeClassName="w-10 h-10"
                        textClassName="text-xs"
                    />
                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                            <h3 className="text-sm font-semibold text-foreground leading-tight truncate">
                                {activeChat.name}
                            </h3>
                            {activeChat.isGroup && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium shrink-0">
                                    <LuUsers className="h-3 w-3" />
                                    Grupo
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <LuShieldCheck className="h-3 w-3 text-emerald-500" />
                            <span>Signal Protocol • E2EE Rust</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    {activeChat.isGroup && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10 mr-1"
                            onClick={() => setIsGroupMembersOpen(true)}
                            title="Ver membros e opções do grupo"
                        >
                            <LuUsers className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Membros</span>
                        </Button>
                    )}

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
                                title="Mais opções da conversa"
                            >
                                <LuEllipsisVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            {activeChat.isGroup && (
                                <>
                                    <DropdownMenuItem
                                        onClick={() =>
                                            setIsGroupMembersOpen(true)
                                        }
                                        className="gap-2 text-xs cursor-pointer"
                                    >
                                        <LuUsers className="h-3.5 w-3.5 text-primary" />
                                        <span>Dados do grupo</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={handleSyncGroup}
                                        disabled={isSyncingGroups}
                                        className="gap-2 text-xs cursor-pointer"
                                    >
                                        <LuRefreshCw
                                            className={`h-3.5 w-3.5 text-muted-foreground ${
                                                isSyncingGroups
                                                    ? "animate-spin"
                                                    : ""
                                            }`}
                                        />
                                        <span>Sincronizar grupo</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                </>
                            )}
                            <DropdownMenuItem
                                onClick={handleClearMessages}
                                className="gap-2 text-xs text-amber-500 focus:text-amber-500 cursor-pointer"
                            >
                                <LuEraser className="h-3.5 w-3.5" />
                                <span>Limpar conversa</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={handleDeleteChat}
                                variant="destructive"
                                className="gap-2 text-xs cursor-pointer"
                            >
                                <LuTrash2 className="h-3.5 w-3.5" />
                                <span>Excluir chat</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Message Stream */}
            <div className="flex-1 overflow-y-auto p-4 scrollbar-discrete">
                {/* Security info banner */}
                <div className="mx-auto max-w-md p-2 mb-3 rounded-lg bg-muted/40 border border-border/60 text-center text-[11px] text-muted-foreground flex items-center justify-center gap-1.5">
                    <LuShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>
                        As mensagens são protegidas com criptografia de ponta a
                        ponta e processadas nativamente em Rust.
                    </span>
                </div>

                {messages.map((message, index) => {
                    const isFromMe = message.fromMe
                    const prevMessage = index > 0 ? messages[index - 1] : null
                    const isSameSender = Boolean(
                        prevMessage &&
                        prevMessage.fromMe === message.fromMe &&
                        (message.fromMe
                            ? true
                            : (message.senderJid &&
                                  prevMessage.senderJid ===
                                      message.senderJid) ||
                              (message.senderName &&
                                  prevMessage.senderName ===
                                      message.senderName)) &&
                        Math.abs(message.timestamp - prevMessage.timestamp) <
                            5 * 60 * 1000,
                    )

                    const timeFormatted = new Date(
                        message.timestamp,
                    ).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    })

                    const senderColor = getSenderColor(
                        message.senderJid || message.senderName,
                    )
                    const displayName =
                        message.senderName ||
                        formatPhoneNumber(message.senderJid) ||
                        "Participante"
                    const formattedPhone = formatPhoneNumber(message.senderJid)

                    const isSticker = message.media?.mediaType === "sticker"

                    if (isSticker && message.media) {
                        const msgReactions = reactions[message.id] ?? []
                        return (
                            <div
                                key={message.id}
                                className={`flex ${
                                    isFromMe ? "justify-end" : "justify-start"
                                } ${isSameSender ? "mt-1" : "mt-3.5"}`}
                            >
                                <div
                                    className="relative group max-w-[70%]"
                                    onContextMenu={(e) =>
                                        openContextMenu(e, message)
                                    }
                                >
                                    {/* Autor da figurinha em grupos */}
                                    {activeChat.isGroup &&
                                        !isFromMe &&
                                        !isSameSender && (
                                            <div className="flex items-center gap-1.5 mb-1 px-1">
                                                <ChatAvatar
                                                    jid={
                                                        message.senderJid || ""
                                                    }
                                                    name={displayName}
                                                    sizeClassName="w-4 h-4"
                                                    textClassName="text-[7px]"
                                                />
                                                <span
                                                    className={`font-semibold text-[11px] truncate ${senderColor.text}`}
                                                >
                                                    {displayName}
                                                </span>
                                            </div>
                                        )}

                                    <MediaMessageCard
                                        media={message.media}
                                        onDownload={() =>
                                            downloadMedia(message.id)
                                        }
                                    />
                                    <div
                                        className={`flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5 px-1 ${
                                            isFromMe
                                                ? "justify-end"
                                                : "justify-start"
                                        }`}
                                    >
                                        <span>{timeFormatted}</span>
                                        {isFromMe && (
                                            <LuCheckCheck className="h-3 w-3 text-emerald-500" />
                                        )}
                                    </div>

                                    {/* Reactions */}
                                    {msgReactions.length > 0 && (
                                        <div
                                            className={`flex flex-wrap gap-0.5 mt-1 px-1 ${isFromMe ? "justify-end" : "justify-start"}`}
                                        >
                                            {msgReactions.map((emoji) => (
                                                <button
                                                    key={emoji}
                                                    onClick={() =>
                                                        handleReact(
                                                            message.id,
                                                            emoji,
                                                        )
                                                    }
                                                    title="Remover reação"
                                                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-card border border-border/60 text-[12px] hover:bg-muted/80 transition-colors cursor-pointer font-emoji"
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    }

                    const isRevoked = Boolean(
                        message.text &&
                        (message.text.includes("Esta mensagem foi apagada") ||
                            message.text.includes("Mensagem revogada") ||
                            message.text.includes("This message was deleted")),
                    )
                    const isRevealed = Boolean(
                        revealedRevokedMessages[message.id],
                    )

                    if (isRevoked && !isRevealed) {
                        return (
                            <div
                                key={message.id}
                                className={`flex ${
                                    isFromMe ? "justify-end" : "justify-start"
                                } my-1.5`}
                            >
                                <div
                                    onClick={() =>
                                        setRevealedRevokedMessages((prev) => ({
                                            ...prev,
                                            [message.id]: true,
                                        }))
                                    }
                                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/60 border border-border/80 text-muted-foreground text-xs hover:bg-muted/90 hover:text-foreground transition-all cursor-pointer shadow-xs group"
                                    title="Clique para visualizar o registro sob demanda"
                                >
                                    <LuEyeOff className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                                    <span className="italic text-[11px]">
                                        Mensagem apagada
                                    </span>
                                    <span className="text-[10px] text-muted-foreground/60 font-mono">
                                        {timeFormatted}
                                    </span>
                                    <span className="text-[10px] text-primary underline underline-offset-2 ml-1 font-medium">
                                        Ver
                                    </span>
                                </div>
                            </div>
                        )
                    }

                    const msgReactions = reactions[message.id] ?? []
                    return (
                        <div
                            key={message.id}
                            className={`flex flex-col ${
                                isFromMe ? "items-end" : "items-start"
                            } ${isSameSender ? "mt-1" : "mt-3.5"}`}
                        >
                            {isRevoked && isRevealed && (
                                <div className="flex items-center gap-1.5 px-2 mb-0.5 text-[10px] text-amber-500 font-medium">
                                    <LuHistory className="w-3 h-3" />
                                    <span>Mensagem apagada pelo autor</span>
                                    <button
                                        onClick={() =>
                                            setRevealedRevokedMessages(
                                                (prev) => ({
                                                    ...prev,
                                                    [message.id]: false,
                                                }),
                                            )
                                        }
                                        className="text-muted-foreground hover:text-foreground underline ml-1 cursor-pointer"
                                    >
                                        Ocultar
                                    </button>
                                </div>
                            )}
                            <div
                                onContextMenu={(e) =>
                                    openContextMenu(e, message)
                                }
                                className={`min-w-[310px] max-w-[70%] rounded-2xl px-3.5 py-2.5 shadow-sm text-xs leading-relaxed space-y-1.5 cursor-context-menu ${
                                    isFromMe
                                        ? "bg-primary text-primary-foreground rounded-br-xs"
                                        : "bg-card border border-border/80 text-foreground rounded-bl-xs"
                                }`}
                            >
                                {/* Group Participant Identification Header (omitido se for mensagem contígua do mesmo autor) */}
                                {activeChat.isGroup &&
                                    !isFromMe &&
                                    !isSameSender && (
                                        <div className="flex items-center gap-2 pb-1.5 mb-1 border-b border-border/40">
                                            <ChatAvatar
                                                jid={message.senderJid || ""}
                                                name={displayName}
                                                sizeClassName="w-5 h-5"
                                                textClassName="text-[8px]"
                                            />
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <span
                                                    className={`font-semibold text-[11px] truncate ${senderColor.text}`}
                                                >
                                                    {displayName}
                                                </span>
                                                {formattedPhone &&
                                                    formattedPhone !==
                                                        displayName && (
                                                        <span className="text-[10px] text-muted-foreground/80 truncate font-mono">
                                                            ({formattedPhone})
                                                        </span>
                                                    )}
                                            </div>
                                        </div>
                                    )}

                                {/* Quoted Reply if any */}
                                {message.replyTo && (
                                    <div
                                        className={`p-2 rounded-lg text-[11px] border-l-2 mb-1 ${
                                            isFromMe
                                                ? "bg-primary-foreground/10 border-primary-foreground/60 text-primary-foreground/90"
                                                : "bg-muted/80 border-primary text-muted-foreground"
                                        }`}
                                    >
                                        <p className="font-semibold text-[10px]">
                                            {message.replyTo.senderName}
                                        </p>
                                        <p className="truncate">
                                            {message.replyTo.text}
                                        </p>
                                    </div>
                                )}

                                {/* Media Attachment */}
                                {message.media && (
                                    <MediaMessageCard
                                        media={message.media}
                                        onDownload={() =>
                                            downloadMedia(message.id)
                                        }
                                        onOpenMediaViewer={() => {
                                            const idx = mediaMessages.findIndex(
                                                (m) => m.id === message.id,
                                            )
                                            if (idx !== -1) {
                                                setViewerMediaIndex(idx)
                                            }
                                        }}
                                        onConvertToSticker={
                                            message.media.mediaType === "image"
                                                ? () =>
                                                      handleConvertToSticker(
                                                          message,
                                                      )
                                                : undefined
                                        }
                                    />
                                )}

                                {/* Text / Caption with WhatsApp Markdown & Expandable view for long text */}
                                {message.text && (
                                    <ExpandableMessageText
                                        text={message.text}
                                        isFromMe={isFromMe}
                                    />
                                )}

                                {/* Timestamp & Status Checkmarks */}
                                <div
                                    className={`flex items-center justify-end gap-1 text-[10px] ${
                                        isFromMe
                                            ? "text-primary-foreground/75"
                                            : "text-muted-foreground"
                                    }`}
                                >
                                    <span>{timeFormatted}</span>
                                    {isFromMe && (
                                        <LuCheckCheck className="h-3.5 w-3.5 text-primary-foreground" />
                                    )}
                                </div>
                            </div>

                            {/* Emoji Reactions */}
                            {msgReactions.length > 0 && (
                                <div className="flex flex-wrap gap-0.5 mt-1 max-w-[70%]">
                                    {msgReactions.map((emoji) => (
                                        <button
                                            key={emoji}
                                            onClick={() =>
                                                handleReact(message.id, emoji)
                                            }
                                            title="Remover reação"
                                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-card border border-border/60 text-[13px] hover:bg-muted/80 transition-colors cursor-pointer font-emoji shadow-sm"
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Message Context Menu (right-click) */}
            <MessageContextMenu
                isOpen={contextMenu.isOpen}
                x={contextMenu.x}
                y={contextMenu.y}
                hasText={Boolean(contextMenu.message?.text)}
                isImage={contextMenu.message?.media?.mediaType === "image"}
                onClose={() =>
                    setContextMenu((prev) => ({ ...prev, isOpen: false }))
                }
                onCopyText={async () => {
                    if (contextMenu.message?.text) {
                        await navigator.clipboard.writeText(
                            contextMenu.message.text,
                        )
                    }
                }}
                onViewInfo={() => setInfoMessage(contextMenu.message)}
                onConvertToSticker={() => {
                    if (contextMenu.message) {
                        handleConvertToSticker(contextMenu.message)
                    }
                }}
                onReply={() => {
                    if (contextMenu.message) {
                        setReplyingMessage(contextMenu.message)
                    }
                }}
                onOpenEmojiPicker={() => {
                    if (contextMenu.message) {
                        setReactingMessageId(contextMenu.message.id)
                        setIsPickerOpen(true)
                    }
                }}
                onReact={(emoji) => {
                    if (contextMenu.message) {
                        handleReact(contextMenu.message.id, emoji)
                    }
                }}
            />

            {/* Message Info Modal */}
            <MessageInfoModal
                isOpen={Boolean(infoMessage)}
                message={infoMessage}
                onClose={() => setInfoMessage(null)}
            />

            {/* Media Send Modal with Caption Input & Preview */}
            <MediaSendModal
                isOpen={isMediaModalOpen}
                file={pendingFile}
                initialCaption={inputText}
                onClose={() => {
                    setIsMediaModalOpen(false)
                    setPendingFile(null)
                }}
                onSend={handleSendMediaWithCaption}
            />

            {/* Modal de Membros e Gestão de Grupo */}
            {activeChat.isGroup && (
                <GroupMembersModal
                    open={isGroupMembersOpen}
                    onOpenChange={setIsGroupMembersOpen}
                    chat={activeChat}
                    accountId={activeAccount?.id || ""}
                    onLeaveGroupSuccess={() => {
                        setIsGroupMembersOpen(false)
                    }}
                />
            )}

            {/* Media Lightbox Gallery with Navigation */}
            {activeViewerMedia && activeViewerMediaSrc && (
                <ImageLightboxModal
                    isOpen={viewerMediaIndex !== null}
                    imageUrl={activeViewerMediaSrc}
                    localPath={activeViewerMedia.localPath}
                    fileName={activeViewerMedia.fileName}
                    fileSize={activeViewerMedia.fileSize}
                    hasPrev={viewerMediaIndex !== null && viewerMediaIndex > 0}
                    hasNext={
                        viewerMediaIndex !== null &&
                        viewerMediaIndex < mediaMessages.length - 1
                    }
                    onPrev={() => {
                        if (viewerMediaIndex !== null && viewerMediaIndex > 0) {
                            setViewerMediaIndex(viewerMediaIndex - 1)
                        }
                    }}
                    onNext={() => {
                        if (
                            viewerMediaIndex !== null &&
                            viewerMediaIndex < mediaMessages.length - 1
                        ) {
                            setViewerMediaIndex(viewerMediaIndex + 1)
                        }
                    }}
                    onClose={() => setViewerMediaIndex(null)}
                    onConvertToSticker={
                        activeViewerMedia.mediaType === "image" &&
                        activeViewerMsg
                            ? () => handleConvertToSticker(activeViewerMsg)
                            : undefined
                    }
                />
            )}

            {/* Composer */}
            <div className="p-3 border-t border-border bg-card/80 backdrop-blur shrink-0 relative">
                {/* Emoji & Sticker Picker Popover */}
                <EmojiStickerPicker
                    open={isPickerOpen}
                    onClose={() => {
                        setIsPickerOpen(false)
                        setReactingMessageId(null)
                    }}
                    onSelectEmoji={(emoji) => {
                        if (reactingMessageId) {
                            handleReact(reactingMessageId, emoji)
                            setReactingMessageId(null)
                            setIsPickerOpen(false)
                        } else {
                            setInputText((prev) => prev + emoji)
                        }
                    }}
                    onSendStickerFile={async (file) => {
                        await sendMedia(file, undefined, "sticker")
                    }}
                />

                {/* Quoted Message Reply Banner */}
                {replyingMessage && (
                    <div className="max-w-4xl mx-auto mb-2 flex items-center justify-between gap-3 bg-muted/80 border-l-4 border-primary rounded-r-xl px-3 py-1.5 animate-in fade-in slide-in-from-bottom-1 duration-150 shadow-xs">
                        <div className="flex items-center gap-2 min-w-0">
                            <LuReply className="w-4 h-4 text-primary shrink-0" />
                            <div className="min-w-0 text-xs">
                                <span className="font-semibold text-primary block truncate text-[11px]">
                                    Respondendo a{" "}
                                    {replyingMessage.fromMe
                                        ? "Você"
                                        : replyingMessage.senderName ||
                                          formatPhoneNumber(
                                              replyingMessage.senderJid,
                                          ) ||
                                          "Participante"}
                                </span>
                                <span className="text-muted-foreground truncate block text-[11px]">
                                    {replyingMessage.text ||
                                        (replyingMessage.media
                                            ? `[${
                                                  replyingMessage.media
                                                      .mediaType === "image"
                                                      ? "Foto"
                                                      : replyingMessage.media
                                                              .mediaType ===
                                                          "video"
                                                        ? "Vídeo"
                                                        : replyingMessage.media
                                                                .mediaType ===
                                                            "sticker"
                                                          ? "Figurinha"
                                                          : "Mídia"
                                              }]`
                                            : "Mensagem")}
                                </span>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-full text-muted-foreground hover:text-foreground shrink-0"
                            onClick={() => setReplyingMessage(null)}
                            title="Cancelar resposta"
                        >
                            <LuX className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                )}

                <div className="flex items-end gap-2 max-w-4xl mx-auto">
                    {isRecording ? (
                        <div className="flex-1 flex items-center justify-between gap-3 bg-destructive/10 border border-destructive/30 rounded-2xl px-4 py-2 animate-in fade-in duration-200">
                            <div className="flex items-center gap-2.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0" />
                                <span className="text-xs font-semibold text-destructive">
                                    Gravando áudio...
                                </span>
                                <span className="text-xs font-mono font-medium text-foreground bg-background/80 px-2 py-0.5 rounded-md border border-border/50">
                                    {Math.floor(recordingDuration / 60)
                                        .toString()
                                        .padStart(2, "0")}
                                    :
                                    {(recordingDuration % 60)
                                        .toString()
                                        .padStart(2, "0")}
                                </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                                {/* Botão de Áudio de Visualização Única (①) */}
                                <button
                                    type="button"
                                    onClick={() =>
                                        setIsRecordingViewOnce((prev) => !prev)
                                    }
                                    disabled={isProcessingAudio}
                                    title={
                                        isRecordingViewOnce
                                            ? "Visualização única ativada (destinatário só escuta 1 vez)"
                                            : "Clique para enviar como áudio temporário de reprodução única"
                                    }
                                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all cursor-pointer shrink-0 border ${
                                        isRecordingViewOnce
                                            ? "bg-amber-500 text-black border-amber-400 scale-105 shadow-md shadow-amber-500/20"
                                            : "bg-background/80 text-muted-foreground border-border hover:text-foreground hover:border-muted-foreground/40"
                                    }`}
                                >
                                    ①
                                </button>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={cancelRecording}
                                    disabled={isProcessingAudio}
                                    className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg gap-1"
                                    title="Cancelar gravação"
                                >
                                    <LuX className="h-4 w-4" />
                                    <span>Cancelar</span>
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={stopAndSendRecording}
                                    disabled={isProcessingAudio}
                                    className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg gap-1.5 shadow-sm"
                                    title="Enviar áudio gravado"
                                >
                                    {isProcessingAudio ? (
                                        <Spinner className="size-3.5" />
                                    ) : (
                                        <LuSend className="h-3.5 w-3.5" />
                                    )}
                                    <span>Enviar</span>
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip"
                            />
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => fileInputRef.current?.click()}
                                className="h-10 w-10 text-muted-foreground hover:text-foreground shrink-0 rounded-xl hover:bg-muted/60"
                                title="Anexar arquivo com legenda"
                            >
                                <LuPaperclip className="h-4 w-4" />
                            </Button>

                            <Button
                                variant="ghost"
                                size="icon"
                                type="button"
                                onClick={() => setIsPickerOpen((prev) => !prev)}
                                className={`h-10 w-10 shrink-0 rounded-xl transition-colors ${
                                    isPickerOpen
                                        ? "text-amber-500 bg-amber-500/15"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                                }`}
                                title="Emojis e Figurinhas"
                            >
                                <LuSmile className="h-5 w-5" />
                            </Button>

                            <div className="flex-1 min-h-[40px] max-h-36 bg-muted/60 border border-input rounded-2xl px-3.5 py-2 flex items-center focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                                <textarea
                                    value={inputText}
                                    onChange={(e) =>
                                        setInputText(e.target.value)
                                    }
                                    onKeyDown={handleKeyDown}
                                    onPaste={handlePaste}
                                    placeholder="Digite uma mensagem..."
                                    rows={1}
                                    className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none resize-none max-h-32 font-sans"
                                />
                            </div>

                            {inputText.trim() ? (
                                <Button
                                    size="icon"
                                    onClick={handleSend}
                                    className="h-10 w-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shrink-0 shadow-sm"
                                    title="Enviar mensagem"
                                >
                                    <LuSend className="h-4 w-4" />
                                </Button>
                            ) : (
                                <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={startRecording}
                                    className="h-10 w-10 rounded-xl border-emerald-500/30 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10 shrink-0 shadow-sm"
                                    title="Gravar mensagem de voz"
                                >
                                    <LuMic className="h-5 w-5" />
                                </Button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </section>
    )
}
