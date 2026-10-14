import {
    LuCheck,
    LuCopy,
    LuInfo,
    LuPhone,
    LuRefreshCw,
    LuShieldCheck,
    LuUser,
} from "react-icons/lu"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog"
import { WhatsAppService } from "../../services/whatsapp-service"
import { formatPhoneNumber } from "../../lib/format-sender"
import { Account, UserProfile } from "../../types"
import { ChatAvatar } from "../chat/chat-avatar"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"

interface ProfileModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    account: Account | null
}

export function ProfileModal({
    open,
    onOpenChange,
    account,
}: ProfileModalProps) {
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [copiedField, setCopiedField] = useState<string | null>(null)

    const fetchProfile = useCallback(async () => {
        if (!account) return
        setIsLoading(true)
        try {
            const data = await WhatsAppService.getUserProfile(account.id)
            setProfile(data)
        } catch (error) {
            console.error("Erro ao carregar perfil:", error)
            // Fallback usando dados existentes na conta
            setProfile({
                jid: account.phone
                    ? `${account.phone}@s.whatsapp.net`
                    : `${account.id}@s.whatsapp.net`,
                phone: account.phone,
                name: account.pushName || account.name,
                status: account.statusText,
                avatarUrl: account.avatarUrl,
            })
        } finally {
            setIsLoading(false)
        }
    }, [account])

    useEffect(() => {
        if (open && account) {
            fetchProfile()
        }
    }, [open, account, fetchProfile])

    if (!account) return null

    const handleCopy = async (text: string, label: string) => {
        await navigator.clipboard.writeText(text)
        setCopiedField(label)
        toast.success(`${label} copiado para a área de transferência!`)
        setTimeout(() => setCopiedField(null), 2000)
    }

    const displayName = profile?.name || account.pushName || account.name
    const rawNumber = profile?.phone || account.phone
    const formattedPhone = rawNumber
        ? formatPhoneNumber(rawNumber)
        : "Não identificado"
    const userStatus =
        profile?.status || account.statusText || "Olá! Estou usando o WhatsApp."
    const userJid =
        profile?.jid || (rawNumber ? `${rawNumber}@s.whatsapp.net` : "N/A")

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden flex flex-col max-h-[85vh] bg-card border-border">
                {/* Header com Avatar e Nome */}
                <DialogHeader className="p-6 pb-4 bg-muted/20 border-b border-border">
                    <div className="flex flex-col items-center text-center gap-3">
                        <div className="relative group">
                            <ChatAvatar
                                jid={userJid}
                                name={displayName}
                                sizeClassName="w-24 h-24 shadow-md ring-4 ring-primary/20"
                                textClassName="text-3xl font-bold"
                            />
                            {isLoading && (
                                <div className="absolute inset-0 bg-background/60 rounded-full flex items-center justify-center backdrop-blur-xs">
                                    <LuRefreshCw className="h-6 w-6 text-primary animate-spin" />
                                </div>
                            )}
                        </div>

                        <div className="min-w-0">
                            <DialogTitle className="text-xl font-bold text-foreground truncate">
                                {displayName}
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground font-mono mt-0.5">
                                {formattedPhone}
                            </DialogDescription>
                        </div>

                        <div className="flex items-center gap-2 mt-1">
                            <Badge
                                variant={
                                    account.status === "connected"
                                        ? "default"
                                        : "secondary"
                                }
                                className={`text-[11px] gap-1 px-2.5 py-0.5 ${
                                    account.status === "connected"
                                        ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30"
                                        : ""
                                }`}
                            >
                                <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                        account.status === "connected"
                                            ? "bg-emerald-500"
                                            : "bg-muted-foreground"
                                    }`}
                                />
                                {account.status === "connected"
                                    ? "Conectado"
                                    : "Desconectado"}
                            </Badge>
                            <Badge
                                variant="outline"
                                className="text-[11px] text-muted-foreground"
                            >
                                Sessão: {account.name}
                            </Badge>
                        </div>
                    </div>
                </DialogHeader>

                {/* Conteúdo com Dados Cadastrais */}
                <div className="p-6 space-y-4 overflow-y-auto">
                    {/* Recado / Status */}
                    <div className="bg-muted/40 p-3.5 rounded-xl border border-border/60">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                                <LuInfo className="h-3.5 w-3.5 text-primary" />
                                Recado / Status
                            </span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                onClick={() => handleCopy(userStatus, "Recado")}
                                title="Copiar recado"
                            >
                                {copiedField === "Recado" ? (
                                    <LuCheck className="h-3.5 w-3.5 text-emerald-500" />
                                ) : (
                                    <LuCopy className="h-3.5 w-3.5" />
                                )}
                            </Button>
                        </div>
                        <p className="text-sm text-foreground italic break-words leading-relaxed pl-5">
                            "{userStatus}"
                        </p>
                    </div>

                    {/* Detalhes do Contato */}
                    <div className="space-y-3">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                            Dados Cadastrais da Sessão
                        </span>

                        <div className="grid gap-2 text-xs">
                            {/* Número de Telefone */}
                            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/20 border border-border/40 hover:bg-muted/40 transition-colors">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <LuPhone className="h-4 w-4 text-primary shrink-0" />
                                    <div className="truncate">
                                        <p className="font-medium text-foreground">
                                            Número de Telefone
                                        </p>
                                        <p className="text-muted-foreground font-mono text-[11px]">
                                            {formattedPhone}
                                        </p>
                                    </div>
                                </div>
                                {rawNumber && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
                                        onClick={() =>
                                            handleCopy(rawNumber, "Número")
                                        }
                                        title="Copiar número"
                                    >
                                        {copiedField === "Número" ? (
                                            <LuCheck className="h-3.5 w-3.5 text-emerald-500" />
                                        ) : (
                                            <LuCopy className="h-3.5 w-3.5" />
                                        )}
                                    </Button>
                                )}
                            </div>

                            {/* Nome de Exibição */}
                            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/20 border border-border/40 hover:bg-muted/40 transition-colors">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <LuUser className="h-4 w-4 text-primary shrink-0" />
                                    <div className="truncate">
                                        <p className="font-medium text-foreground">
                                            Nome de Exibição (Push Name)
                                        </p>
                                        <p className="text-muted-foreground text-[11px] truncate">
                                            {displayName}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
                                    onClick={() =>
                                        handleCopy(
                                            displayName,
                                            "Nome de exibição",
                                        )
                                    }
                                    title="Copiar nome"
                                >
                                    {copiedField === "Nome de exibição" ? (
                                        <LuCheck className="h-3.5 w-3.5 text-emerald-500" />
                                    ) : (
                                        <LuCopy className="h-3.5 w-3.5" />
                                    )}
                                </Button>
                            </div>

                            {/* Identificador JID */}
                            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/20 border border-border/40 hover:bg-muted/40 transition-colors">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <LuShieldCheck className="h-4 w-4 text-primary shrink-0" />
                                    <div className="truncate">
                                        <p className="font-medium text-foreground">
                                            WhatsApp JID Oficial
                                        </p>
                                        <p className="text-muted-foreground font-mono text-[11px] truncate">
                                            {userJid}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
                                    onClick={() => handleCopy(userJid, "JID")}
                                    title="Copiar JID"
                                >
                                    {copiedField === "JID" ? (
                                        <LuCheck className="h-3.5 w-3.5 text-emerald-500" />
                                    ) : (
                                        <LuCopy className="h-3.5 w-3.5" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer com Ações */}
                <div className="p-4 bg-muted/20 border-t border-border flex items-center justify-between">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={isLoading}
                        onClick={fetchProfile}
                        className="text-xs gap-1.5"
                    >
                        <LuRefreshCw
                            className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
                        />
                        Atualizar Dados
                    </Button>
                    <Button
                        variant="default"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                        className="text-xs"
                    >
                        Fechar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
