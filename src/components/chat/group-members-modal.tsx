import {
    LuBell,
    LuBellOff,
    LuCheck,
    LuCopy,
    LuCrown,
    LuEllipsisVertical,
    LuLink,
    LuLogOut,
    LuMessageSquare,
    LuRefreshCw,
    LuShieldCheck,
    LuUserPlus,
} from "react-icons/lu"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog"
import { WhatsAppService } from "../../services/whatsapp-service"
import { AddParticipantModal } from "./add-participant-modal"
import { formatPhoneNumber } from "../../lib/format-sender"
import { useAccount } from "../providers/account-provider"
import { Chat, GroupParticipant } from "../../types"
import { ScrollArea } from "../ui/scroll-area"
import { Separator } from "../ui/separator"
import { ChatAvatar } from "./chat-avatar"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"

interface GroupMembersModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    chat: Chat
    accountId: string
    onLeaveGroupSuccess?: () => void
}

export function GroupMembersModal({
    open,
    onOpenChange,
    chat,
    accountId,
    onLeaveGroupSuccess,
}: GroupMembersModalProps) {
    const { startChat } = useAccount()
    const [participants, setParticipants] = useState<GroupParticipant[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [isLeaving, setIsLeaving] = useState(false)
    const [isMuting, setIsMuting] = useState(false)
    const [inviteLink, setInviteLink] = useState<string | null>(null)
    const [isLoadingLink, setIsLoadingLink] = useState(false)
    const [hasCopiedLink, setHasCopiedLink] = useState(false)

    const handleFetchInviteLink = async (reset = false) => {
        setIsLoadingLink(true)
        try {
            const link = await WhatsAppService.getGroupInviteLink(
                chat.jid,
                reset,
            )
            setInviteLink(link)
            if (reset) {
                toast.success(
                    "Link de convite do grupo redefinido com sucesso!",
                )
            }
        } catch (error) {
            console.error("Erro ao obter link de convite:", error)
            toast.error(
                typeof error === "string"
                    ? error
                    : "Falha ao obter link de convite. Você precisa ser administrador do grupo.",
            )
        } finally {
            setIsLoadingLink(false)
        }
    }

    const handleCopyInviteLink = async () => {
        if (!inviteLink) return
        await navigator.clipboard.writeText(inviteLink)
        setHasCopiedLink(true)
        toast.success("Link de convite copiado para a área de transferência!")
        setTimeout(() => setHasCopiedLink(false), 2000)
    }

    const fetchMembers = useCallback(async () => {
        setIsLoading(true)
        try {
            const list = await WhatsAppService.getGroupMembers(chat.jid)
            setParticipants(list)
        } catch (error) {
            console.error("Erro ao carregar participantes:", error)
            toast.error(
                "Não foi possível carregar a lista de membros do grupo.",
            )
        } finally {
            setIsLoading(false)
        }
    }, [chat.jid])

    useEffect(() => {
        if (open && chat.isGroup) {
            fetchMembers()
        }
    }, [open, chat.isGroup, fetchMembers])

    const handleLeaveGroup = async () => {
        if (
            !window.confirm(
                `Deseja realmente sair do grupo "${chat.name}"? Você deixará de receber mensagens.`,
            )
        ) {
            return
        }

        setIsLeaving(true)
        try {
            await WhatsAppService.leaveGroup(accountId, chat.jid)
            toast.success(`Você saiu do grupo "${chat.name}".`)
            onOpenChange(false)
            onLeaveGroupSuccess?.()
        } catch (error) {
            console.error("Erro ao sair do grupo:", error)
            toast.error(
                typeof error === "string" ? error : "Falha ao sair do grupo.",
            )
        } finally {
            setIsLeaving(false)
        }
    }

    const handleToggleMute = async (muteDurationMs?: number) => {
        setIsMuting(true)
        try {
            if (chat.isMuted && !muteDurationMs) {
                await WhatsAppService.unmuteChat(accountId, chat.jid)
                toast.success("Notificações reativadas para este grupo!")
            } else {
                const until = muteDurationMs
                    ? Date.now() + muteDurationMs
                    : undefined
                await WhatsAppService.muteChat(accountId, chat.jid, until)
                toast.success("Grupo silenciado!")
            }
        } catch (error) {
            console.error("Erro ao alterar silenciamento:", error)
            toast.error("Falha ao atualizar silenciamento.")
        } finally {
            setIsMuting(false)
        }
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-md bg-card border-border flex flex-col max-h-[85vh] p-0 overflow-hidden">
                    {/* Header */}
                    <div className="p-5 pb-3">
                        <DialogHeader>
                            <div className="flex items-center gap-3">
                                <ChatAvatar
                                    jid={chat.jid}
                                    name={chat.name}
                                    isGroup
                                    sizeClassName="w-12 h-12"
                                    textClassName="text-sm"
                                />
                                <div className="min-w-0 flex-1">
                                    <DialogTitle className="text-base font-bold text-foreground truncate">
                                        {chat.name}
                                    </DialogTitle>
                                    <DialogDescription className="text-xs text-muted-foreground">
                                        {participants.length > 0
                                            ? `${participants.length} participantes`
                                            : "Carregando participantes..."}
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>

                        {/* Quick Group Action Buttons */}
                        <div className="grid grid-cols-2 gap-2 mt-4">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
                                onClick={() => setIsAddOpen(true)}
                            >
                                <LuUserPlus className="h-3.5 w-3.5" />
                                Adicionar Membro
                            </Button>

                            {chat.isMuted ? (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={isMuting}
                                    className="h-8 text-xs gap-1.5 text-foreground hover:bg-muted"
                                    onClick={() => handleToggleMute()}
                                >
                                    <LuBell className="h-3.5 w-3.5 text-primary" />
                                    Ativar Notificações
                                </Button>
                            ) : (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={isMuting}
                                    className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground hover:bg-muted"
                                    onClick={() => handleToggleMute()}
                                >
                                    <LuBellOff className="h-3.5 w-3.5" />
                                    Silenciar Grupo
                                </Button>
                            )}
                        </div>

                        {/* Mute Options if not muted */}
                        {!chat.isMuted && (
                            <div className="flex items-center gap-1.5 mt-2 justify-center text-[10px] text-muted-foreground">
                                <span>Silenciar por:</span>
                                <button
                                    type="button"
                                    onClick={() =>
                                        handleToggleMute(8 * 60 * 60 * 1000)
                                    }
                                    className="px-1.5 py-0.5 rounded bg-muted hover:bg-muted/80 text-foreground"
                                >
                                    8 Horas
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        handleToggleMute(
                                            7 * 24 * 60 * 60 * 1000,
                                        )
                                    }
                                    className="px-1.5 py-0.5 rounded bg-muted hover:bg-muted/80 text-foreground"
                                >
                                    1 Semana
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleToggleMute()}
                                    className="px-1.5 py-0.5 rounded bg-muted hover:bg-muted/80 text-foreground"
                                >
                                    Sempre
                                </button>
                            </div>
                        )}
                        {/* Invite Link Card */}
                        <div className="mt-3 p-2.5 rounded-lg border border-border bg-muted/40">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                                    <LuLink className="h-3.5 w-3.5 text-primary" />
                                    <span>Link de Convite do Grupo</span>
                                </div>
                                {!inviteLink && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        disabled={isLoadingLink}
                                        onClick={() =>
                                            handleFetchInviteLink(false)
                                        }
                                        className="h-6 px-2 text-[11px] text-primary hover:text-primary hover:bg-primary/10"
                                    >
                                        {isLoadingLink
                                            ? "Gerando..."
                                            : "Gerar Link"}
                                    </Button>
                                )}
                            </div>

                            {inviteLink && (
                                <div className="mt-2 space-y-2">
                                    <div className="flex items-center gap-1.5 bg-background p-1.5 rounded border border-border">
                                        <input
                                            type="text"
                                            readOnly
                                            value={inviteLink}
                                            className="bg-transparent text-[11px] text-muted-foreground flex-1 outline-none select-all truncate px-1"
                                        />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={handleCopyInviteLink}
                                            className="h-6 w-6 text-foreground hover:bg-muted shrink-0"
                                            title="Copiar link"
                                        >
                                            {hasCopiedLink ? (
                                                <LuCheck className="h-3.5 w-3.5 text-emerald-500" />
                                            ) : (
                                                <LuCopy className="h-3.5 w-3.5" />
                                            )}
                                        </Button>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-muted-foreground">
                                            Qualquer pessoa com o link pode
                                            entrar
                                        </span>
                                        <button
                                            type="button"
                                            disabled={isLoadingLink}
                                            onClick={() =>
                                                handleFetchInviteLink(true)
                                            }
                                            className="text-[10px] text-destructive hover:underline disabled:opacity-50"
                                        >
                                            Revogar / Redefinir Link
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <Separator />

                    {/* Participant List */}
                    <div className="flex-1 overflow-hidden px-4 py-2">
                        <div className="flex items-center justify-between py-1 mb-1">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Participantes ({participants.length})
                            </span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                onClick={fetchMembers}
                                disabled={isLoading}
                                title="Atualizar lista"
                            >
                                <LuRefreshCw
                                    className={`h-3 w-3 ${
                                        isLoading ? "animate-spin" : ""
                                    }`}
                                />
                            </Button>
                        </div>

                        <ScrollArea className="h-64 pr-2">
                            {isLoading ? (
                                <div className="py-8 text-center text-xs text-muted-foreground">
                                    Carregando participantes...
                                </div>
                            ) : participants.length === 0 ? (
                                <div className="py-8 text-center text-xs text-muted-foreground">
                                    Nenhum participante listado.
                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    {participants.map((p) => {
                                        const formattedPhone = p.phone
                                            ? formatPhoneNumber(p.phone) ||
                                              `+${p.phone}`
                                            : formatPhoneNumber(p.jid)
                                        const displayName =
                                            p.displayName ||
                                            formattedPhone ||
                                            p.jid.split("@")[0]

                                        return (
                                            <div
                                                key={p.jid}
                                                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <ChatAvatar
                                                        jid={p.jid}
                                                        name={displayName}
                                                        sizeClassName="w-8 h-8"
                                                        textClassName="text-[10px]"
                                                    />
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-xs font-medium text-foreground truncate">
                                                                {displayName}
                                                            </span>
                                                        </div>
                                                        {formattedPhone &&
                                                            formattedPhone !==
                                                                displayName && (
                                                                <span className="text-[10px] text-muted-foreground font-mono truncate block">
                                                                    {
                                                                        formattedPhone
                                                                    }
                                                                </span>
                                                            )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1 shrink-0 ml-2">
                                                    {p.isSuperAdmin ? (
                                                        <Badge
                                                            variant="secondary"
                                                            className="text-[9px] gap-1 px-1.5 py-0 bg-amber-500/10 text-amber-500 border border-amber-500/20"
                                                        >
                                                            <LuCrown className="h-2.5 w-2.5" />
                                                            Criador
                                                        </Badge>
                                                    ) : p.isAdmin ? (
                                                        <Badge
                                                            variant="secondary"
                                                            className="text-[9px] gap-1 px-1.5 py-0 bg-primary/10 text-primary border border-primary/20"
                                                        >
                                                            <LuShieldCheck className="h-2.5 w-2.5" />
                                                            Admin
                                                        </Badge>
                                                    ) : null}

                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger
                                                            asChild
                                                        >
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-md opacity-70 group-hover:opacity-100 transition-opacity"
                                                                title="Opções do participante"
                                                            >
                                                                <LuEllipsisVertical className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent
                                                            align="end"
                                                            className="w-48"
                                                        >
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    const targetPhone =
                                                                        p.phone ||
                                                                        p.jid
                                                                            .split(
                                                                                "@",
                                                                            )[0]
                                                                            .split(
                                                                                ":",
                                                                            )[0]
                                                                    startChat(
                                                                        targetPhone,
                                                                        p.displayName ||
                                                                            undefined,
                                                                    )
                                                                    onOpenChange(
                                                                        false,
                                                                    )
                                                                }}
                                                                className="gap-2 text-xs cursor-pointer"
                                                            >
                                                                <LuMessageSquare className="h-3.5 w-3.5 text-primary" />
                                                                <span>
                                                                    Conversar em
                                                                    particular
                                                                </span>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    const textToCopy =
                                                                        formattedPhone ||
                                                                        p.phone ||
                                                                        p.jid
                                                                    navigator.clipboard.writeText(
                                                                        textToCopy,
                                                                    )
                                                                    toast.success(
                                                                        "Número/ID copiado para a área de transferência!",
                                                                    )
                                                                }}
                                                                className="gap-2 text-xs cursor-pointer"
                                                            >
                                                                <LuCopy className="h-3.5 w-3.5 text-muted-foreground" />
                                                                <span>
                                                                    Copiar
                                                                    número/JID
                                                                </span>
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </ScrollArea>
                    </div>

                    <Separator />

                    {/* Footer with Leave Group */}
                    <div className="p-3 bg-muted/20 flex items-center justify-between">
                        <Button
                            variant="destructive"
                            size="sm"
                            disabled={isLeaving}
                            onClick={handleLeaveGroup}
                            className="text-xs gap-1.5 w-full bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground border border-destructive/20"
                        >
                            <LuLogOut className="h-3.5 w-3.5" />
                            {isLeaving ? "Saindo..." : "Sair do Grupo"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modal para Adicionar Participante */}
            <AddParticipantModal
                open={isAddOpen}
                onOpenChange={setIsAddOpen}
                groupJid={chat.jid}
                onParticipantAdded={fetchMembers}
            />
        </>
    )
}
