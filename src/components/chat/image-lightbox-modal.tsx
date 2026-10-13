import {
    LuDownload,
    LuRotateCcw,
    LuRotateCw,
    LuX,
    LuZoomIn,
    LuZoomOut,
} from "react-icons/lu"
import { useEffect, useState, useCallback } from "react"

import { Button } from "../ui/button"

interface ImageLightboxModalProps {
    isOpen: boolean
    imageUrl: string | null
    fileName?: string
    fileSize?: number
    onClose: () => void
}

export function ImageLightboxModal({
    isOpen,
    imageUrl,
    fileName = "Imagem",
    fileSize,
    onClose,
}: ImageLightboxModalProps) {
    const [scale, setScale] = useState(1)
    const [rotation, setRotation] = useState(0)

    const handleZoomIn = useCallback(
        () => setScale((s) => Math.min(s + 0.25, 4)),
        [],
    )
    const handleZoomOut = useCallback(
        () => setScale((s) => Math.max(s - 0.25, 0.5)),
        [],
    )
    const handleRotate = useCallback(
        () => setRotation((r) => (r + 90) % 360),
        [],
    )
    const handleReset = useCallback(() => {
        setScale(1)
        setRotation(0)
    }, [])

    const handleClose = useCallback(() => {
        setScale(1)
        setRotation(0)
        onClose()
    }, [onClose])

    useEffect(() => {
        if (!isOpen) return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") handleClose()
            if (e.key === "+" || e.key === "=") handleZoomIn()
            if (e.key === "-") handleZoomOut()
            if (e.key === "0") handleReset()
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [isOpen, handleClose, handleZoomIn, handleZoomOut, handleReset])

    if (!isOpen || !imageUrl) return null

    const formatBytes = (bytes?: number) => {
        if (!bytes || bytes === 0) return ""
        const k = 1024
        const sizes = ["B", "KB", "MB", "GB"]
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
    }

    return (
        <div
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between p-4 select-none animate-in fade-in duration-200"
            onClick={(e) => {
                if (e.target === e.currentTarget) handleClose()
            }}
        >
            {/* Top Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 bg-black/60 border border-white/10 rounded-2xl backdrop-blur max-w-4xl w-full mx-auto z-10">
                <div className="min-w-0 pr-4">
                    <h4 className="text-xs font-semibold text-white truncate">
                        {fileName}
                    </h4>
                    {fileSize && (
                        <p className="text-[10px] text-white/60 font-mono">
                            {formatBytes(fileSize)}
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-1.5">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10 rounded-lg"
                        onClick={handleZoomOut}
                        title="Reduzir zoom (-)"
                    >
                        <LuZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-[11px] font-mono text-white/70 min-w-10 text-center">
                        {Math.round(scale * 100)}%
                    </span>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10 rounded-lg"
                        onClick={handleZoomIn}
                        title="Aumentar zoom (+)"
                    >
                        <LuZoomIn className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10 rounded-lg"
                        onClick={handleRotate}
                        title="Girar 90°"
                    >
                        <LuRotateCw className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10 rounded-lg"
                        onClick={handleReset}
                        title="Redefinir escala e rotação (0)"
                    >
                        <LuRotateCcw className="h-4 w-4" />
                    </Button>

                    <a
                        href={imageUrl}
                        download={fileName}
                        className="inline-flex items-center justify-center h-8 w-8 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        title="Baixar / Salvar Imagem"
                    >
                        <LuDownload className="h-4 w-4" />
                    </a>

                    <div className="h-4 w-px bg-white/20 mx-1" />

                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white/80 hover:text-red-400 hover:bg-white/10 rounded-lg"
                        onClick={handleClose}
                        title="Fechar (Esc)"
                    >
                        <LuX className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Central Canvas */}
            <div className="flex-1 flex items-center justify-center overflow-hidden p-4 relative">
                <div
                    className="transition-transform duration-150 ease-out flex items-center justify-center max-w-full max-h-full cursor-grab active:cursor-grabbing"
                    style={{
                        transform: `scale(${scale}) rotate(${rotation}deg)`,
                    }}
                >
                    <img
                        src={imageUrl}
                        alt={fileName}
                        className="max-h-[82vh] max-w-[90vw] object-contain rounded-lg shadow-2xl pointer-events-auto"
                        draggable={false}
                    />
                </div>
            </div>

            {/* Bottom Keyboard shortcuts tip */}
            <div className="text-center text-[11px] text-white/40 pb-1">
                Use <kbd className="px-1 py-0.5 bg-white/10 rounded">+</kbd> /{" "}
                <kbd className="px-1 py-0.5 bg-white/10 rounded">-</kbd> para
                zoom, <kbd className="px-1 py-0.5 bg-white/10 rounded">0</kbd>{" "}
                para redefinir e{" "}
                <kbd className="px-1 py-0.5 bg-white/10 rounded">Esc</kbd> para
                fechar
            </div>
        </div>
    )
}
