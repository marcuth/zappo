import { LuMessageSquarePlus, LuPhone, LuUser } from "react-icons/lu"
import { useState } from "react"
import { toast } from "sonner"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog"
import { useAccount } from "../providers/account-provider"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"

interface NewChatModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function NewChatModal({ open, onOpenChange }: NewChatModalProps) {
    const { startChat } = useAccount()
    const [phoneNumber, setPhoneNumber] = useState("")
    const [contactName, setContactName] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const digitsOnly = phoneNumber.replace(/\D/g, "")
        if (digitsOnly.length < 8) {
            toast.error("Informe um número de telefone válido com DDI e DDD.")
            return
        }

        try {
            setIsSubmitting(true)
            const chat = await startChat(
                digitsOnly,
                contactName.trim() || undefined,
            )
            if (chat) {
                setPhoneNumber("")
                setContactName("")
                onOpenChange(false)
            }
        } catch (error) {
            console.error("Erro ao iniciar conversa:", error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <LuMessageSquarePlus className="w-5 h-5 text-emerald-500" />
                            Nova Conversa
                        </DialogTitle>
                        <DialogDescription>
                            Inicie uma conversa direta com qualquer número de
                            telefone, mesmo sem ter o contato salvo.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label
                                htmlFor="new-chat-phone"
                                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                            >
                                Número de Telefone (com DDI e DDD)
                            </Label>
                            <div className="relative">
                                <LuPhone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="new-chat-phone"
                                    placeholder="Ex: 55 11 99999-8888"
                                    value={phoneNumber}
                                    onChange={(e) =>
                                        setPhoneNumber(e.target.value)
                                    }
                                    className="pl-9 font-mono"
                                    autoFocus
                                    required
                                />
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                Dica: Para o Brasil, inclua o código 55 seguido
                                do DDD e número (ex: 5511999998888).
                            </p>
                        </div>

                        <div className="grid gap-2">
                            <Label
                                htmlFor="new-chat-name"
                                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                            >
                                Nome ou Apelido (Opcional)
                            </Label>
                            <div className="relative">
                                <LuUser className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="new-chat-name"
                                    placeholder="Ex: João da Silva / Suporte"
                                    value={contactName}
                                    onChange={(e) =>
                                        setContactName(e.target.value)
                                    }
                                    className="pl-9"
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium gap-2"
                            disabled={isSubmitting || !phoneNumber.trim()}
                        >
                            <LuMessageSquarePlus className="w-4 h-4" />
                            {isSubmitting ? "Iniciando..." : "Iniciar Conversa"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
