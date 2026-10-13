import {
    LuCheckCheck,
    LuClock,
    LuCopy,
    LuFileText,
    LuHash,
    LuKey,
    LuMessageSquare,
    LuShieldCheck,
    LuUser,
    LuX,
} from "react-icons/lu"
import { useState } from "react"

import { Message } from "../../types"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"

interface MessageInfoModalProps {
    message: Message | null
    isOpen: boolean
    onClose: () => void
}

function CopyableField({
    label,
    value,
    mono = true,
}: {
    label: string
    value: string | undefined | null
    mono?: boolean
}) {
    const [copied, setCopied] = useState(false)

    if (!value) return null

    const handleCopy = async () => {
        await navigator.clipboard.writeText(value)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
    }

    return (
        <div className="group flex items-start justify-between gap-2 py-2 border-b border-border/40 last:border-0">
            <div className="min-w-0 flex-1">
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-0.5">
                    {label}
                </p>
                <p
                    className={`text-xs text-foreground break-all leading-relaxed ${mono ? "font-mono" : ""}`}
                >
                    {value}
                </p>
            </div>
            <button
                onClick={handleCopy}
                title="Copiar valor"
                className="shrink-0 mt-0.5 p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors opacity-0 group-hover:opacity-100"
            >
                {copied ? (
                    <LuCheckCheck className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                    <LuCopy className="w-3.5 h-3.5" />
                )}
            </button>
        </div>
    )
}

function SectionHeader({
    icon: Icon,
    title,
}: {
    icon: React.ElementType
    title: string
}) {
    return (
        <div className="flex items-center gap-2 mb-2 mt-4 first:mt-0">
            <Icon className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">
                {title}
            </span>
        </div>
    )
}

const STATUS_LABELS: Record<string, string> = {
    pending: "Pendente",
    sent: "Enviado",
    delivered: "Entregue",
    read: "Lido",
    failed: "Falhou",
}

const STATUS_COLORS: Record<string, string> = {
    pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    sent: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    delivered: "bg-sky-500/15 text-sky-400 border-sky-500/30",
    read: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    failed: "bg-red-500/15 text-red-400 border-red-500/30",
}

const MEDIA_TYPE_LABELS: Record<string, string> = {
    image: "Imagem",
    video: "Vídeo",
    audio: "Áudio",
    voice: "Mensagem de Voz",
    document: "Documento",
    sticker: "Figurinha",
}

export function MessageInfoModal({
    message,
    isOpen,
    onClose,
}: MessageInfoModalProps) {
    if (!isOpen || !message) return null

    const timestamp = new Date(message.timestamp)
    const formattedDate = timestamp.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    })
    const formattedTime = timestamp.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    })

    const formatBytes = (bytes: number) => {
        if (!bytes || bytes === 0) return "0 B"
        const k = 1024
        const sizes = ["B", "KB", "MB", "GB"]
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-md bg-card border border-border/80 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border/60 bg-gradient-to-r from-primary/5 to-transparent shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                            <LuMessageSquare className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-foreground">
                                Dados da Mensagem
                            </h2>
                            <p className="text-[11px] text-muted-foreground">
                                Metadados técnicos detalhados
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    >
                        <LuX className="w-4 h-4" />
                    </Button>
                </div>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-thin space-y-0">
                    {/* Identificação */}
                    <SectionHeader icon={LuHash} title="Identificação" />
                    <div className="bg-muted/30 rounded-xl px-3 py-1">
                        <CopyableField
                            label="ID da Mensagem"
                            value={message.id}
                        />
                        <CopyableField
                            label="Chat JID"
                            value={message.chatJid}
                        />
                    </div>

                    {/* Remetente */}
                    <SectionHeader icon={LuUser} title="Remetente" />
                    <div className="bg-muted/30 rounded-xl px-3 py-1">
                        <div className="flex items-start justify-between gap-2 py-2 border-b border-border/40">
                            <div>
                                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-0.5">
                                    Direção
                                </p>
                                <Badge
                                    className={`text-[10px] px-2 py-0 h-5 border ${
                                        message.fromMe
                                            ? "bg-primary/15 text-primary border-primary/30"
                                            : "bg-muted text-muted-foreground border-border"
                                    }`}
                                >
                                    {message.fromMe
                                        ? "Enviada por mim"
                                        : "Recebida"}
                                </Badge>
                            </div>
                        </div>
                        {message.senderName && (
                            <CopyableField
                                label="Nome do Remetente"
                                value={message.senderName}
                                mono={false}
                            />
                        )}
                        {message.senderJid && (
                            <CopyableField
                                label="JID do Remetente"
                                value={message.senderJid}
                            />
                        )}
                    </div>

                    {/* Tempo & Status */}
                    <SectionHeader icon={LuClock} title="Tempo & Status" />
                    <div className="bg-muted/30 rounded-xl px-3 py-1">
                        <div className="py-2 border-b border-border/40">
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-0.5">
                                Data e Hora
                            </p>
                            <p className="text-xs text-foreground font-mono">
                                {formattedDate} às {formattedTime}
                            </p>
                        </div>
                        <div className="py-2 border-b border-border/40">
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-0.5">
                                Timestamp Unix (ms)
                            </p>
                            <p className="text-xs text-foreground font-mono">
                                {message.timestamp}
                            </p>
                        </div>
                        <div className="py-2">
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-1">
                                Status de Entrega
                            </p>
                            <Badge
                                className={`text-[10px] px-2 py-0 h-5 border ${STATUS_COLORS[message.status] ?? "bg-muted text-muted-foreground border-border"}`}
                            >
                                {STATUS_LABELS[message.status] ??
                                    message.status}
                            </Badge>
                        </div>
                    </div>

                    {/* Conteúdo */}
                    {message.text && (
                        <>
                            <SectionHeader
                                icon={LuMessageSquare}
                                title="Conteúdo de Texto"
                            />
                            <div className="bg-muted/30 rounded-xl px-3 py-1">
                                <div className="py-2">
                                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-0.5">
                                        Comprimento
                                    </p>
                                    <p className="text-xs text-foreground font-mono">
                                        {message.text.length} caracteres •{" "}
                                        {
                                            message.text
                                                .trim()
                                                .split(/\s+/)
                                                .filter(Boolean).length
                                        }{" "}
                                        palavras
                                    </p>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Mídia */}
                    {message.media && (
                        <>
                            <SectionHeader
                                icon={LuFileText}
                                title="Mídia Anexada"
                            />
                            <div className="bg-muted/30 rounded-xl px-3 py-1">
                                <div className="py-2 border-b border-border/40">
                                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-0.5">
                                        Tipo
                                    </p>
                                    <p className="text-xs text-foreground">
                                        {MEDIA_TYPE_LABELS[
                                            message.media.mediaType
                                        ] ?? message.media.mediaType}
                                    </p>
                                </div>
                                <CopyableField
                                    label="ID da Mídia"
                                    value={message.media.id}
                                />
                                <CopyableField
                                    label="Nome do Arquivo"
                                    value={message.media.fileName}
                                    mono={false}
                                />
                                <div className="py-2 border-b border-border/40">
                                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-0.5">
                                        Tamanho
                                    </p>
                                    <p className="text-xs text-foreground font-mono">
                                        {formatBytes(message.media.fileSize)} (
                                        {message.media.fileSize.toLocaleString(
                                            "pt-BR",
                                        )}{" "}
                                        bytes)
                                    </p>
                                </div>
                                <CopyableField
                                    label="MIME Type"
                                    value={message.media.mimeType}
                                />
                                <CopyableField
                                    label="Caminho Local"
                                    value={message.media.localPath}
                                />
                                <div className="py-2 border-b border-border/40 last:border-0">
                                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-0.5">
                                        Status de Download
                                    </p>
                                    <Badge
                                        className={`text-[10px] px-2 py-0 h-5 border ${
                                            message.media.isDownloaded
                                                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                                : "bg-yellow-500/15 text-yellow-400 border-yellow-500/30"
                                        }`}
                                    >
                                        {message.media.isDownloaded
                                            ? "Baixado"
                                            : "Não baixado"}
                                    </Badge>
                                </div>
                            </div>

                            {/* Criptografia */}
                            {(message.media.mediaKey ||
                                message.media.fileSha256 ||
                                message.media.fileEncSha256 ||
                                message.media.directPath) && (
                                <>
                                    <SectionHeader
                                        icon={LuKey}
                                        title="Criptografia & Integridade"
                                    />
                                    <div className="bg-muted/30 rounded-xl px-3 py-1">
                                        <CopyableField
                                            label="Media Key (base64)"
                                            value={message.media.mediaKey}
                                        />
                                        <CopyableField
                                            label="SHA-256 do Arquivo"
                                            value={message.media.fileSha256}
                                        />
                                        <CopyableField
                                            label="SHA-256 Cifrado"
                                            value={message.media.fileEncSha256}
                                        />
                                        <CopyableField
                                            label="Direct Path"
                                            value={message.media.directPath}
                                        />
                                    </div>
                                </>
                            )}
                        </>
                    )}

                    {/* Resposta citada */}
                    {message.replyTo && (
                        <>
                            <SectionHeader
                                icon={LuCheckCheck}
                                title="Mensagem Citada"
                            />
                            <div className="bg-muted/30 rounded-xl px-3 py-1">
                                <CopyableField
                                    label="ID da Mensagem Citada"
                                    value={message.replyTo.id}
                                />
                                <CopyableField
                                    label="Remetente Citado"
                                    value={message.replyTo.senderName}
                                    mono={false}
                                />
                                <CopyableField
                                    label="Texto Citado"
                                    value={message.replyTo.text}
                                    mono={false}
                                />
                            </div>
                        </>
                    )}

                    {/* Segurança */}
                    <SectionHeader icon={LuShieldCheck} title="Segurança" />
                    <div className="bg-muted/30 rounded-xl px-3 py-1">
                        <div className="py-2">
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-1">
                                Protocolo de Criptografia
                            </p>
                            <div className="flex items-center gap-1.5">
                                <LuShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                                <p className="text-xs text-foreground">
                                    Signal Protocol (E2EE) — Rust Native
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Spacer */}
                    <div className="h-2" />
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-border/60 bg-muted/20 shrink-0">
                    <Button
                        onClick={onClose}
                        className="w-full h-9 text-xs rounded-xl"
                        variant="secondary"
                    >
                        Fechar
                    </Button>
                </div>
            </div>
        </div>
    )
}
