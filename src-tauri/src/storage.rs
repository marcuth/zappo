use crate::models::{
    Account, AppSettings, Chat, ChatStorageUsage, Message, StorageCategoryStats, StorageStats,
};
use std::fs;
use std::path::{Path, PathBuf};

pub struct StorageManager {
    pub base_dir: PathBuf,
}

impl StorageManager {
    pub fn new() -> Self {
        let base_dir = dirs::data_local_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join("Zappo");

        let _ = fs::create_dir_all(&base_dir);
        let _ = fs::create_dir_all(base_dir.join("accounts"));
        let _ = fs::create_dir_all(base_dir.join("media"));
        let _ = fs::create_dir_all(base_dir.join("temp"));
        let _ = fs::create_dir_all(base_dir.join("data"));

        Self { base_dir }
    }

    pub fn accounts_file(&self) -> PathBuf {
        self.base_dir.join("data").join("accounts.json")
    }

    pub fn settings_file(&self) -> PathBuf {
        self.base_dir.join("data").join("settings.json")
    }

    pub fn account_db_path(&self, account_id: &str) -> PathBuf {
        let dir = self.base_dir.join("accounts").join(account_id);
        let _ = fs::create_dir_all(&dir);
        dir.join("whatsapp.db")
    }

    pub fn media_dir(&self, account_id: &str, category: &str) -> PathBuf {
        let dir = self.base_dir.join("media").join(account_id).join(category);
        let _ = fs::create_dir_all(&dir);
        dir
    }

    pub fn load_accounts(&self) -> Vec<Account> {
        let file = self.accounts_file();
        if file.exists() {
            if let Ok(content) = fs::read_to_string(file) {
                if let Ok(accs) = serde_json::from_str::<Vec<Account>>(&content) {
                    return accs;
                }
            }
        }

        // Se não houver contas salvas, cria uma conta inicial padrão em modo de pareamento
        let default_account = Account {
            id: "acc_main".to_string(),
            name: "Conta Pessoal".to_string(),
            phone: None,
            push_name: None,
            avatar_url: None,
            is_active: true,
            status: "pairing".to_string(),
            created_at: chrono::Utc::now().timestamp_millis(),
            last_connected_at: None,
            unread_count: Some(0),
        };

        let initial = vec![default_account];

        self.save_accounts(&initial);
        initial
    }

    pub fn save_accounts(&self, accounts: &[Account]) {
        let file = self.accounts_file();
        if let Ok(json) = serde_json::to_string_pretty(accounts) {
            let _ = fs::write(file, json);
        }
    }

    pub fn load_settings(&self) -> AppSettings {
        let file = self.settings_file();
        if file.exists() {
            if let Ok(content) = fs::read_to_string(file) {
                if let Ok(settings) = serde_json::from_str::<AppSettings>(&content) {
                    return settings;
                }
            }
        }
        let default = AppSettings::default();
        self.save_settings(&default);
        default
    }

    pub fn save_settings(&self, settings: &AppSettings) {
        let file = self.settings_file();
        if let Ok(json) = serde_json::to_string_pretty(settings) {
            let _ = fs::write(file, json);
        }
    }

    pub fn load_chats(&self, account_id: &str) -> Vec<Chat> {
        let file = self
            .base_dir
            .join("data")
            .join(format!("chats_{}.json", account_id));
        if file.exists() {
            if let Ok(content) = fs::read_to_string(file) {
                if let Ok(chats) = serde_json::from_str::<Vec<Chat>>(&content) {
                    return chats;
                }
            }
        }

        vec![]
    }

    pub fn save_chats(&self, account_id: &str, chats: &[Chat]) {
        let file = self
            .base_dir
            .join("data")
            .join(format!("chats_{}.json", account_id));
        if let Ok(json) = serde_json::to_string_pretty(chats) {
            let _ = fs::write(file, json);
        }
    }

    pub fn load_messages(&self, account_id: &str, chat_jid: &str) -> Vec<Message> {
        let file = self.base_dir.join("data").join(format!(
            "msgs_{}_{}.json",
            account_id,
            chat_jid.replace('@', "_").replace('.', "_")
        ));
        if file.exists() {
            if let Ok(content) = fs::read_to_string(file) {
                if let Ok(msgs) = serde_json::from_str::<Vec<Message>>(&content) {
                    return msgs;
                }
            }
        }

        vec![]
    }

    pub fn save_messages(&self, account_id: &str, chat_jid: &str, messages: &[Message]) {
        let file = self.base_dir.join("data").join(format!(
            "msgs_{}_{}.json",
            account_id,
            chat_jid.replace('@', "_").replace('.', "_")
        ));
        if let Ok(json) = serde_json::to_string_pretty(messages) {
            let _ = fs::write(file, json);
        }
    }

    pub fn delete_chat(&self, account_id: &str, chat_jid: &str) {
        let mut chats = self.load_chats(account_id);
        chats.retain(|c| c.jid != chat_jid);
        self.save_chats(account_id, &chats);

        let sanitized_jid = chat_jid.replace('@', "_").replace('.', "_");
        let msg_file = self
            .base_dir
            .join("data")
            .join(format!("msgs_{}_{}.json", account_id, sanitized_jid));
        if msg_file.exists() {
            let _ = fs::remove_file(msg_file);
        }
        self.clear_chat_cache(chat_jid);
    }

    pub fn clear_chat_messages(&self, account_id: &str, chat_jid: &str) {
        self.save_messages(account_id, chat_jid, &[]);
        let mut chats = self.load_chats(account_id);
        if let Some(chat) = chats.iter_mut().find(|c| c.jid == chat_jid) {
            chat.last_message = None;
            chat.unread_count = 0;
            self.save_chats(account_id, &chats);
        }
        self.clear_chat_cache(chat_jid);
    }

    pub fn get_storage_stats(&self, account_id: Option<&str>) -> StorageStats {
        let mut total_size = 0u64;
        let mut images_count = 0u64;
        let mut images_size = 0u64;
        let mut videos_count = 0u64;
        let mut videos_size = 0u64;
        let mut audio_count = 0u64;
        let mut audio_size = 0u64;
        let mut docs_count = 0u64;
        let mut docs_size = 0u64;
        let mut stickers_count = 0u64;
        let mut stickers_size = 0u64;

        let media_base = self.base_dir.join("media");
        if let Some(acc) = account_id {
            let acc_path = media_base.join(acc);
            self.count_category(
                &acc_path.join("images"),
                &mut images_count,
                &mut images_size,
            );
            self.count_category(
                &acc_path.join("videos"),
                &mut videos_count,
                &mut videos_size,
            );
            self.count_category(&acc_path.join("audio"), &mut audio_count, &mut audio_size);
            self.count_category(&acc_path.join("documents"), &mut docs_count, &mut docs_size);
            self.count_category(
                &acc_path.join("stickers"),
                &mut stickers_count,
                &mut stickers_size,
            );
        } else if let Ok(accounts_entries) = fs::read_dir(&media_base) {
            for entry in accounts_entries.flatten() {
                if entry.path().is_dir() {
                    self.count_category(
                        &entry.path().join("images"),
                        &mut images_count,
                        &mut images_size,
                    );
                    self.count_category(
                        &entry.path().join("videos"),
                        &mut videos_count,
                        &mut videos_size,
                    );
                    self.count_category(
                        &entry.path().join("audio"),
                        &mut audio_count,
                        &mut audio_size,
                    );
                    self.count_category(
                        &entry.path().join("documents"),
                        &mut docs_count,
                        &mut docs_size,
                    );
                    self.count_category(
                        &entry.path().join("stickers"),
                        &mut stickers_count,
                        &mut stickers_size,
                    );
                }
            }
        }

        let media_total = images_size + videos_size + audio_size + docs_size + stickers_size;
        total_size += media_total;

        // DB size
        let mut db_size = 0u64;
        let accounts_dir = self.base_dir.join("accounts");
        if let Some(acc) = account_id {
            let db_file = accounts_dir.join(acc).join("whatsapp.db");
            if let Ok(meta) = fs::metadata(&db_file) {
                db_size += meta.len();
            }
        } else if let Ok(entries) = fs::read_dir(&accounts_dir) {
            for entry in entries.flatten() {
                let db_file = entry.path().join("whatsapp.db");
                if let Ok(meta) = fs::metadata(&db_file) {
                    db_size += meta.len();
                }
            }
        }
        total_size += db_size;

        // Temp cache size
        let mut temp_size = 0u64;
        let temp_dir = self.base_dir.join("temp");
        if let Ok(entries) = fs::read_dir(&temp_dir) {
            for entry in entries.flatten() {
                if let Ok(meta) = entry.metadata() {
                    temp_size += meta.len();
                }
            }
        }
        total_size += temp_size;

        // Top chats usage - calculated dynamically from real stored messages
        let mut top_chats: Vec<ChatStorageUsage> = Vec::new();
        let data_dir = self.base_dir.join("data");
        if let Ok(entries) = fs::read_dir(&data_dir) {
            let mut chat_names = std::collections::HashMap::new();
            if let Some(acc) = account_id {
                for c in self.load_chats(acc) {
                    chat_names.insert(c.jid, c.name);
                }
            }

            for entry in entries.flatten() {
                let file_name = entry.file_name().to_string_lossy().to_string();
                if file_name.starts_with("msgs_") && file_name.ends_with(".json") {
                    if let Some(acc) = account_id {
                        if !file_name.starts_with(&format!("msgs_{}_", acc)) {
                            continue;
                        }
                    }
                    if let Ok(content) = fs::read_to_string(entry.path()) {
                        if let Ok(msgs) = serde_json::from_str::<Vec<Message>>(&content) {
                            if let Some(first_msg) = msgs.first() {
                                let chat_jid = first_msg.chat_jid.clone();
                                let mut media_count = 0u32;
                                let mut size_bytes = 0u64;
                                for m in &msgs {
                                    if let Some(ref att) = m.media {
                                        media_count += 1;
                                        if let Some(ref lp) = att.local_path {
                                            if let Ok(meta) = fs::metadata(lp) {
                                                size_bytes += meta.len();
                                                continue;
                                            }
                                        }
                                        size_bytes += att.file_size;
                                    }
                                }
                                if media_count > 0 || size_bytes > 0 {
                                    let chat_name =
                                        chat_names.get(&chat_jid).cloned().unwrap_or_else(|| {
                                            chat_jid
                                                .split('@')
                                                .next()
                                                .unwrap_or(&chat_jid)
                                                .to_string()
                                        });
                                    top_chats.push(ChatStorageUsage {
                                        chat_jid,
                                        chat_name,
                                        media_count: media_count as u64,
                                        size_bytes,
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }
        top_chats.sort_by(|a, b| b.size_bytes.cmp(&a.size_bytes));
        top_chats.truncate(5);

        StorageStats {
            total_size_bytes: total_size,
            images: StorageCategoryStats {
                count: images_count,
                size_bytes: images_size,
            },
            videos: StorageCategoryStats {
                count: videos_count,
                size_bytes: videos_size,
            },
            audio: StorageCategoryStats {
                count: audio_count,
                size_bytes: audio_size,
            },
            documents: StorageCategoryStats {
                count: docs_count,
                size_bytes: docs_size,
            },
            stickers: StorageCategoryStats {
                count: stickers_count,
                size_bytes: stickers_size,
            },
            database_size_bytes: db_size,
            temp_cache_size_bytes: temp_size,
            top_chats,
        }
    }

    fn count_category(&self, dir: &Path, count: &mut u64, size: &mut u64) {
        if let Ok(entries) = fs::read_dir(dir) {
            for entry in entries.flatten() {
                if let Ok(meta) = entry.metadata() {
                    if meta.is_file() {
                        *count += 1;
                        *size += meta.len();
                    }
                }
            }
        }
    }

    pub fn clear_media_cache(&self, category: Option<&str>, _older_than_days: Option<u32>) -> u64 {
        let mut freed = 0u64;
        let media_base = self.base_dir.join("media");
        if let Ok(accs) = fs::read_dir(&media_base) {
            for acc in accs.flatten() {
                if acc.path().is_dir() {
                    if let Some(cat) = category {
                        freed += self.delete_dir_contents(&acc.path().join(cat));
                    } else {
                        freed += self.delete_dir_contents(&acc.path());
                    }
                }
            }
        }
        freed
    }

    pub fn clear_chat_cache(&self, chat_jid: &str) -> u64 {
        let mut freed = 0u64;
        let data_dir = self.base_dir.join("data");
        if let Ok(entries) = fs::read_dir(&data_dir) {
            for entry in entries.flatten() {
                let file_name = entry.file_name().to_string_lossy().to_string();
                let sanitized_jid = chat_jid.replace('@', "_").replace('.', "_");
                if file_name.ends_with(&format!("_{}.json", sanitized_jid))
                    && file_name.starts_with("msgs_")
                {
                    if let Ok(content) = fs::read_to_string(entry.path()) {
                        if let Ok(mut msgs) = serde_json::from_str::<Vec<Message>>(&content) {
                            let mut modified = false;
                            for m in &mut msgs {
                                if let Some(ref mut att) = m.media {
                                    if let Some(ref lp) = att.local_path {
                                        let p = Path::new(lp);
                                        if p.exists() {
                                            if let Ok(meta) = fs::metadata(p) {
                                                freed += meta.len();
                                            }
                                            let _ = fs::remove_file(p);
                                        }
                                        att.local_path = None;
                                        att.is_downloaded = false;
                                        att.is_downloading = Some(false);
                                        att.download_progress = Some(0);
                                        modified = true;
                                    }
                                }
                            }
                            if modified {
                                if let Ok(json) = serde_json::to_string_pretty(&msgs) {
                                    let _ = fs::write(entry.path(), json);
                                }
                            }
                        }
                    }
                }
            }
        }
        freed
    }

    pub fn vacuum_database(&self) -> u64 {
        let mut freed = 0u64;
        let accounts_dir = self.base_dir.join("accounts");
        if let Ok(entries) = fs::read_dir(&accounts_dir) {
            for entry in entries.flatten() {
                let db_file = entry.path().join("whatsapp.db");
                if db_file.exists() {
                    let before = fs::metadata(&db_file).map(|m| m.len()).unwrap_or(0);
                    if let Ok(conn) = rusqlite::Connection::open(&db_file) {
                        let _ = conn.execute_batch("VACUUM;");
                        drop(conn);
                    }
                    let after = fs::metadata(&db_file).map(|m| m.len()).unwrap_or(before);
                    freed += before.saturating_sub(after);
                }
            }
        }
        freed
    }

    pub fn clear_all_cache(&self) -> u64 {
        let mut freed = 0u64;
        freed += self.clear_media_cache(None, None);
        let temp_dir = self.base_dir.join("temp");
        freed += self.delete_dir_contents(&temp_dir);
        freed += self.vacuum_database();
        freed
    }

    fn delete_dir_contents(&self, dir: &Path) -> u64 {
        let mut freed = 0u64;
        if let Ok(entries) = fs::read_dir(dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_file() {
                    if let Ok(meta) = entry.metadata() {
                        freed += meta.len();
                    }
                    let _ = fs::remove_file(path);
                } else if path.is_dir() {
                    freed += self.delete_dir_contents(&path);
                    let _ = fs::remove_dir(path);
                }
            }
        }
        freed
    }
}
