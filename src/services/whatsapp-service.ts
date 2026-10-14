import { UnlistenFn, listen } from "@tauri-apps/api/event"
import { invoke } from "@tauri-apps/api/core"

import {
    Account,
    AppSettings,
    Chat,
    GroupParticipant,
    Message,
    PairingCodeResponse,
    QrCodeResponse,
    StorageStats,
} from "../types"

export class WhatsAppService {
    // Accounts
    static async getAccounts(): Promise<Account[]> {
        return invoke<Account[]>("get_accounts")
    }

    static async getActiveAccount(): Promise<Account | null> {
        return invoke<Account | null>("get_active_account")
    }

    static async createAccount(
        name: string,
        phoneNumber?: string,
    ): Promise<Account> {
        return invoke<Account>("create_account", {
            name,
            phoneNumber: phoneNumber || null,
        })
    }

    static async switchAccount(accountId: string): Promise<Account> {
        return invoke<Account>("switch_account", { accountId })
    }

    static async renameAccount(
        accountId: string,
        newName: string,
    ): Promise<Account> {
        return invoke<Account>("rename_account", { accountId, newName })
    }

    static async deleteAccount(accountId: string): Promise<void> {
        return invoke<void>("delete_account", { accountId })
    }

    static async getPairingQr(accountId: string): Promise<QrCodeResponse> {
        return invoke<QrCodeResponse>("get_pairing_qr", { accountId })
    }

    static async requestPairingCode(
        accountId: string,
        phoneNumber: string,
    ): Promise<PairingCodeResponse> {
        return invoke<PairingCodeResponse>("request_pairing_code", {
            accountId,
            phoneNumber,
        })
    }

    static async disconnectActiveAccount(): Promise<void> {
        return invoke<void>("disconnect_active_account")
    }

    // Chats & Messages
    static async getChats(accountId: string): Promise<Chat[]> {
        return invoke<Chat[]>("get_chats", { accountId })
    }

    static async syncGroups(accountId: string): Promise<Chat[]> {
        return invoke<Chat[]>("sync_groups", { accountId })
    }

    static async getMessages(
        accountId: string,
        chatJid: string,
        limit = 50,
        beforeTimestamp?: number,
    ): Promise<Message[]> {
        return invoke<Message[]>("get_messages", {
            accountId,
            chatJid,
            limit,
            beforeTimestamp: beforeTimestamp || null,
        })
    }

    static async sendMessage(
        accountId: string,
        chatJid: string,
        text: string,
        replyToId?: string,
    ): Promise<Message> {
        return invoke<Message>("send_message", {
            accountId,
            chatJid,
            text,
            replyToId: replyToId || null,
        })
    }

    static async sendMedia(
        accountId: string,
        chatJid: string,
        mediaType: string,
        fileName: string,
        fileDataBase64: string,
        caption?: string,
        isViewOnce?: boolean,
    ): Promise<Message> {
        return invoke<Message>("send_media", {
            accountId,
            chatJid,
            mediaType,
            fileName,
            fileDataBase64,
            caption: caption || null,
            isViewOnce: isViewOnce ?? null,
        })
    }

    static async startChat(
        accountId: string,
        phoneNumber: string,
        name?: string,
    ): Promise<Chat> {
        return invoke<Chat>("start_chat", {
            accountId,
            phoneNumber,
            name: name || null,
        })
    }

    static async downloadMedia(
        accountId: string,
        messageId: string,
    ): Promise<string> {
        return invoke<string>("download_media", {
            accountId,
            messageId,
        })
    }

    // Profile & Group Management
    static async getProfilePicture(jid: string): Promise<string | null> {
        return invoke<string | null>("get_profile_picture", { jid })
    }

    static async getGroupMembers(
        groupJid: string,
    ): Promise<GroupParticipant[]> {
        return invoke<GroupParticipant[]>("get_group_members", { groupJid })
    }

    static async addGroupParticipant(
        groupJid: string,
        phoneOrJid: string,
    ): Promise<void> {
        return invoke<void>("add_group_participant", {
            groupJid,
            phoneOrJid,
        })
    }

    static async leaveGroup(
        accountId: string,
        groupJid: string,
    ): Promise<void> {
        return invoke<void>("leave_group", {
            accountId,
            groupJid,
        })
    }

    static async muteChat(
        accountId: string,
        chatJid: string,
        muteEndTimestamp?: number,
    ): Promise<void> {
        return invoke<void>("mute_chat", {
            accountId,
            chatJid,
            muteEndTimestamp: muteEndTimestamp || null,
        })
    }

    static async unmuteChat(accountId: string, chatJid: string): Promise<void> {
        return invoke<void>("unmute_chat", {
            accountId,
            chatJid,
        })
    }

    static async sendReaction(
        chatJid: string,
        messageId: string,
        fromMe: boolean,
        emoji: string,
        participantJid?: string,
    ): Promise<void> {
        return invoke<void>("send_reaction", {
            chatJid,
            messageId,
            fromMe,
            emoji,
            participantJid: participantJid || null,
        })
    }

    // Storage & Cache
    static async getStorageStats(accountId?: string): Promise<StorageStats> {
        return invoke<StorageStats>("get_storage_stats", {
            accountId: accountId || null,
        })
    }

    static async clearMediaCache(
        category?: string,
        olderThanDays?: number,
    ): Promise<{ freedBytes: number }> {
        return invoke<{ freedBytes: number }>("clear_media_cache", {
            category: category || null,
            olderThanDays: olderThanDays || null,
        })
    }

    static async clearChatCache(
        chatJid: string,
    ): Promise<{ freedBytes: number }> {
        return invoke<{ freedBytes: number }>("clear_chat_cache", { chatJid })
    }

    static async deleteChat(accountId: string, chatJid: string): Promise<void> {
        return invoke<void>("delete_chat", { accountId, chatJid })
    }

    static async clearChatMessages(
        accountId: string,
        chatJid: string,
    ): Promise<void> {
        return invoke<void>("clear_chat_messages", { accountId, chatJid })
    }

    static async vacuumDatabase(): Promise<{ freedBytes: number }> {
        return invoke<{ freedBytes: number }>("vacuum_database")
    }

    static async clearAllCache(): Promise<{ freedBytes: number }> {
        return invoke<{ freedBytes: number }>("clear_all_cache")
    }

    // Settings
    static async getSettings(): Promise<AppSettings> {
        return invoke<AppSettings>("get_settings")
    }

    static async saveSettings(settings: AppSettings): Promise<void> {
        return invoke<void>("save_settings", { settings })
    }

    // Event Listeners
    static onQrCode(
        callback: (payload: QrCodeResponse) => void,
    ): Promise<UnlistenFn> {
        return listen<QrCodeResponse>("whatsapp://qr-code", (event) =>
            callback(event.payload),
        )
    }

    static onConnectionState(
        callback: (payload: { accountId: string; status: string }) => void,
    ): Promise<UnlistenFn> {
        return listen<{ accountId: string; status: string }>(
            "whatsapp://connection-state",
            (event) => callback(event.payload),
        )
    }

    static onNewMessage(
        callback: (payload: { accountId: string; message: Message }) => void,
    ): Promise<UnlistenFn> {
        return listen<{ accountId: string; message: Message }>(
            "whatsapp://new-message",
            (event) => callback(event.payload),
        )
    }

    static onMessageStatus(
        callback: (payload: {
            messageId: string
            status: Message["status"]
        }) => void,
    ): Promise<UnlistenFn> {
        return listen<{ messageId: string; status: Message["status"] }>(
            "whatsapp://message-status",
            (event) => callback(event.payload),
        )
    }

    static onChatsUpdated(
        callback: (payload: { accountId: string; chats: Chat[] }) => void,
    ): Promise<UnlistenFn> {
        return listen<{ accountId: string; chats: Chat[] }>(
            "whatsapp://chats-updated",
            (event) => callback(event.payload),
        )
    }
}
