import {
    LuDownload,
    LuExternalLink,
    LuFileText,
    LuFolderOpen,
    LuX,
} from "react-icons/lu"
import { openPath, revealItemInDir } from "@tauri-apps/plugin-opener"
import { useEffect } from "react"

import { Button } from "../ui/button"
import { Badge } from "../ui/badge"

interface PdfViewerModalProps {
    isOpen: boolean
    pdfUrl: string | null
    localPath?: string
    fileName?: string
    fileSize?: number
    onClose: () => void
}

export function PdfViewerModal({
    isOpen,
    pdfUrl,
    localPath,
    fileName = "Documento.pdf",
    fileSize,
    onClose,
}: PdfViewerModalProps) {
    useEffect(() => {
        if (isOpen) {
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === "Escape") onClose()
            }
            window.addEventListener("keydown", handleKeyDown)
            return () => window.removeEventListener("keydown", handleKeyDown)
        }
    }, [isOpen, onClose])

    if (!isOpen || !pdfUrl) return null

    const formatBytes = (bytes?: number) => {
        if (!bytes || bytes === 0) return ""
        const k = 1024
        const sizes = ["B", "KB", "MB", "GB"]
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
    }

    const handleOpenExternal = async () => {
        if (!localPath) return
        try {
            await openPath(localPath)
        } catch (err) {
            console.error("Falha ao abrir arquivo externamente:", err)
        }
    }

    const handleRevealInDir = async () => {
        if (!localPath) return
        try {
            await revealItemInDir(localPath)
        } catch (err) {
            console.error("Falha ao revelar arquivo na pasta:", err)
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 select-none animate-in fade-in duration-200"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose()
            }}
        >
            <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden">
                {/* Header Toolbar */}
                <div className="px-5 py-3 border-b border-border flex items-center justify-between bg-muted/40 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-red-500/15 border border-red-500/25 flex items-center justify-center shrink-0 text-red-500">
                            <LuFileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-semibold truncate text-foreground">
                                    {fileName}
                                </h3>
                                <Badge
                                    variant="outline"
                                    className="text-[10px] py-0 px-1.5 h-4 text-red-500 border-red-500/30"
                                >
                                    PDF
                                </Badge>
                            </div>
                            {fileSize && (
                                <p className="text-[11px] text-muted-foreground font-mono">
                                    {formatBytes(fileSize)}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                        {localPath && (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs gap-1.5 border-border hover:bg-muted"
                                    onClick={handleOpenExternal}
                                    title="Abrir no leitor de PDF padrão do Windows"
                                >
                                    <LuExternalLink className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">
                                        Abrir no Sistema
                                    </span>
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs gap-1.5 border-border hover:bg-muted"
                                    onClick={handleRevealInDir}
                                    title="Mostrar na pasta do Windows Explorer"
                                >
                                    <LuFolderOpen className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">
                                        Mostrar na Pasta
                                    </span>
                                </Button>
                            </>
                        )}

                        <a
                            href={pdfUrl}
                            download={fileName}
                            className="inline-flex items-center justify-center h-8 px-2.5 rounded-lg text-xs font-medium border border-border hover:bg-muted transition-colors gap-1.5 text-foreground"
                            title="Baixar arquivo"
                        >
                            <LuDownload className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Baixar</span>
                        </a>

                        <div className="h-4 w-px bg-border mx-1" />

                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                            onClick={onClose}
                            title="Fechar (Esc)"
                        >
                            <LuX className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* PDF Embedded Frame */}
                <div className="flex-1 bg-black/60 relative overflow-hidden">
                    <iframe
                        src={`${pdfUrl}#toolbar=1&navpanes=1`}
                        title={fileName}
                        className="w-full h-full border-0"
                    />
                </div>
            </div>
        </div>
    )
}
