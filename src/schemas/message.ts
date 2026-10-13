import { z } from "zod"

export const sendMessageSchema = z.object({
    chatJid: z.string().min(1, "Destinatário inválido"),
    text: z.string().min(1, "Mensagem não pode ser vazia").max(10000),
    replyToId: z.string().optional(),
})

export type SendMessageInput = z.infer<typeof sendMessageSchema>
