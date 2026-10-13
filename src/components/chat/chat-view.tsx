import {
    LuCheckCheck,
    LuEraser,
    LuPaperclip,
    LuRefreshCw,
    LuSend,
    LuShieldCheck,
    LuSmile,
    LuTrash2,
    LuUsers,
} from "react-icons/lu"
import { useEffect, useRef, useState, KeyboardEvent } from "react"

import {
    formatPhoneNumber,
    getSenderColor,
    getSenderInitials,
} from "../../lib/format-sender"
import { EmojiStickerPicker } from "./emoji-sticker-picker"
import { useAccount } from "../providers/account-provider"
import { MediaMessageCard } from "./media-message-card"
import { MediaSendModal } from "./media-send-modal"
import { FormattedText } from "./formatted-text"
import { Button } from "../ui/button"

export function ChatView() {
    const {
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
    const [pendingFile, setPendingFile] = useState<File | null>(null)
    const [isMediaModalOpen, setIsMediaModalOpen] = useState(false)
    const [isSyncingGroups, setIsSyncingGroups] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Auto-scroll to bottom on new message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    if (!activeChat) return null

    const handleSend = async () => {
        if (!inputText.trim()) return
        const text = inputText
        setInputText("")
        await sendMessage(text)
    }

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setPendingFile(file)
        setIsMediaModalOpen(true)
        e.target.value = ""
    }

    const handleSendMediaWithCaption = async (file: File, caption?: string) => {
        await sendMedia(file, caption)
        if (caption && caption === inputText) {
            setInputText("")
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

    const initials = activeChat.name
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()

    return (
        <section className="flex-1 flex flex-col h-screen bg-background overflow-hidden select-none">
            {/* Header */}
            <div className="h-16 px-4 border-b border-border bg-card/70 backdrop-blur flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center font-bold text-xs text-primary shadow-sm shrink-0">
                        {initials}
                    </div>
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
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10"
                            onClick={handleSyncGroup}
                            disabled={isSyncingGroups}
                            title="Sincronizar informações e nome do grupo"
                        >
                            <LuRefreshCw
                                className={`h-3.5 w-3.5 ${
                                    isSyncingGroups ? "animate-spin" : ""
                                }`}
                            />
                            <span className="hidden sm:inline">
                                Sincronizar Grupo
                            </span>
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10"
                        onClick={handleClearMessages}
                        title="Limpar todas as mensagens desta conversa"
                    >
                        <LuEraser className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">
                            Limpar Conversa
                        </span>
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={handleDeleteChat}
                        title="Excluir esta conversa"
                    >
                        <LuTrash2 className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Excluir Chat</span>
                    </Button>
                </div>
            </div>

            {/* Message Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin">
                {/* Security info banner */}
                <div className="mx-auto max-w-md p-2 rounded-lg bg-muted/40 border border-border/60 text-center text-[11px] text-muted-foreground flex items-center justify-center gap-1.5">
                    <LuShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>
                        As mensagens são protegidas com criptografia de ponta a
                        ponta e processadas nativamente em Rust.
                    </span>
                </div>

                {messages.map((message) => {
                    const isFromMe = message.fromMe
                    const timeFormatted = new Date(
                        message.timestamp,
                    ).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    })

                    const isSticker = message.media?.mediaType === "sticker"

                    if (isSticker && message.media) {
                        return (
                            <div
                                key={message.id}
                                className={`flex ${
                                    isFromMe ? "justify-end" : "justify-start"
                                }`}
                            >
                                <div className="relative group max-w-[70%]">
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
                                </div>
                            </div>
                        )
                    }

                    return (
                        <div
                            key={message.id}
                            className={`flex ${
                                isFromMe ? "justify-end" : "justify-start"
                            }`}
                        >
                            <div
                                className={`max-w-[70%] rounded-2xl px-3.5 py-2.5 shadow-sm text-xs leading-relaxed space-y-1.5 ${
                                    isFromMe
                                        ? "bg-primary text-primary-foreground rounded-br-xs"
                                        : "bg-card border border-border/80 text-foreground rounded-bl-xs"
                                }`}
                            >
                                {/* Group Participant Identification Header */}
                                {activeChat.isGroup &&
                                    !isFromMe &&
                                    (() => {
                                        const senderColor = getSenderColor(
                                            message.senderJid ||
                                                message.senderName,
                                        )
                                        const displayName =
                                            message.senderName ||
                                            formatPhoneNumber(
                                                message.senderJid,
                                            ) ||
                                            "Participante"
                                        const formattedPhone =
                                            formatPhoneNumber(message.senderJid)
                                        const initials =
                                            getSenderInitials(displayName)

                                        return (
                                            <div className="flex items-center gap-2 pb-1.5 mb-1 border-b border-border/40">
                                                <div
                                                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold border shrink-0 ${senderColor.bg} ${senderColor.text}`}
                                                >
                                                    {initials}
                                                </div>
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
                                                                (
                                                                {formattedPhone}
                                                                )
                                                            </span>
                                                        )}
                                                </div>
                                            </div>
                                        )
                                    })()}

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
                                    />
                                )}

                                {/* Text / Caption with WhatsApp Markdown & Clickable Links */}
                                {message.text && (
                                    <div className="text-xs leading-relaxed pt-0.5">
                                        <FormattedText text={message.text} />
                                    </div>
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
                        </div>
                    )
                })}
                <div ref={messagesEndRef} />
            </div>

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

            {/* Composer */}
            <div className="p-3 border-t border-border bg-card/80 backdrop-blur shrink-0 relative">
                {/* Emoji & Sticker Picker Popover */}
                <EmojiStickerPicker
                    open={isPickerOpen}
                    onClose={() => setIsPickerOpen(false)}
                    onSelectEmoji={(emoji) => {
                        setInputText((prev) => prev + emoji)
                    }}
                    onSendStickerFile={async (file) => {
                        await sendMedia(file, undefined, "sticker")
                    }}
                />

                <div className="flex items-end gap-2 max-w-4xl mx-auto">
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
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Digite uma mensagem... (Markdown: *negrito*, _itálico_, ~tachado~)"
                            rows={1}
                            className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none resize-none max-h-32 font-sans font-emoji"
                        />
                    </div>

                    <Button
                        size="icon"
                        onClick={handleSend}
                        disabled={!inputText.trim()}
                        className="h-10 w-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shrink-0 shadow-sm"
                        title="Enviar mensagem"
                    >
                        <LuSend className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </section>
    )
}
