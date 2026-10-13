import {
    LuDatabase,
    LuHardDrive,
    LuRefreshCw,
    LuSparkles,
    LuTrash2,
} from "react-icons/lu"
import { useEffect, useState } from "react"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog"
import { useAccount } from "../providers/account-provider"
import { Spinner } from "../ui/spinner"
import { Button } from "../ui/button"

interface StorageModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function StorageModal({ open, onOpenChange }: StorageModalProps) {
    const {
        storageStats,
        refreshStorageStats,
        clearMediaCache,
        clearChatCache,
        vacuumDatabase,
        clearAllCache,
    } = useAccount()

    const [isCleaning, setIsCleaning] = useState(false)

    useEffect(() => {
        if (open) {
            refreshStorageStats()
        }
    }, [open, refreshStorageStats])

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return "0 B"
        const k = 1024
        const sizes = ["B", "KB", "MB", "GB"]
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
    }

    const handleAction = async (action: () => Promise<void>) => {
        try {
            setIsCleaning(true)
            await action()
        } finally {
            setIsCleaning(false)
        }
    }

    if (!storageStats) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-base">
                        <LuHardDrive className="h-5 w-5 text-primary" />
                        <span>Gerenciador de Armazenamento e Cache</span>
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                        Libere espaço em disco instantaneamente sem perder seu
                        histórico de conversas.
                    </DialogDescription>
                </DialogHeader>

                {/* Storage Overview Meter */}
                <div className="p-4 rounded-xl bg-card border border-border space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-[11px] text-muted-foreground">
                                Armazenamento Total Ocupado
                            </span>
                            <h3 className="text-xl font-bold tracking-tight text-foreground font-mono">
                                {formatBytes(storageStats.totalSizeBytes)}
                            </h3>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs gap-1.5"
                            onClick={() => refreshStorageStats()}
                            disabled={isCleaning}
                        >
                            {isCleaning ? (
                                <Spinner className="size-3.5" />
                            ) : (
                                <LuRefreshCw className="h-3.5 w-3.5" />
                            )}
                            <span>Atualizar</span>
                        </Button>
                    </div>

                    {/* Multi-segment storage bar */}
                    <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden flex">
                        <div
                            style={{
                                width: `${Math.min(
                                    100,
                                    (storageStats.images.sizeBytes /
                                        storageStats.totalSizeBytes) *
                                        100,
                                )}%`,
                            }}
                            className="bg-emerald-500 transition-all"
                            title="Imagens"
                        />
                        <div
                            style={{
                                width: `${Math.min(
                                    100,
                                    (storageStats.videos.sizeBytes /
                                        storageStats.totalSizeBytes) *
                                        100,
                                )}%`,
                            }}
                            className="bg-blue-500 transition-all"
                            title="Vídeos"
                        />
                        <div
                            style={{
                                width: `${Math.min(
                                    100,
                                    (storageStats.audio.sizeBytes /
                                        storageStats.totalSizeBytes) *
                                        100,
                                )}%`,
                            }}
                            className="bg-amber-500 transition-all"
                            title="Áudios"
                        />
                        <div
                            style={{
                                width: `${Math.min(
                                    100,
                                    (storageStats.documents.sizeBytes /
                                        storageStats.totalSizeBytes) *
                                        100,
                                )}%`,
                            }}
                            className="bg-purple-500 transition-all"
                            title="Documentos"
                        />
                        <div
                            style={{
                                width: `${Math.min(
                                    100,
                                    (storageStats.databaseSizeBytes /
                                        storageStats.totalSizeBytes) *
                                        100,
                                )}%`,
                            }}
                            className="bg-slate-500 transition-all"
                            title="Banco SQLite"
                        />
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground pt-1">
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            Fotos ({formatBytes(storageStats.images.sizeBytes)})
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                            Vídeos ({formatBytes(storageStats.videos.sizeBytes)}
                            )
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            Áudios ({formatBytes(storageStats.audio.sizeBytes)})
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-purple-500" />
                            Docs (
                            {formatBytes(storageStats.documents.sizeBytes)})
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-slate-500" />
                            Banco ({formatBytes(storageStats.databaseSizeBytes)}
                            )
                        </span>
                    </div>
                </div>

                {/* Quick Cleanup Actions */}
                <div className="space-y-2.5">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Ações de Limpeza de Cache
                    </h4>

                    <div className="grid grid-cols-2 gap-2.5">
                        <Button
                            variant="outline"
                            className="h-auto py-2.5 px-3 flex flex-col items-start gap-1 text-left justify-start border-border/80 hover:bg-muted/50"
                            onClick={() =>
                                handleAction(() => clearMediaCache())
                            }
                            disabled={isCleaning}
                        >
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                                <LuTrash2 className="h-3.5 w-3.5 text-destructive" />
                                <span>Limpar Todas as Mídias</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground leading-tight">
                                Remove arquivos baixados; mensagens e textos
                                continuam intactos.
                            </span>
                        </Button>

                        <Button
                            variant="outline"
                            className="h-auto py-2.5 px-3 flex flex-col items-start gap-1 text-left justify-start border-border/80 hover:bg-muted/50"
                            onClick={() =>
                                handleAction(() =>
                                    clearMediaCache(undefined, 30),
                                )
                            }
                            disabled={isCleaning}
                        >
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                                <LuSparkles className="h-3.5 w-3.5 text-amber-500" />
                                <span>Mídias &gt; 30 Dias</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground leading-tight">
                                Exclui fotos e vídeos com mais de 1 mês de
                                antiguidade.
                            </span>
                        </Button>

                        <Button
                            variant="outline"
                            className="h-auto py-2.5 px-3 flex flex-col items-start gap-1 text-left justify-start border-border/80 hover:bg-muted/50"
                            onClick={() => handleAction(vacuumDatabase)}
                            disabled={isCleaning}
                        >
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                                <LuDatabase className="h-3.5 w-3.5 text-blue-500" />
                                <span>Otimizar SQLite (VACUUM)</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground leading-tight">
                                Compacta páginas livres do banco e desfragmenta
                                índices.
                            </span>
                        </Button>

                        <Button
                            variant="outline"
                            className="h-auto py-2.5 px-3 flex flex-col items-start gap-1 text-left justify-start border-border/80 hover:bg-muted/50"
                            onClick={() => handleAction(clearAllCache)}
                            disabled={isCleaning}
                        >
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-destructive">
                                <LuTrash2 className="h-3.5 w-3.5" />
                                <span>Limpar Todo o Cache</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground leading-tight">
                                Libera mídias e arquivos temporários da
                                aplicação.
                            </span>
                        </Button>
                    </div>
                </div>

                {/* Per-Chat Usage (Top Chats) */}
                <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Conversas Mais Pesadas
                    </h4>

                    <div className="divide-y divide-border/60 rounded-xl border border-border overflow-hidden bg-card/40">
                        {storageStats.topChats.map((chat) => (
                            <div
                                key={chat.chatJid}
                                className="p-3 flex items-center justify-between gap-3 text-xs"
                            >
                                <div className="min-w-0">
                                    <h5 className="font-semibold text-foreground truncate">
                                        {chat.chatName}
                                    </h5>
                                    <span className="text-[11px] text-muted-foreground">
                                        {chat.mediaCount} arquivos •{" "}
                                        <span className="font-mono text-primary font-medium">
                                            {formatBytes(chat.sizeBytes)}
                                        </span>
                                    </span>
                                </div>

                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
                                    onClick={() =>
                                        handleAction(() =>
                                            clearChatCache(chat.chatJid),
                                        )
                                    }
                                    disabled={isCleaning}
                                >
                                    Limpar Mídias
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
