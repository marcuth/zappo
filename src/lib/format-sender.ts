/**
 * Formats phone number from senderJID or raw string
 * e.g. 5511999998888@s.whatsapp.net -> +55 (11) 99999-8888
 */
export function formatPhoneNumber(jidOrPhone?: string): string {
    if (!jidOrPhone) return ""

    // Extract digits before @ and strip any device suffix (:0, :1, etc)
    const raw = jidOrPhone.split("@")[0].split(":")[0]
    const digits = raw.replace(/\D/g, "")

    if (!digits) return jidOrPhone

    // Brazilian numbers: 55 + 2 digits DDD + 8 or 9 digits
    if (
        digits.startsWith("55") &&
        (digits.length === 12 || digits.length === 13)
    ) {
        const ddd = digits.slice(2, 4)
        const rest = digits.slice(4)
        if (rest.length === 9) {
            return `+55 (${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`
        } else {
            return `+55 (${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`
        }
    }

    // Generic international format
    if (digits.length >= 10) {
        return `+${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6)}`
    }

    return `+${digits}`
}

/**
 * Deterministic color palette for group members (like WhatsApp Web)
 */
const SENDER_COLORS = [
    {
        text: "text-emerald-500 dark:text-emerald-400",
        bg: "bg-emerald-500/10 border-emerald-500/20",
        ring: "border-emerald-500/40",
    },
    {
        text: "text-sky-500 dark:text-sky-400",
        bg: "bg-sky-500/10 border-sky-500/20",
        ring: "border-sky-500/40",
    },
    {
        text: "text-purple-500 dark:text-purple-400",
        bg: "bg-purple-500/10 border-purple-500/20",
        ring: "border-purple-500/40",
    },
    {
        text: "text-amber-500 dark:text-amber-400",
        bg: "bg-amber-500/10 border-amber-500/20",
        ring: "border-amber-500/40",
    },
    {
        text: "text-rose-500 dark:text-rose-400",
        bg: "bg-rose-500/10 border-rose-500/20",
        ring: "border-rose-500/40",
    },
    {
        text: "text-indigo-500 dark:text-indigo-400",
        bg: "bg-indigo-500/10 border-indigo-500/20",
        ring: "border-indigo-500/40",
    },
    {
        text: "text-teal-500 dark:text-teal-400",
        bg: "bg-teal-500/10 border-teal-500/20",
        ring: "border-teal-500/40",
    },
    {
        text: "text-orange-500 dark:text-orange-400",
        bg: "bg-orange-500/10 border-orange-500/20",
        ring: "border-orange-500/40",
    },
    {
        text: "text-cyan-500 dark:text-cyan-400",
        bg: "bg-cyan-500/10 border-cyan-500/20",
        ring: "border-cyan-500/40",
    },
    {
        text: "text-fuchsia-500 dark:text-fuchsia-400",
        bg: "bg-fuchsia-500/10 border-fuchsia-500/20",
        ring: "border-fuchsia-500/40",
    },
]

/**
 * Returns a stable color configuration for a given sender identifier
 */
export function getSenderColor(identifier?: string) {
    if (!identifier) return SENDER_COLORS[0]
    let hash = 0
    for (let i = 0; i < identifier.length; i++) {
        hash = (hash << 5) - hash + identifier.charCodeAt(i)
        hash |= 0
    }
    const index = Math.abs(hash) % SENDER_COLORS.length
    return SENDER_COLORS[index]
}

/**
 * Extracts initials from a name or identifier
 */
export function getSenderInitials(name?: string, fallback = "??"): string {
    if (!name || !name.trim()) return fallback
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) {
        return parts[0].slice(0, 2).toUpperCase()
    }
    return (parts[0][0] + parts[1][0]).toUpperCase()
}
