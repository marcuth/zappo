import {
    LuCopy,
    LuInfo,
    LuSmile,
    LuX,
} from "react-icons/lu"
import { useEffect, useRef, useState } from "react"

interface MessageContextMenuProps {
    isOpen: boolean
    x: number
    y: number
    hasText: boolean
    onClose: () => void
    onCopyText: () => void
    onViewInfo: () => void
    onReact: (emoji: string) => void
}

// Emojis rápidos de reação (os mais comuns no WhatsApp)
const QUICK_REACTION_EMOJIS = ["❤️", "😂", "😮", "😢", "🙏", "👍"]

export function MessageContextMenu({
    isOpen,
    x,
    y,
    hasText,
    onClose,
    onCopyText,
    onViewInfo,
    onReact,
}: MessageContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null)
    const [adjustedPos, setAdjustedPos] = useState({ x, y })

    useEffect(() => {
        if (!isOpen || !menuRef.current) return

        const menu = menuRef.current
        const rect = menu.getBoundingClientRect()
        const viewW = window.innerWidth
        const viewH = window.innerHeight

        let nx = x
        let ny = y

        if (x + rect.width > viewW - 8) nx = viewW - rect.width - 8
        if (y + rect.height > viewH - 8) ny = viewH - rect.height - 8
        if (nx < 8) nx = 8
        if (ny < 8) ny = 8

        setAdjustedPos({ x: nx, y: ny })
    }, [isOpen, x, y])

    useEffect(() => {
        if (!isOpen) return
        const handler = (e: MouseEvent | KeyboardEvent) => {
            if (e instanceof KeyboardEvent && e.key !== "Escape") return
            onClose()
        }
        document.addEventListener("mousedown", handler)
        document.addEventListener("keydown", handler)
        return () => {
            document.removeEventListener("mousedown", handler)
            document.removeEventListener("keydown", handler)
        }
    }, [isOpen, onClose])

    if (!isOpen) return null

    return (
        <div
            ref={menuRef}
            className="fixed z-50 select-none"
            style={{ left: adjustedPos.x, top: adjustedPos.y }}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <div className="bg-card border border-border/80 rounded-2xl shadow-2xl shadow-black/30 overflow-hidden min-w-[180px] backdrop-blur">
                {/* Quick reactions row */}
                <div className="flex items-center gap-0.5 px-2.5 py-2.5 border-b border-border/60 bg-muted/30">
                    {QUICK_REACTION_EMOJIS.map((emoji) => (
                        <button
                            key={emoji}
                            title={`Reagir com ${emoji}`}
                            onClick={() => {
                                onReact(emoji)
                                onClose()
                            }}
                            className="w-8 h-8 flex items-center justify-center text-lg rounded-xl hover:bg-muted/80 hover:scale-125 active:scale-95 transition-all duration-150 cursor-pointer font-emoji"
                        >
                            {emoji}
                        </button>
                    ))}
                    <button
                        title="Mais reações"
                        onClick={() => {
                            /* future: open reaction picker */
                            onClose()
                        }}
                        className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                        <LuSmile className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* Actions */}
                <div className="py-1">
                    {hasText && (
                        <button
                            onClick={() => {
                                onCopyText()
                                onClose()
                            }}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                        >
                            <LuCopy className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>Copiar texto</span>
                        </button>
                    )}
                    <button
                        onClick={() => {
                            onViewInfo()
                            onClose()
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                    >
                        <LuInfo className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>Ver dados da mensagem</span>
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-muted-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                    >
                        <LuX className="w-3.5 h-3.5" />
                        <span>Fechar</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
