import { LuPlus, LuUserPlus } from "react-icons/lu"
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
import { WhatsAppService } from "../../services/whatsapp-service"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"

interface AddParticipantModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    groupJid: string
    onParticipantAdded?: () => void
}

export function AddParticipantModal({
    open,
    onOpenChange,
    groupJid,
    onParticipantAdded,
}: AddParticipantModalProps) {
    const [phoneOrJid, setPhoneOrJid] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        const clean = phoneOrJid.trim()
        if (!clean) {
            toast.error("Informe um número de telefone ou JID")
            return
        }

        setIsLoading(true)
        try {
            await WhatsAppService.addGroupParticipant(groupJid, clean)
            toast.success("Participante adicionado com sucesso!")
            setPhoneOrJid("")
            onOpenChange(false)
            onParticipantAdded?.()
        } catch (error) {
            console.error("Erro ao adicionar participante:", error)
            toast.error(
                typeof error === "string"
                    ? error
                    : "Falha ao adicionar participante ao grupo.",
            )
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-card border-border">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
                        <LuUserPlus className="h-5 w-5 text-primary" />
                        Adicionar Participante
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                        Adicione qualquer pessoa ao grupo diretamente pelo
                        número de telefone (com DDD), mesmo que não esteja salva
                        na sua agenda.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleAdd} className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label
                            htmlFor="phone-input"
                            className="text-xs font-medium"
                        >
                            Número de Telefone ou JID
                        </Label>
                        <Input
                            id="phone-input"
                            placeholder="Ex: 5511999998888 ou 5511999998888@s.whatsapp.net"
                            value={phoneOrJid}
                            onChange={(e) => setPhoneOrJid(e.target.value)}
                            disabled={isLoading}
                            className="text-xs font-mono"
                            autoFocus
                        />
                        <p className="text-[11px] text-muted-foreground">
                            Inclua o código do país e DDD (Ex: 55 para Brasil).
                        </p>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0 pt-2">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                            className="text-xs"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={isLoading || !phoneOrJid.trim()}
                            className="text-xs gap-1.5"
                        >
                            <LuPlus className="h-3.5 w-3.5" />
                            {isLoading
                                ? "Adicionando..."
                                : "Adicionar ao Grupo"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
