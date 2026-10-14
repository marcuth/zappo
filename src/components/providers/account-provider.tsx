import {
    createContext,
    useContext,
    useEffect,
    useState,
    useRef,
    ReactNode,
    useCallback,
} from "react"
import { toast } from "sonner"

import {
    Account,
    AppSettings,
    Chat,
    MediaType,
    Message,
    PairingCodeResponse,
    QrCodeResponse,
    StorageStats,
} from "../../types"
import { WhatsAppService } from "../../services/whatsapp-service"
import { playNotificationSound } from "../../lib/sound-effects"

interface AccountContextType {
    accounts: Account[]
    activeAccount: Account | null
    chats: Chat[]
    activeChat: Chat | null
    messages: Message[]
    settings: AppSettings
    storageStats: StorageStats | null
    isLoading: boolean
    isConnecting: boolean
    qrData: string | null
    pairingCode: string | null
    // Actions
    switchAccount: (accountId: string) => Promise<void>
    createAccount: (name: string, phoneNumber?: string) => Promise<Account>
    renameAccount: (accountId: string, newName: string) => Promise<void>
    deleteAccount: (accountId: string) => Promise<void>
    selectChat: (chat: Chat | null) => Promise<void>
    startChat: (phoneNumber: string, name?: string) => Promise<Chat | null>
    sendMessage: (text: string, replyToId?: string) => Promise<void>
    sendMedia: (
        file: File,
        caption?: string,
        forceMediaType?: MediaType,
        isViewOnce?: boolean,
    ) => Promise<void>
    downloadMedia: (messageId: string) => Promise<void>
    refreshStorageStats: () => Promise<void>
    clearMediaCache: (
        category?: string,
        olderThanDays?: number,
    ) => Promise<void>
    clearChatCache: (chatJid: string) => Promise<void>
    deleteChat: (chatJid: string) => Promise<void>
    clearChatMessages: (chatJid: string) => Promise<void>
    vacuumDatabase: () => Promise<void>
    clearAllCache: () => Promise<void>
    updateSettings: (newSettings: AppSettings) => Promise<void>
    requestPairingCode: (phoneNumber: string) => Promise<void>
    disconnectActiveAccount: () => Promise<void>
    syncGroups: () => Promise<void>
}

const defaultSettings: AppSettings = {
    theme: "dark",
    notifications: true,
    notificationSound: true,
    autoDownload: {
        images: false, // Performance first! Desativado por padrão
        videos: false,
        audio: false,
        documents: false,
        stickers: false,
        maxFileSizeMb: 10,
        autoDownloadOnWifi: true,
        autoDownloadOnCellular: false,
    },
    performanceMode: true,
    hardwareAcceleration: true,
}

const AccountContext = createContext<AccountContextType | null>(null)

export function AccountProvider({ children }: { children: ReactNode }) {
    const [accounts, setAccounts] = useState<Account[]>([])
    const [activeAccount, setActiveAccount] = useState<Account | null>(null)
    const [chats, setChats] = useState<Chat[]>([])
    const [activeChat, setActiveChat] = useState<Chat | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [settings, setSettings] = useState<AppSettings>(defaultSettings)
    const settingsRef = useRef<AppSettings>(defaultSettings)
    settingsRef.current = settings
    const activeAccountRef = useRef<Account | null>(null)
    activeAccountRef.current = activeAccount
    const activeChatRef = useRef<Chat | null>(null)
    activeChatRef.current = activeChat
    const [storageStats, setStorageStats] = useState<StorageStats | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isConnecting, setIsConnecting] = useState(false)
    const [qrData, setQrData] = useState<string | null>(null)
    const [pairingCode, setPairingCode] = useState<string | null>(null)

    // Load initial data
    const loadInitialData = useCallback(async () => {
        try {
            setIsLoading(true)
            const [accs, active, initialSettings] = await Promise.all([
                WhatsAppService.getAccounts(),
                WhatsAppService.getActiveAccount(),
                WhatsAppService.getSettings().catch(() => defaultSettings),
            ])

            setAccounts(accs)
            setActiveAccount(active)
            setSettings(initialSettings)

            if (active) {
                const initialChats = await WhatsAppService.getChats(active.id)
                setChats(initialChats)
            }
        } catch (error) {
            console.error("Falha ao carregar dados iniciais:", error)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        loadInitialData()
    }, [loadInitialData])

    // Listen to real-time events from Rust
    useEffect(() => {
        let unlistenQr: (() => void) | undefined
        let unlistenConn: (() => void) | undefined
        let unlistenMsg: (() => void) | undefined
        let unlistenStatus: (() => void) | undefined
        let unlistenChats: (() => void) | undefined

        const setupListeners = async () => {
            unlistenQr = await WhatsAppService.onQrCode(
                (payload: QrCodeResponse) => {
                    setQrData(payload.qrData)
                },
            )

            unlistenConn = await WhatsAppService.onConnectionState(
                (payload) => {
                    if (payload.status === "connected") {
                        setQrData(null)
                        toast.success("WhatsApp conectado com sucesso!")
                        WhatsAppService.getChats(payload.accountId).then(
                            (loaded) => {
                                if (loaded.length > 0) {
                                    setChats(loaded)
                                }
                            },
                        )
                    }

                    setAccounts((prev) =>
                        prev.map((acc) =>
                            acc.id === payload.accountId
                                ? {
                                      ...acc,
                                      status: payload.status as Account["status"],
                                      isActive: payload.status === "connected",
                                  }
                                : acc,
                        ),
                    )

                    setActiveAccount((prev) =>
                        prev && prev.id === payload.accountId
                            ? {
                                  ...prev,
                                  status: payload.status as Account["status"],
                                  isActive: payload.status === "connected",
                              }
                            : prev,
                    )
                },
            )

            unlistenChats = await WhatsAppService.onChatsUpdated(
                ({ accountId, chats: newChats }) => {
                    if (!activeAccount || activeAccount.id !== accountId) return
                    setChats(newChats)
                },
            )

            unlistenMsg = await WhatsAppService.onNewMessage(
                ({ accountId, message }) => {
                    // SÓ A CONTA ATIVA PROCESSA MENSAGENS!
                    if (!activeAccount || activeAccount.id !== accountId) return

                    // Não toca notificação se eu sou o autor da mensagem
                    const currentAcc = activeAccountRef.current
                    const cleanPhone = (phone?: string) =>
                        phone ? phone.replace(/\D/g, "") : ""
                    const myPhoneDigits = cleanPhone(currentAcc?.phone)
                    const senderJidDigits = cleanPhone(message.senderJid)
                    const chatJidDigits = cleanPhone(message.chatJid)

                    const isOwnMessage =
                        Boolean(message.fromMe) ||
                        message.senderName === "Você" ||
                        (myPhoneDigits.length > 5 &&
                            (senderJidDigits.includes(myPhoneDigits) ||
                                myPhoneDigits.includes(senderJidDigits))) ||
                        (!message.chatJid.endsWith("@g.us") &&
                            myPhoneDigits.length > 5 &&
                            chatJidDigits === myPhoneDigits)

                    // Tocar som de notificação apenas para mensagens recebidas de terceiros e se o som estiver ativo
                    if (
                        !isOwnMessage &&
                        settingsRef.current.notificationSound
                    ) {
                        playNotificationSound()
                    }

                    // Update active conversation if matches with robust deduplication
                    if (activeChat && activeChat.jid === message.chatJid) {
                        setMessages((prev) => {
                            if (prev.some((m) => m.id === message.id))
                                return prev
                            const optimisticIndex = message.fromMe
                                ? prev.findIndex(
                                      (m) =>
                                          m.fromMe &&
                                          m.text === message.text &&
                                          Math.abs(
                                              m.timestamp - message.timestamp,
                                          ) < 15000,
                                  )
                                : -1
                            if (optimisticIndex !== -1) {
                                const next = [...prev]
                                next[optimisticIndex] = message
                                return next
                            }
                            if (!message.text?.trim() && !message.media) {
                                return prev
                            }
                            return [...prev, message]
                        })
                    }

                    // Update chats snippet & unread count
                    setChats((prev) => {
                        const exists = prev.some(
                            (c) => c.jid === message.chatJid,
                        )
                        if (!exists) {
                            WhatsAppService.getChats(accountId).then(
                                (fresh) => {
                                    setChats(fresh)
                                },
                            )
                            return prev
                        }

                        return prev
                            .map((c) => {
                                if (c.jid === message.chatJid) {
                                    return {
                                        ...c,
                                        lastMessage: {
                                            id: message.id,
                                            text: message.text || "[Mídia]",
                                            timestamp: message.timestamp,
                                            fromMe: message.fromMe,
                                            type: (message.media
                                                ? message.media.mediaType
                                                : "text") as MediaType | "text",
                                            status: message.status,
                                        },
                                        unreadCount:
                                            activeChat?.jid === message.chatJid
                                                ? 0
                                                : c.unreadCount + 1,
                                        updatedAt: message.timestamp,
                                    }
                                }
                                return c
                            })
                            .sort((a, b) => b.updatedAt - a.updatedAt)
                    })
                },
            )

            unlistenStatus = await WhatsAppService.onMessageStatus(
                ({ messageId, status }) => {
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.id === messageId ? { ...m, status } : m,
                        ),
                    )
                },
            )
        }

        setupListeners()

        return () => {
            unlistenQr?.()
            unlistenConn?.()
            unlistenMsg?.()
            unlistenStatus?.()
            unlistenChats?.()
        }
    }, [activeAccount, activeChat])

    // Switch account (disconnects current active socket, activates the target account)
    const switchAccount = async (accountId: string) => {
        try {
            setIsConnecting(true)
            setQrData(null)
            const switched = await WhatsAppService.switchAccount(accountId)
            setActiveAccount(switched)
            setActiveChat(null)
            setMessages([])

            if (
                switched.status === "pairing" ||
                switched.status === "disconnected"
            ) {
                WhatsAppService.getPairingQr(accountId)
                    .then((qr) => {
                        if (qr?.qrData) setQrData(qr.qrData)
                    })
                    .catch(() => {})
            }

            // Reload accounts & chats for switched account
            const [accs, newChats] = await Promise.all([
                WhatsAppService.getAccounts(),
                WhatsAppService.getChats(accountId),
            ])
            setAccounts(accs)
            setChats(newChats)
            toast.success(
                `Conta alternada para "${switched.name}". Apenas esta conta receberá mensagens.`,
            )
        } catch (error) {
            console.error("Erro ao alternar conta:", error)
            toast.error("Falha ao alternar conta.")
        } finally {
            setIsConnecting(false)
        }
    }

    const createAccount = async (
        name: string,
        phoneNumber?: string,
    ): Promise<Account> => {
        setIsConnecting(true)
        setQrData(null)
        const newAcc = await WhatsAppService.createAccount(name, phoneNumber)
        setAccounts((prev) => [...prev, newAcc])
        setActiveAccount(newAcc)

        WhatsAppService.getPairingQr(newAcc.id)
            .then((qr) => {
                if (qr?.qrData) setQrData(qr.qrData)
            })
            .catch(() => {})

        toast.success(
            `Conta "${name}" criada. Escaneie o QR Code do WhatsApp para parear.`,
        )
        return newAcc
    }

    const renameAccount = async (accountId: string, newName: string) => {
        try {
            const updated = await WhatsAppService.renameAccount(
                accountId,
                newName,
            )
            setAccounts((prev) =>
                prev.map((a) =>
                    a.id === accountId ? { ...a, name: updated.name } : a,
                ),
            )
            if (activeAccount?.id === accountId) {
                setActiveAccount((prev) =>
                    prev ? { ...prev, name: updated.name } : null,
                )
            }
            toast.success(`Conta renomeada para "${updated.name}".`)
        } catch (error) {
            console.error("Erro ao renomear conta:", error)
            toast.error("Falha ao renomear conta.")
        }
    }

    const deleteAccount = async (accountId: string) => {
        await WhatsAppService.deleteAccount(accountId)
        setAccounts((prev) => prev.filter((a) => a.id !== accountId))
        if (activeAccount?.id === accountId) {
            setActiveAccount(null)
            setActiveChat(null)
            setChats([])
            setMessages([])
        }
        toast.info("Conta removida com sucesso.")
    }

    const selectChat = async (chat: Chat | null) => {
        setActiveChat(chat)
        if (!chat || !activeAccount) {
            setMessages([])
            return
        }

        try {
            const msgs = await WhatsAppService.getMessages(
                activeAccount.id,
                chat.jid,
                50,
            )
            setMessages(msgs)

            // Mark as read in chat list
            setChats((prev) =>
                prev.map((c) =>
                    c.jid === chat.jid ? { ...c, unreadCount: 0 } : c,
                ),
            )
        } catch (error) {
            console.error("Erro ao carregar mensagens:", error)
        }
    }

    const sendMessage = async (text: string, replyToId?: string) => {
        if (!activeAccount || !activeChat || !text.trim()) return

        try {
            const sentMsg = await WhatsAppService.sendMessage(
                activeAccount.id,
                activeChat.jid,
                text,
                replyToId,
            )
            setMessages((prev) => {
                if (prev.some((m) => m.id === sentMsg.id)) {
                    return prev
                }
                return [...prev, sentMsg]
            })

            // Update chat last message
            setChats((prev) =>
                prev.map((c) =>
                    c.jid === activeChat.jid
                        ? {
                              ...c,
                              lastMessage: {
                                  id: sentMsg.id,
                                  text: sentMsg.text || "",
                                  timestamp: sentMsg.timestamp,
                                  fromMe: true,
                                  type: "text",
                                  status: "pending",
                              },
                              updatedAt: sentMsg.timestamp,
                          }
                        : c,
                ),
            )
        } catch (error) {
            console.error("Erro ao enviar mensagem:", error)
            toast.error("Falha ao enviar mensagem.")
        }
    }

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = (error) => reject(error)
            reader.readAsDataURL(file)
        })
    }

    const startChat = async (
        phoneNumber: string,
        name?: string,
    ): Promise<Chat | null> => {
        if (!activeAccount) {
            toast.error("Nenhuma conta ativa selecionada.")
            return null
        }

        try {
            const chat = await WhatsAppService.startChat(
                activeAccount.id,
                phoneNumber,
                name,
            )
            setChats((prev) => {
                if (prev.some((c) => c.jid === chat.jid)) {
                    return prev.map((c) => (c.jid === chat.jid ? chat : c))
                }
                return [chat, ...prev]
            })
            await selectChat(chat)
            return chat
        } catch (error) {
            console.error("Erro ao iniciar conversa:", error)
            toast.error("Falha ao iniciar conversa com o número.")
            return null
        }
    }

    const sendMedia = async (
        file: File,
        caption?: string,
        forceMediaType?: MediaType,
        isViewOnce?: boolean,
    ) => {
        if (!activeAccount || !activeChat) return

        try {
            const base64Data = await fileToBase64(file)

            let mediaType: MediaType = forceMediaType || "document"

            if (!forceMediaType) {
                if (file.type.startsWith("image/")) {
                    mediaType = file.type === "image/webp" ? "sticker" : "image"
                } else if (file.type.startsWith("video/")) {
                    mediaType = "video"
                } else if (file.type.startsWith("audio/")) {
                    mediaType = "audio"
                }
            }

            const sentMsg = await WhatsAppService.sendMedia(
                activeAccount.id,
                activeChat.jid,
                mediaType,
                file.name,
                base64Data,
                caption,
                isViewOnce,
            )

            setMessages((prev) => {
                if (prev.some((m) => m.id === sentMsg.id)) {
                    return prev
                }
                return [...prev, sentMsg]
            })

            const label =
                mediaType === "image"
                    ? "Foto"
                    : mediaType === "video"
                      ? "Vídeo"
                      : mediaType === "audio"
                        ? "Áudio"
                        : mediaType === "sticker"
                          ? "Figurinha"
                          : "Documento"

            setChats((prev) =>
                prev.map((c) =>
                    c.jid === activeChat.jid
                        ? {
                              ...c,
                              lastMessage: {
                                  id: sentMsg.id,
                                  text: caption || `[${label}] ${file.name}`,
                                  timestamp: sentMsg.timestamp,
                                  fromMe: true,
                                  type: mediaType,
                                  status: "delivered",
                              },
                              updatedAt: sentMsg.timestamp,
                          }
                        : c,
                ),
            )
            toast.success("Anexo enviado!")
        } catch (error) {
            console.error("Erro ao enviar anexo:", error)
            toast.error("Falha ao enviar anexo.")
        }
    }

    const downloadMedia = async (messageId: string) => {
        if (!activeAccount) return

        try {
            // Set downloading progress state
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === messageId && m.media
                        ? {
                              ...m,
                              media: {
                                  ...m.media,
                                  isDownloading: true,
                                  downloadProgress: 20,
                              },
                          }
                        : m,
                ),
            )

            const localPath = await WhatsAppService.downloadMedia(
                activeAccount.id,
                messageId,
            )

            setMessages((prev) =>
                prev.map((m) =>
                    m.id === messageId && m.media
                        ? {
                              ...m,
                              media: {
                                  ...m.media,
                                  isDownloaded: true,
                                  isDownloading: false,
                                  downloadProgress: 100,
                                  localPath,
                              },
                          }
                        : m,
                ),
            )
            toast.success("Mídia baixada com sucesso!")
        } catch (error) {
            console.error("Erro ao baixar mídia:", error)
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === messageId && m.media
                        ? {
                              ...m,
                              media: {
                                  ...m.media,
                                  isDownloading: false,
                              },
                          }
                        : m,
                ),
            )
            toast.error("Falha ao baixar mídia.")
        }
    }

    const refreshStorageStats = async () => {
        try {
            const stats = await WhatsAppService.getStorageStats(
                activeAccount?.id,
            )
            setStorageStats(stats)
        } catch (error) {
            console.error("Erro ao obter estatísticas de armazenamento:", error)
        }
    }

    const clearMediaCache = async (
        category?: string,
        olderThanDays?: number,
    ) => {
        const { freedBytes } = await WhatsAppService.clearMediaCache(
            category,
            olderThanDays,
        )
        const freedMb = (freedBytes / (1024 * 1024)).toFixed(1)
        toast.success(`Cache de mídia limpo! ${freedMb} MB liberados.`)
        await refreshStorageStats()
    }

    const clearChatCache = async (chatJid: string) => {
        const { freedBytes } = await WhatsAppService.clearChatCache(chatJid)
        const freedMb = (freedBytes / (1024 * 1024)).toFixed(1)
        toast.success(`Mídias da conversa limpas! ${freedMb} MB liberados.`)
        await refreshStorageStats()
    }

    const deleteChat = async (chatJid: string) => {
        if (!activeAccount) return

        try {
            await WhatsAppService.deleteChat(activeAccount.id, chatJid)
            setChats((prev) => prev.filter((c) => c.jid !== chatJid))
            if (activeChat?.jid === chatJid) {
                setActiveChat(null)
                setMessages([])
            }
            toast.success("Conversa excluída.")
        } catch (error) {
            console.error("Erro ao excluir conversa:", error)
            toast.error("Falha ao excluir conversa.")
        }
    }

    const clearChatMessages = async (chatJid: string) => {
        if (!activeAccount) return

        try {
            await WhatsAppService.clearChatMessages(activeAccount.id, chatJid)
            if (activeChat?.jid === chatJid) {
                setMessages([])
            }
            setChats((prev) =>
                prev.map((c) =>
                    c.jid === chatJid
                        ? { ...c, lastMessage: undefined, unreadCount: 0 }
                        : c,
                ),
            )
            toast.success("Conversa limpa com sucesso.")
        } catch (error) {
            console.error("Erro ao limpar mensagens da conversa:", error)
            toast.error("Falha ao limpar conversa.")
        }
    }

    const vacuumDatabase = async () => {
        const { freedBytes } = await WhatsAppService.vacuumDatabase()
        const freedMb = (freedBytes / (1024 * 1024)).toFixed(1)
        toast.success(
            `Banco SQLite compactado com sucesso! ${freedMb} MB liberados.`,
        )
        await refreshStorageStats()
    }

    const clearAllCache = async () => {
        const { freedBytes } = await WhatsAppService.clearAllCache()
        const freedMb = (freedBytes / (1024 * 1024)).toFixed(1)
        toast.success(`Limpeza completa concluída! ${freedMb} MB liberados.`)
        await refreshStorageStats()
    }

    const updateSettings = async (newSettings: AppSettings) => {
        await WhatsAppService.saveSettings(newSettings)
        setSettings(newSettings)
        toast.success("Configurações atualizadas!")
    }

    const requestPairingCode = async (phoneNumber: string) => {
        if (!activeAccount) return
        const res: PairingCodeResponse =
            await WhatsAppService.requestPairingCode(
                activeAccount.id,
                phoneNumber,
            )
        setPairingCode(res.code)
    }

    const disconnectActiveAccount = async () => {
        await WhatsAppService.disconnectActiveAccount()
        if (activeAccount) {
            setActiveAccount({
                ...activeAccount,
                status: "disconnected",
                isActive: false,
            })
        }
        toast.info("Sessão desconectada.")
    }

    const syncGroups = async () => {
        if (!activeAccount) return
        try {
            const updated = await WhatsAppService.syncGroups(activeAccount.id)
            setChats(updated)
            toast.success("Grupos sincronizados com sucesso!")
        } catch (error) {
            console.error("Erro ao sincronizar grupos:", error)
            toast.error("Falha ao sincronizar grupos.")
        }
    }

    return (
        <AccountContext.Provider
            value={{
                accounts,
                activeAccount,
                chats,
                activeChat,
                messages,
                settings,
                storageStats,
                isLoading,
                isConnecting,
                qrData,
                pairingCode,
                switchAccount,
                createAccount,
                renameAccount,
                deleteAccount,
                selectChat,
                startChat,
                sendMessage,
                sendMedia,
                downloadMedia,
                refreshStorageStats,
                clearMediaCache,
                clearChatCache,
                deleteChat,
                clearChatMessages,
                vacuumDatabase,
                clearAllCache,
                updateSettings,
                requestPairingCode,
                disconnectActiveAccount,
                syncGroups,
            }}
        >
            {children}
        </AccountContext.Provider>
    )
}

export function useAccount() {
    const context = useContext(AccountContext)
    if (!context) {
        throw new Error(
            "useAccount deve ser usado dentro de um AccountProvider",
        )
    }
    return context
}
