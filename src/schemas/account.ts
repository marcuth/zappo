import { z } from "zod"

export const createAccountSchema = z.object({
    name: z
        .string()
        .min(2, "Nome deve ter pelo menos 2 caracteres")
        .max(50, "Nome muito longo"),
    phoneNumber: z
        .string()
        .regex(
            /^\+?[1-9]\d{7,14}$/,
            "Número de telefone internacional inválido",
        )
        .optional()
        .or(z.literal("")),
})

export const editAccountSchema = z.object({
    id: z.string(),
    name: z
        .string()
        .min(2, "Nome deve ter pelo menos 2 caracteres")
        .max(50, "Nome muito longo"),
})

export type CreateAccountInput = z.infer<typeof createAccountSchema>
export type EditAccountInput = z.infer<typeof editAccountSchema>
