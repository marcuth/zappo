import { useEffect, useState } from "react"

import { useAvatar } from "../providers/avatar-provider"

interface ChatAvatarProps {
    jid: string
    name: string
    isGroup?: boolean
    sizeClassName?: string
    textClassName?: string
}

export function ChatAvatar({
    jid,
    name,
    isGroup = false,
    sizeClassName = "w-11 h-11",
    textClassName = "text-xs",
}: ChatAvatarProps) {
    const { getAvatar, loadAvatar } = useAvatar()
    const avatarUrl = getAvatar(jid)
    const [imgFailed, setImgFailed] = useState(false)

    useEffect(() => {
        loadAvatar(jid)
    }, [jid, loadAvatar])

    const initials = name
        ? name
              .split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((n) => n[0])
              .join("")
              .toUpperCase()
        : "?"

    return (
        <div className="relative shrink-0">
            {avatarUrl && !imgFailed ? (
                <img
                    src={avatarUrl}
                    alt={name}
                    onError={() => setImgFailed(true)}
                    className={`${sizeClassName} rounded-full object-cover border border-border shadow-sm`}
                />
            ) : (
                <div
                    className={`${sizeClassName} rounded-full bg-gradient-to-br from-muted to-muted-foreground/20 border border-border flex items-center justify-center font-bold ${textClassName} text-foreground shadow-sm`}
                >
                    {initials}
                </div>
            )}
            {isGroup && (
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-card border border-border flex items-center justify-center text-[9px] shadow-xs">
                    👥
                </span>
            )}
        </div>
    )
}
