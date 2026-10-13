import { useState } from "react"

import {
    AccountProvider,
    useAccount,
} from "./components/providers/account-provider"
import { ThemeProvider } from "./components/providers/theme-provider"
import { AccountsModal } from "./components/modals/accounts-modal"
import { SettingsModal } from "./components/modals/settings-modal"
import { StorageModal } from "./components/modals/storage-modal"
import { EmptyChat } from "./components/chat/empty-chat"
import { ChatView } from "./components/chat/chat-view"
import { Sidebar } from "./components/layout/sidebar"
import { Toaster } from "./components/ui/sonner"
import "./App.css"

function MainApp() {
    const { activeChat } = useAccount()

    const [accountsOpen, setAccountsOpen] = useState(false)
    const [storageOpen, setStorageOpen] = useState(false)
    const [settingsOpen, setSettingsOpen] = useState(false)

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
            {/* Sidebar with accounts & chats */}
            <Sidebar
                onOpenAccounts={() => setAccountsOpen(true)}
                onOpenStorage={() => setStorageOpen(true)}
                onOpenSettings={() => setSettingsOpen(true)}
            />

            {/* Main Area: Active Chat or Welcome State */}
            {activeChat ? <ChatView /> : <EmptyChat />}

            {/* Modals */}
            <AccountsModal open={accountsOpen} onOpenChange={setAccountsOpen} />
            <StorageModal open={storageOpen} onOpenChange={setStorageOpen} />
            <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />

            <Toaster position="top-right" richColors />
        </div>
    )
}

export default function App() {
    return (
        <ThemeProvider defaultTheme="dark">
            <AccountProvider>
                <MainApp />
            </AccountProvider>
        </ThemeProvider>
    )
}
