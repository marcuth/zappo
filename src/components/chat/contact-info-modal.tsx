import {
    LuCalendar,
    LuCopy,
    LuMessageSquare,
    LuPhone,
    LuShieldCheck,
    LuUser,
} from "react-icons/lu"
import { toast } from "sonner"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog"
import { formatPhoneNumber } from "../../lib/format-sender"
import { Separator } from "../ui/separator"
import { ChatAvatar } from "./chat-avatar"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Chat } from "../../types"

interface ContactInfoModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    chat: Chat
    onStartDirectChat?: (phone: string, name?: string) => void
}

export function ContactInfoModal({
    open,
    onOpenChange,
    chat,
    onStartDirectChat,
}: ContactInfoModalProps) {
    const rawNumber = chat.phoneNumber || chat.jid.split("@")[0].split(":")[0]
    const formattedPhone = formatPhoneNumber(chat.phoneNumber || chat.jid)

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text)
        toast.success(`${label} copiado para a área de transferência!`)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden flex flex-col max-h-[85vh]">
                <DialogHeader className="p-6 pb-4 bg-muted/30">
                    <div className="flex flex-col items-center text-center gap-3">
                        <ChatAvatar
                            jid={chat.jid}
                            name={chat.name}
                            sizeClassName="w-20 h-20 shadow-md ring-2 ring-background"
                            textClassName="text-2xl font-bold"
                        />
                        <div className="min-w-0">
                            <DialogTitle className="text-lg font-bold text-foreground truncate">
                                {chat.name}
                            </DialogTitle>
                            {formattedPhone && formattedPhone !== chat.name && (
                                <DialogDescription className="text-xs text-muted-foreground font-mono mt-0.5">
                                    {formattedPhone}
                                </DialogDescription>
                            )}
                        </div>

                        <div className="flex items-center gap-2 mt-1">
                            <Badge
                                variant="secondary"
                                className="text-[10px] gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                            >
                                <LuShieldCheck className="h-3 w-3" />
                                Criptografia E2EE (Rust)
                            </Badge>
                        </div>
                    </div>
                </DialogHeader>

                <Separator />

                <div className="p-5 space-y-4 overflow-y-auto">
                    {/* Número de Telefone */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/70 hover:bg-muted/40 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                <LuPhone className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider block">
                                    Telefone / WhatsApp
                                </span>
                                <span className="text-xs font-mono font-medium text-foreground truncate block">
                                    {formattedPhone || `+${rawNumber}`}
                                </span>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
                            onClick={() =>
                                handleCopy(
                                    formattedPhone || rawNumber,
                                    "Número de telefone",
                                )
                            }
                            title="Copiar telefone"
                        >
                            <LuCopy className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Identificador JID */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/70 hover:bg-muted/40 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-muted text-muted-foreground flex items-center justify-center shrink-0">
                                <LuUser className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider block">
                                    JID Oficial
                                </span>
                                <span className="text-xs font-mono text-muted-foreground truncate block">
                                    {chat.jid}
                                </span>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
                            onClick={() => handleCopy(chat.jid, "JID")}
                            title="Copiar JID"
                        >
                            <LuCopy className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Informações da conversa */}
                    <div className="p-3 rounded-xl bg-muted/20 border border-border/60 text-xs space-y-2">
                        <div className="flex items-center justify-between text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <LuCalendar className="w-3.5 h-3.5" />
                                <span>Última interação</span>
                            </div>
                            <span className="font-mono text-[11px] text-foreground">
                                {new Date(chat.updatedAt).toLocaleDateString(
                                    [],
                                    {
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    },
                                )}
                            </span>
                        </div>
                    </div>
                </div>

                <Separator />

                <div className="p-3 bg-muted/20 flex items-center gap-2">
                    <Button
                        variant="default"
                        size="sm"
                        className="w-full text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={() => {
                            if (onStartDirectChat) {
                                onStartDirectChat(rawNumber, chat.name)
                            }
                            onOpenChange(false)
                        }}
                    >
                        <LuMessageSquare className="h-3.5 w-3.5" />
                        <span>Conversar Agora</span>
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
