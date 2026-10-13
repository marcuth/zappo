import {
    LuBellOff,
    LuHardDrive,
    LuMessageSquare,
    LuMessageSquarePlus,
    LuQrCode,
    LuRefreshCw,
    LuSearch,
    LuSettings,
    LuTrash2,
    LuUsers,
} from "react-icons/lu"
import { useState } from "react"

import { useAccount } from "../providers/account-provider"
import { NewChatModal } from "../modals/new-chat-modal"
import { ChatAvatar } from "../chat/chat-avatar"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Input } from "../ui/input"

interface SidebarProps {
    onOpenAccounts: () => void
    onOpenStorage: () => void
    onOpenSettings: () => void
}

export function Sidebar({
    onOpenAccounts,
    onOpenStorage,
    onOpenSettings,
}: SidebarProps) {
    const {
        accounts,
        activeAccount,
        chats,
        activeChat,
        selectChat,
        deleteChat,
        syncGroups,
    } = useAccount()

    const [searchQuery, setSearchQuery] = useState("")
    const [filter, setFilter] = useState<"all" | "unread" | "groups">("all")
    const [isNewChatOpen, setIsNewChatOpen] = useState(false)
    const [isSyncingGroups, setIsSyncingGroups] = useState(false)

    const handleSyncGroups = async () => {
        setIsSyncingGroups(true)
        try {
            await syncGroups()
        } finally {
            setIsSyncingGroups(false)
        }
    }

    const filteredChats = chats.filter((chat) => {
        const matchesSearch =
            chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (chat.lastMessage?.text || "")
                .toLowerCase()
                .includes(searchQuery.toLowerCase())

        if (!matchesSearch) return false

        if (filter === "unread") return chat.unreadCount > 0
        if (filter === "groups") return chat.isGroup

        return true
    })

    const isConnected = activeAccount?.status === "connected"

    return (
        <aside className="w-96 flex flex-col h-screen border-r border-border bg-card/60 backdrop-blur select-none">
            {/* Top Bar with Brand & Active Account Pill */}
            <div className="p-3.5 border-b border-border flex items-center justify-between bg-card/80">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center p-1.5 shadow-sm">
                        <img
                            src="/logo.svg"
                            alt="Zappo Logo"
                            className="w-full h-full object-contain"
                        />
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <span className="font-bold text-sm tracking-tight text-foreground">
                                Zappo
                            </span>
                            <Badge
                                variant="outline"
                                className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-primary/20"
                            >
                                Rust 0.7
                            </Badge>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span
                                className={`w-2 h-2 rounded-full ${
                                    isConnected
                                        ? "bg-emerald-500 animate-pulse"
                                        : "bg-amber-500"
                                }`}
                            />
                            <span className="truncate max-w-[130px]">
                                {activeAccount
                                    ? activeAccount.name
                                    : "Nenhuma conta"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Header Action Buttons */}
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                        onClick={() => setIsNewChatOpen(true)}
                        title="Nova Conversa com número"
                    >
                        <LuMessageSquarePlus className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground relative"
                        onClick={onOpenAccounts}
                        title="Gerenciar Contas"
                    >
                        <LuUsers className="h-4 w-4" />
                        {accounts.length > 1 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                                {accounts.length}
                            </span>
                        )}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={onOpenStorage}
                        title="Armazenamento e Cache"
                    >
                        <LuHardDrive className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={onOpenSettings}
                        title="Configurações e Download Seletivo"
                    >
                        <LuSettings className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Offline or Pairing Alert Banner */}
            {!isConnected && (
                <div
                    onClick={onOpenAccounts}
                    className="px-3.5 py-2 bg-amber-500/10 border-b border-amber-500/20 text-amber-500 text-xs flex items-center justify-between cursor-pointer hover:bg-amber-500/15 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <LuQrCode className="h-4 w-4 shrink-0" />
                        <span className="font-medium text-[11px]">
                            {activeAccount?.status === "pairing"
                                ? "Escanear QR Code do WhatsApp"
                                : "WhatsApp desconectado"}
                        </span>
                    </div>
                    <span className="text-[10px] underline font-semibold">
                        Conectar
                    </span>
                </div>
            )}

            {/* Multi-Account Bar (Quick Switch Banner) */}
            {accounts.length > 1 && (
                <div className="px-3 py-2 bg-muted/40 border-b border-border flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-muted-foreground overflow-hidden">
                        <span className="text-[11px] font-medium text-foreground">
                            Conta ativa:
                        </span>
                        <span className="truncate font-semibold text-primary">
                            {activeAccount?.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground/80">
                            (Só esta recebe)
                        </span>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[11px] px-2 text-primary hover:text-primary hover:bg-primary/10"
                        onClick={onOpenAccounts}
                    >
                        Trocar
                    </Button>
                </div>
            )}

            {/* Search Input & Filters */}
            <div className="p-3 border-b border-border space-y-2.5">
                <div className="relative">
                    <LuSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Pesquisar conversas ou mensagens..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 h-9 text-xs bg-muted/50 border-input/60 focus-visible:ring-1 focus-visible:ring-primary"
                    />
                </div>

                <div className="flex items-center gap-1.5">
                    <Button
                        variant={filter === "all" ? "secondary" : "ghost"}
                        size="sm"
                        className={`h-6 text-[11px] px-2.5 rounded-full ${
                            filter === "all"
                                ? "bg-primary/15 text-primary hover:bg-primary/20"
                                : "text-muted-foreground"
                        }`}
                        onClick={() => setFilter("all")}
                    >
                        Todas
                    </Button>
                    <Button
                        variant={filter === "unread" ? "secondary" : "ghost"}
                        size="sm"
                        className={`h-6 text-[11px] px-2.5 rounded-full ${
                            filter === "unread"
                                ? "bg-primary/15 text-primary hover:bg-primary/20"
                                : "text-muted-foreground"
                        }`}
                        onClick={() => setFilter("unread")}
                    >
                        Não lidas
                    </Button>
                    <Button
                        variant={filter === "groups" ? "secondary" : "ghost"}
                        size="sm"
                        className={`h-6 text-[11px] px-2.5 rounded-full ${
                            filter === "groups"
                                ? "bg-primary/15 text-primary hover:bg-primary/20"
                                : "text-muted-foreground"
                        }`}
                        onClick={() => setFilter("groups")}
                    >
                        Grupos
                    </Button>
                    {filter === "groups" && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-full text-muted-foreground hover:text-primary"
                            onClick={handleSyncGroups}
                            disabled={isSyncingGroups}
                            title="Sincronizar Grupos agora"
                        >
                            <LuRefreshCw
                                className={`h-3 w-3 ${
                                    isSyncingGroups ? "animate-spin" : ""
                                }`}
                            />
                        </Button>
                    )}
                </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto divide-y divide-border/40 scrollbar-thin">
                {filteredChats.length === 0 ? (
                    <div className="p-8 text-center text-xs text-muted-foreground space-y-3">
                        <LuMessageSquare className="h-8 w-8 mx-auto text-muted-foreground/40" />
                        <p>Nenhuma conversa encontrada</p>
                        {filter === "groups" ? (
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-xs border-primary/30 text-primary hover:bg-primary/10 gap-1.5"
                                onClick={handleSyncGroups}
                                disabled={isSyncingGroups}
                            >
                                <LuRefreshCw
                                    className={`h-3.5 w-3.5 ${
                                        isSyncingGroups ? "animate-spin" : ""
                                    }`}
                                />
                                Sincronizar Grupos
                            </Button>
                        ) : (
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-xs border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 gap-1.5"
                                onClick={() => setIsNewChatOpen(true)}
                            >
                                <LuMessageSquarePlus className="h-3.5 w-3.5" />
                                Iniciar Nova Conversa
                            </Button>
                        )}
                    </div>
                ) : (
                    filteredChats.map((chat) => {
                        const isSelected = activeChat?.id === chat.id
                        const timeFormatted = new Date(
                            chat.updatedAt,
                        ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                        })

                        return (
                            <div
                                key={chat.id}
                                onClick={() => selectChat(chat)}
                                className={`group px-3.5 py-3 flex items-center gap-3 cursor-pointer transition-colors relative ${
                                    isSelected
                                        ? "bg-primary/10 border-l-2 border-primary"
                                        : "hover:bg-muted/40"
                                }`}
                            >
                                {/* Avatar */}
                                <ChatAvatar
                                    jid={chat.jid}
                                    name={chat.name}
                                    isGroup={chat.isGroup}
                                />

                                {/* Chat Metadata & Snippet */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <h4 className="text-xs font-semibold text-foreground truncate">
                                                {chat.name}
                                            </h4>
                                            {chat.isMuted && (
                                                <LuBellOff
                                                    className="w-3 h-3 text-muted-foreground/70 shrink-0"
                                                    title="Silenciado"
                                                />
                                            )}
                                        </div>
                                        <span className="text-[10px] text-muted-foreground shrink-0 ml-1">
                                            {timeFormatted}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between gap-1">
                                        <p className="text-xs text-muted-foreground truncate font-sans">
                                            {chat.lastMessage?.text ||
                                                "Sem mensagens"}
                                        </p>
                                        <div className="flex items-center gap-1 shrink-0">
                                            {chat.unreadCount > 0 && (
                                                <Badge className="h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                                                    {chat.unreadCount}
                                                </Badge>
                                            )}
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    if (
                                                        window.confirm(
                                                            `Deseja realmente excluir a conversa com "${chat.name}"?`,
                                                        )
                                                    ) {
                                                        deleteChat(chat.jid)
                                                    }
                                                }}
                                                className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive rounded-md hover:bg-destructive/10 transition-opacity"
                                                title="Excluir conversa"
                                            >
                                                <LuTrash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            {/* Performance Footer Indicator */}
            <div className="p-2.5 border-t border-border bg-card/90 flex items-center justify-between text-[11px] text-muted-foreground">
                <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Rust Engine: ~48 MB RAM</span>
                </div>
                <span className="text-[10px] text-muted-foreground/60 font-mono">
                    Zero-Electron
                </span>
            </div>
            {/* Modal para Iniciar Nova Conversa com número não salvo */}
            <NewChatModal
                open={isNewChatOpen}
                onOpenChange={setIsNewChatOpen}
            />
        </aside>
    )
}
