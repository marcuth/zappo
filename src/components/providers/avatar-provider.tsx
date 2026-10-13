import {
    createContext,
    useContext,
    useCallback,
    useState,
    ReactNode,
} from "react"

import { WhatsAppService } from "../../services/whatsapp-service"

interface AvatarContextType {
    getAvatar: (jid: string) => string | undefined
    loadAvatar: (jid: string) => Promise<string | undefined>
}

const AvatarContext = createContext<AvatarContextType | undefined>(undefined)

export function AvatarProvider({ children }: { children: ReactNode }) {
    // Cache: JID -> image URL (or empty string if no avatar)
    const [avatarCache, setAvatarCache] = useState<Record<string, string>>({})
    const [pendingRequests, setPendingRequests] = useState<Set<string>>(
        new Set(),
    )

    const getAvatar = useCallback(
        (jid: string): string | undefined => {
            return avatarCache[jid]
        },
        [avatarCache],
    )

    const loadAvatar = useCallback(
        async (jid: string): Promise<string | undefined> => {
            if (!jid) return undefined

            // Já temos no cache
            if (jid in avatarCache) {
                return avatarCache[jid] || undefined
            }

            // Já está em requisição
            if (pendingRequests.has(jid)) {
                return undefined
            }

            setPendingRequests((prev) => new Set(prev).add(jid))

            try {
                const url = await WhatsAppService.getProfilePicture(jid)
                const storedUrl = url || ""
                setAvatarCache((prev) => ({
                    ...prev,
                    [jid]: storedUrl,
                }))
                return url || undefined
            } catch (err) {
                console.warn(`Erro ao carregar avatar para ${jid}:`, err)
                setAvatarCache((prev) => ({
                    ...prev,
                    [jid]: "",
                }))
                return undefined
            } finally {
                setPendingRequests((prev) => {
                    const next = new Set(prev)
                    next.delete(jid)
                    return next
                })
            }
        },
        [avatarCache, pendingRequests],
    )

    return (
        <AvatarContext.Provider value={{ getAvatar, loadAvatar }}>
            {children}
        </AvatarContext.Provider>
    )
}

export function useAvatar() {
    const context = useContext(AvatarContext)
    if (!context) {
        throw new Error("useAvatar deve ser usado dentro de um AvatarProvider")
    }
    return context
}
