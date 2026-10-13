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
import { useCallback, useEffect, useRef, useState, KeyboardEvent } from "react"

import { formatPhoneNumber, getSenderColor } from "../../lib/format-sender"
import { WhatsAppService } from "../../services/whatsapp-service"
import { EmojiStickerPicker } from "./emoji-sticker-picker"
import { MessageContextMenu } from "./message-context-menu"
import { useAccount } from "../providers/account-provider"
import { GroupMembersModal } from "./group-members-modal"
import { MediaMessageCard } from "./media-message-card"
import { MessageInfoModal } from "./message-info-modal"
import { MediaSendModal } from "./media-send-modal"
import { FormattedText } from "./formatted-text"
import { ChatAvatar } from "./chat-avatar"
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
    const [pendingFile, setPendingFile] = useState<File | null>(null)
    const [isMediaModalOpen, setIsMediaModalOpen] = useState(false)
    const [isSyncingGroups, setIsSyncingGroups] = useState(false)
    const [isGroupMembersOpen, setIsGroupMembersOpen] = useState(false)

    // Context menu
    const [contextMenu, setContextMenu] = useState<{
        isOpen: boolean
        x: number
        y: number
        message: Message | null
    }>({ isOpen: false, x: 0, y: 0, message: null })

    // Message info modal
    const [infoMessage, setInfoMessage] = useState<Message | null>(null)

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
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
                                onClick={() => setIsGroupMembersOpen(true)}
                                title="Ver membros e opções do grupo"
                            >
                                <LuUsers className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">
                                    Membros
                                </span>
                            </Button>
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
                                    Sincronizar
                                </span>
                            </Button>
                        </>
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
            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
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

                    const msgReactions = reactions[message.id] ?? []
                    return (
                        <div
                            key={message.id}
                            className={`flex flex-col ${
                                isFromMe ? "items-end" : "items-start"
                            } ${isSameSender ? "mt-1" : "mt-3.5"}`}
                        >
                            <div
                                onContextMenu={(e) =>
                                    openContextMenu(e, message)
                                }
                                className={`max-w-[70%] rounded-2xl px-3.5 py-2.5 shadow-sm text-xs leading-relaxed space-y-1.5 cursor-context-menu ${
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
                            placeholder="Digite uma mensagem..."
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
