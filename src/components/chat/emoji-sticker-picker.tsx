import { LuPlus, LuSearch, LuSmile, LuSticker, LuX } from "react-icons/lu"
import { convertFileSrc } from "@tauri-apps/api/core"
import { useRef, useState, useMemo } from "react"

import { useAccount } from "../providers/account-provider"
import { Button } from "../ui/button"
import { Input } from "../ui/input"

interface EmojiStickerPickerProps {
    open: boolean
    onClose: () => void
    onSelectEmoji: (emoji: string) => void
    onSendStickerFile: (file: File) => void
}

const EMOJI_CATEGORIES = [
    {
        name: "Carinhas & Emoções",
        emojis: [
            "😀",
            "😃",
            "😄",
            "😁",
            "😆",
            "😅",
            "🤣",
            "😂",
            "🙂",
            "🙃",
            "😉",
            "😊",
            "😇",
            "🥰",
            "😍",
            "🤩",
            "😘",
            "😗",
            "😚",
            "😋",
            "😛",
            "😜",
            "🤪",
            "😝",
            "🤗",
            "🤫",
            "🤔",
            "🤐",
            "🤨",
            "😐",
            "😑",
            "😶",
            "😏",
            "😒",
            "🙄",
            "😬",
            "🤥",
            "😌",
            "😔",
            "😪",
            "🤤",
            "😴",
            "😷",
            "🤒",
            "🤕",
            "🤢",
            "🤮",
            "🤧",
            "🥵",
            "🥶",
            "🥴",
            "😵",
            "🤯",
            "🤠",
            "🥳",
            "😎",
            "🤓",
            "🧐",
            "🥺",
            "😳",
        ],
    },
    {
        name: "Gestos & Mãos",
        emojis: [
            "👍",
            "👎",
            "👊",
            "✊",
            "🤛",
            "🤜",
            "🤞",
            "✌️",
            "🤟",
            "🤘",
            "👌",
            "🤌",
            "🤏",
            "👈",
            "👉",
            "👆",
            "👇",
            "☝️",
            "✋",
            "🤚",
            "🖐️",
            "🖖",
            "👋",
            "🤙",
            "💪",
            "🙏",
            "👏",
            "🤝",
            "✍️",
            "🤳",
        ],
    },
    {
        name: "Corações & Reações",
        emojis: [
            "❤️",
            "🧡",
            "💛",
            "💚",
            "💙",
            "💜",
            "🖤",
            "🤍",
            "🤎",
            "💔",
            "❣️",
            "💕",
            "💞",
            "💓",
            "💗",
            "💖",
            "💘",
            "💝",
            "🔥",
            "✨",
            "🌟",
            "💥",
            "💯",
            "🎉",
            "🚀",
            "👀",
            "💀",
            "🤡",
            "👻",
            "💩",
        ],
    },
    {
        name: "Objetos & Símbolos",
        emojis: [
            "☕",
            "🍺",
            "🍻",
            "🍕",
            "🍔",
            "🎯",
            "🏆",
            "🎮",
            "🎵",
            "🎧",
            "💡",
            "⚡",
            "⭐",
            "🌈",
            "☀️",
            "🌙",
            "👑",
            "💎",
            "💰",
            "💸",
            "📱",
            "💻",
            "⌨️",
            "📷",
            "🔒",
            "🔑",
            "📌",
            "📍",
            "⏰",
            "⏳",
        ],
    },
]

async function convertToStickerWebp(file: File): Promise<File> {
    return new Promise((resolve) => {
        const img = new Image()
        const url = URL.createObjectURL(file)
        img.onload = () => {
            URL.revokeObjectURL(url)
            const canvas = document.createElement("canvas")
            canvas.width = 512
            canvas.height = 512
            const ctx = canvas.getContext("2d")
            if (!ctx) {
                resolve(file)
                return
            }
            const scale = Math.min(512 / img.width, 512 / img.height)
            const w = img.width * scale
            const h = img.height * scale
            const x = (512 - w) / 2
            const y = (512 - h) / 2
            ctx.clearRect(0, 0, 512, 512)
            ctx.drawImage(img, x, y, w, h)
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(
                            new File([blob], "sticker.webp", {
                                type: "image/webp",
                            }),
                        )
                    } else {
                        resolve(file)
                    }
                },
                "image/webp",
                0.9,
            )
        }
        img.onerror = () => {
            URL.revokeObjectURL(url)
            resolve(file)
        }
        img.src = url
    })
}

export function EmojiStickerPicker({
    open,
    onClose,
    onSelectEmoji,
    onSendStickerFile,
}: EmojiStickerPickerProps) {
    const { messages, sendMedia, activeChat } = useAccount()
    const [activeTab, setActiveTab] = useState<"emojis" | "stickers">("emojis")
    const [searchQuery, setSearchQuery] = useState("")
    const stickerInputRef = useRef<HTMLInputElement>(null)

    // Extract recent downloaded stickers from chat history
    const recentStickers = useMemo(() => {
        const stickers: Array<{ id: string; localPath: string }> = []
        const seenPaths = new Set<string>()

        for (const msg of messages) {
            if (
                msg.media &&
                msg.media.mediaType === "sticker" &&
                msg.media.isDownloaded &&
                msg.media.localPath &&
                !seenPaths.has(msg.media.localPath)
            ) {
                seenPaths.add(msg.media.localPath)
                stickers.push({
                    id: msg.id,
                    localPath: msg.media.localPath,
                })
            }
        }

        return stickers
    }, [messages])

    if (!open) return null

    const handleStickerFileChange = async (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = e.target.files?.[0]
        if (!file) return
        e.target.value = ""
        onClose()

        try {
            const webpFile = await convertToStickerWebp(file)
            onSendStickerFile(webpFile)
        } catch {
            onSendStickerFile(file)
        }
    }

    const handleSendRecentSticker = async (localPath: string) => {
        if (!activeChat) return
        try {
            // Read local file as blob via fetch Tauri asset URL
            const assetUrl = convertFileSrc(localPath)
            const res = await fetch(assetUrl)
            const blob = await res.blob()
            const file = new File([blob], "sticker.webp", {
                type: "image/webp",
            })
            await sendMedia(file, undefined, "sticker")
            onClose()
        } catch (error) {
            console.error("Erro ao reenviar figurinha:", error)
        }
    }

    return (
        <div className="absolute bottom-16 left-3 z-50 w-80 sm:w-96 rounded-2xl border border-border/80 bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col h-96 select-none animate-in fade-in slide-in-from-bottom-2 duration-200">
            {/* Header with Tabs & Close button */}
            <div className="p-2.5 border-b border-border/60 flex items-center justify-between bg-muted/40">
                <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-xl border border-border/40">
                    <button
                        type="button"
                        onClick={() => setActiveTab("emojis")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            activeTab === "emojis"
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <LuSmile className="w-3.5 h-3.5 text-amber-500" />
                        <span>Emojis</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("stickers")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            activeTab === "stickers"
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <LuSticker className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Figurinhas</span>
                    </button>
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg"
                    onClick={onClose}
                >
                    <LuX className="w-4 h-4" />
                </Button>
            </div>

            {/* TAB 1: EMOJIS (COM NOTO COLOR EMOJI) */}
            {activeTab === "emojis" && (
                <div className="flex-1 flex flex-col min-h-0">
                    <div className="p-2 border-b border-border/40">
                        <div className="relative">
                            <LuSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                            <Input
                                placeholder="Filtrar emojis..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-8 pl-8 text-xs bg-muted/50 border-0 focus-visible:ring-1"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin">
                        {EMOJI_CATEGORIES.map((cat) => {
                            const filtered = cat.emojis.filter((emoji) =>
                                searchQuery
                                    ? emoji.includes(searchQuery)
                                    : true,
                            )
                            if (filtered.length === 0) return null

                            return (
                                <div key={cat.name} className="space-y-1.5">
                                    <h5 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                        {cat.name}
                                    </h5>
                                    <div className="grid grid-cols-8 gap-1">
                                        {filtered.map((emoji, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() =>
                                                    onSelectEmoji(emoji)
                                                }
                                                className="w-9 h-9 rounded-lg hover:bg-muted/80 flex items-center justify-center text-xl font-emoji transition-transform hover:scale-125 active:scale-95"
                                                title={emoji}
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* TAB 2: FIGURINHAS (STICKERS) */}
            {activeTab === "stickers" && (
                <div className="flex-1 flex flex-col min-h-0 p-3 space-y-3">
                    <input
                        type="file"
                        ref={stickerInputRef}
                        onChange={handleStickerFileChange}
                        accept="image/webp,image/png,image/jpeg"
                        className="hidden"
                    />

                    <Button
                        variant="outline"
                        onClick={() => stickerInputRef.current?.click()}
                        className="w-full h-9 text-xs font-medium gap-2 border-dashed border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 rounded-xl"
                    >
                        <LuPlus className="w-4 h-4" />
                        Criar / Enviar Imagem como Figurinha
                    </Button>

                    <div className="flex-1 overflow-y-auto scrollbar-thin">
                        <h5 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            Figurinhas desta conversa ({recentStickers.length})
                        </h5>

                        {recentStickers.length === 0 ? (
                            <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
                                <LuSticker className="w-8 h-8 mx-auto text-muted-foreground/40" />
                                <p>Nenhuma figurinha recente encontrada.</p>
                                <p className="text-[11px] text-muted-foreground/70">
                                    Envie qualquer imagem pelo botão acima para
                                    criar uma figurinha!
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-4 gap-2">
                                {recentStickers.map((stk) => (
                                    <button
                                        key={stk.id}
                                        type="button"
                                        onClick={() =>
                                            handleSendRecentSticker(
                                                stk.localPath,
                                            )
                                        }
                                        className="w-18 h-18 p-1.5 rounded-xl border border-border/40 hover:border-emerald-500/50 hover:bg-muted/50 flex items-center justify-center transition-all hover:scale-105 active:scale-95 group"
                                        title="Clique para enviar esta figurinha"
                                    >
                                        <img
                                            src={convertFileSrc(stk.localPath)}
                                            alt="Figurinha"
                                            className="w-full h-full object-contain"
                                            loading="lazy"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
