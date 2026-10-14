use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Account {
    pub id: String,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub phone: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub push_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub status_text: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub avatar_url: Option<String>,
    pub is_active: bool,
    pub status: String, // "connected", "connecting", "disconnected", "pairing", "standby"
    pub created_at: i64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_connected_at: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub unread_count: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserProfile {
    pub jid: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub phone: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub status: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub avatar_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MediaAttachment {
    pub id: String,
    pub media_type: String, // "image", "video", "audio", "document", "sticker", "voice"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub file_name: Option<String>,
    pub file_size: u64, // In bytes
    pub mime_type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub thumbnail_data_url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub local_path: Option<String>,
    pub is_downloaded: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub is_downloading: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub download_progress: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub duration_seconds: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub direct_path: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub media_key: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub file_sha256: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub file_enc_sha256: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub is_view_once: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QuotedMessage {
    pub id: String,
    pub sender_name: String,
    pub text: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Message {
    pub id: String,
    pub chat_jid: String,
    pub from_me: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sender_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sender_jid: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub text: Option<String>,
    pub timestamp: i64,
    pub status: String, // "pending", "sent", "delivered", "read", "failed"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub media: Option<MediaAttachment>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reply_to: Option<QuotedMessage>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LastMessagePreview {
    pub id: String,
    pub text: String,
    pub timestamp: i64,
    pub from_me: bool,
    pub r#type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub status: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GroupParticipant {
    pub jid: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub phone: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub display_name: Option<String>,
    pub is_admin: bool,
    pub is_super_admin: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub avatar_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Chat {
    pub id: String,
    pub jid: String,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub phone_number: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub avatar_url: Option<String>,
    pub is_group: bool,
    pub unread_count: u32,
    pub pinned: bool,
    pub archived: bool,
    #[serde(default)]
    pub is_muted: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mute_end_timestamp: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_message: Option<LastMessagePreview>,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AutoDownloadSettings {
    pub images: bool,
    pub videos: bool,
    pub audio: bool,
    pub documents: bool,
    pub stickers: bool,
    pub max_file_size_mb: u32, // 0 = unlimited, e.g. 10
    pub auto_download_on_wifi: bool,
    pub auto_download_on_cellular: bool,
}

impl Default for AutoDownloadSettings {
    fn default() -> Self {
        Self {
            images: false,
            videos: false,
            audio: false,
            documents: false,
            stickers: false,
            max_file_size_mb: 10,
            auto_download_on_wifi: true,
            auto_download_on_cellular: false,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub theme: String, // "light", "dark", "system"
    pub notifications: bool,
    pub notification_sound: bool,
    pub auto_download: AutoDownloadSettings,
    pub performance_mode: bool,
    pub hardware_acceleration: bool,
    #[serde(default = "default_true")]
    pub auto_purge_revoked_messages: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub storage_path: Option<String>,
}

fn default_true() -> bool {
    true
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            theme: "dark".to_string(),
            notifications: true,
            notification_sound: true,
            auto_download: AutoDownloadSettings::default(),
            performance_mode: true,
            hardware_acceleration: true,
            auto_purge_revoked_messages: true,
            storage_path: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StorageCategoryStats {
    pub count: u64,
    pub size_bytes: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChatStorageUsage {
    pub chat_jid: String,
    pub chat_name: String,
    pub media_count: u64,
    pub size_bytes: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StorageStats {
    pub total_size_bytes: u64,
    pub images: StorageCategoryStats,
    pub videos: StorageCategoryStats,
    pub audio: StorageCategoryStats,
    pub documents: StorageCategoryStats,
    pub stickers: StorageCategoryStats,
    pub database_size_bytes: u64,
    pub temp_cache_size_bytes: u64,
    pub top_chats: Vec<ChatStorageUsage>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QrCodeResponse {
    pub qr_data: String,
    pub expires_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PairingCodeResponse {
    pub code: String,
    pub expires_at: i64,
}
