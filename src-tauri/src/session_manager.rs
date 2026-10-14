use crate::models::{Account, Message, QrCodeResponse};
use crate::storage::StorageManager;
use std::sync::Arc;
use tauri::{AppHandle, Emitter};
use tokio::sync::Mutex;
use whatsapp_rust::download::MediaType;
use whatsapp_rust::prelude::*;
use whatsapp_rust::types::events::{Event, EventKind};
use whatsapp_rust::wacore_binary::JidExt;
use whatsapp_rust::PictureType;

pub struct SessionManager {
    pub storage: Arc<StorageManager>,
    pub active_account_id: Mutex<Option<String>>,
    pub active_bot_handle: Mutex<Option<whatsapp_rust::bot::BotHandle>>,
    pub active_client: Mutex<Option<Arc<whatsapp_rust::Client>>>,
    pub app_handle: Mutex<Option<AppHandle>>,
    pub current_qr: Arc<Mutex<Option<QrCodeResponse>>>,
    pub current_pairing_code: Arc<Mutex<Option<crate::models::PairingCodeResponse>>>,
}

impl SessionManager {
    pub fn new(storage: Arc<StorageManager>) -> Self {
        let accounts = storage.load_accounts();
        let active_id = accounts.iter().find(|a| a.is_active).map(|a| a.id.clone());

        Self {
            storage,
            active_account_id: Mutex::new(active_id),
            active_bot_handle: Mutex::new(None),
            active_client: Mutex::new(None),
            app_handle: Mutex::new(None),
            current_qr: Arc::new(Mutex::new(None)),
            current_pairing_code: Arc::new(Mutex::new(None)),
        }
    }

    pub async fn get_current_qr(&self) -> Option<QrCodeResponse> {
        let guard = self.current_qr.lock().await;
        guard.clone()
    }

    pub async fn set_app_handle(&self, handle: AppHandle) {
        let mut app = self.app_handle.lock().await;
        *app = Some(handle);
    }

    /// Alterna a conta ativa com isolamento total:
    /// Desconecta o socket da conta anterior e inicia apenas a conta selecionada.
    /// Nenhuma conta inativa processa ou recebe mensagens!
    pub async fn switch_account(&self, target_account_id: &str) -> Result<Account, String> {
        // 1. Desconecta a sessão ativa anterior se houver
        {
            let mut handle_guard = self.active_bot_handle.lock().await;
            if let Some(handle) = handle_guard.take() {
                handle.shutdown().await;
            }
            let mut client_guard = self.active_client.lock().await;
            *client_guard = None;
        }

        // 2. Atualiza estado das contas no armazenamento
        let mut accounts = self.storage.load_accounts();
        let mut target_account = None;

        for acc in &mut accounts {
            if acc.id == target_account_id {
                acc.is_active = true;
                acc.status = "connected".to_string();
                acc.last_connected_at = Some(chrono::Utc::now().timestamp_millis());
                target_account = Some(acc.clone());
            } else {
                acc.is_active = false;
                acc.status = "standby".to_string(); // Inativa / em espera (sem rede)
            }
        }

        let target = target_account.ok_or_else(|| "Conta não encontrada".to_string())?;
        self.storage.save_accounts(&accounts);

        // 3. Define a conta ativa
        {
            let mut active_guard = self.active_account_id.lock().await;
            *active_guard = Some(target_account_id.to_string());
        }

        // 4. Inicia a sessão whatsapp-rust para a conta ativa
        self.spawn_active_session(target_account_id).await?;

        // 5. Emite evento de estado de conexão
        if let Some(app) = self.app_handle.lock().await.as_ref() {
            let _ = app.emit(
                "whatsapp://connection-state",
                serde_json::json!({
                    "accountId": target_account_id,
                    "status": "connected"
                }),
            );
        }

        Ok(target)
    }

    /// Inicia a conexão WhatsApp usando whatsapp-rust para a conta ativa
    pub async fn spawn_active_session(&self, account_id: &str) -> Result<(), String> {
        let db_path = self.storage.account_db_path(account_id);
        let db_path_str = db_path.to_string_lossy().to_string();

        let store = match SqliteStore::new(&db_path_str).await {
            Ok(s) => s,
            Err(e) => {
                eprintln!("[Zappo] Falha ao abrir SqliteStore: {:?}", e);
                return Ok(()); // Permite prosseguir mesmo offline
            }
        };

        let app_handle_opt = self.app_handle.lock().await.clone();
        let app_for_qr = app_handle_opt.clone();
        let acc_for_qr = account_id.to_string();

        let app_for_msg = app_handle_opt.clone();
        let acc_for_msg = account_id.to_string();
        let storage_for_msg = self.storage.clone();

        // Limpa QR e código de pareamento anteriores
        {
            let mut qr_guard = self.current_qr.lock().await;
            *qr_guard = None;
            let mut pair_guard = self.current_pairing_code.lock().await;
            *pair_guard = None;
        }

        let app_for_pair = app_handle_opt.clone();
        let app_for_conn = app_handle_opt.clone();
        let acc_for_conn = account_id.to_string();
        let storage_for_conn = self.storage.clone();

        let app_for_logout = app_handle_opt.clone();
        let acc_for_logout = account_id.to_string();
        let storage_for_logout = self.storage.clone();

        let app_for_sync = app_handle_opt.clone();
        let acc_for_sync = account_id.to_string();
        let storage_for_sync = self.storage.clone();

        let qr_arc = self.current_qr.clone();
        let pair_arc = self.current_pairing_code.clone();

        let bot_result = Bot::builder()
            .with_backend(store)
            .on_qr_code(move |code, timeout| {
                let app = app_for_qr.clone();
                let acc = acc_for_qr.clone();
                let qr_clone = qr_arc.clone();
                async move {
                    let expires_at =
                        chrono::Utc::now().timestamp_millis() + timeout.as_millis() as i64;
                    let resp = QrCodeResponse {
                        qr_data: code,
                        expires_at,
                    };
                    {
                        let mut guard = qr_clone.lock().await;
                        *guard = Some(resp.clone());
                    }
                    if let Some(app) = app {
                        let _ = app.emit("whatsapp://qr-code", resp);
                        let _ = app.emit(
                            "whatsapp://connection-state",
                            serde_json::json!({
                                "accountId": acc,
                                "status": "pairing"
                            }),
                        );
                    }
                }
            })
            .on_pair_code(move |code, timeout| {
                let app = app_for_pair.clone();
                let pair_clone = pair_arc.clone();
                async move {
                    let expires_at =
                        chrono::Utc::now().timestamp_millis() + timeout.as_millis() as i64;
                    let resp = crate::models::PairingCodeResponse { code, expires_at };
                    {
                        let mut guard = pair_clone.lock().await;
                        *guard = Some(resp.clone());
                    }
                    if let Some(app) = app {
                        let _ = app.emit("whatsapp://pairing-code", resp);
                    }
                }
            })
            .on_connected({
                let app = app_for_conn.clone();
                let acc = acc_for_conn.clone();
                let storage = storage_for_conn.clone();
                move |client| {
                    let app = app.clone();
                    let acc = acc.clone();
                    let storage = storage.clone();
                    let client_for_groups = client.clone();
                    async move {
                        println!("[Zappo] Conta {} conectada com sucesso ao WhatsApp!", acc);
                        let mut accounts = storage.load_accounts();
                        if let Some(target) = accounts.iter_mut().find(|a| a.id == acc) {
                            target.status = "connected".to_string();
                            target.is_active = true;
                            target.last_connected_at = Some(chrono::Utc::now().timestamp_millis());
                        }
                        storage.save_accounts(&accounts);

                        let existing_chats = storage.load_chats(&acc);
                        if let Some(app) = &app {
                            let _ = app.emit(
                                "whatsapp://connection-state",
                                serde_json::json!({
                                    "accountId": acc,
                                    "status": "connected"
                                }),
                            );
                            if !existing_chats.is_empty() {
                                let _ = app.emit(
                                    "whatsapp://chats-updated",
                                    serde_json::json!({
                                        "accountId": acc,
                                        "chats": existing_chats,
                                    }),
                                );
                            }
                        }

                        // Sincroniza em background todos os grupos participantes e seus nomes corretos
                        let app_groups = app.clone();
                        let acc_groups = acc.clone();
                        let storage_groups = storage.clone();
                        tokio::spawn(async move {
                            match client_for_groups.groups().get_participating().await {
                                Ok(participating) => {
                                    println!(
                                        "[Zappo] Sincronizados {} grupos participantes para {}",
                                        participating.len(),
                                        acc_groups
                                    );
                                    let mut chats = storage_groups.load_chats(&acc_groups);
                                    let mut changed = false;
                                    let now = chrono::Utc::now().timestamp_millis();

                                    for (jid, meta) in participating {
                                        let jid_str = jid.to_string();
                                        let subject = meta.subject.trim().to_string();
                                        if subject.is_empty() {
                                            continue;
                                        }

                                        if let Some(existing) =
                                            chats.iter_mut().find(|c| c.jid == jid_str)
                                        {
                                            if existing.name != subject || !existing.is_group {
                                                existing.name = subject;
                                                existing.is_group = true;
                                                changed = true;
                                            }
                                        } else {
                                            chats.push(crate::models::Chat {
                                                id: jid_str.clone(),
                                                jid: jid_str,
                                                name: subject,
                                                phone_number: None,
                                                avatar_url: None,
                                                is_group: true,
                                                unread_count: 0,
                                                pinned: false,
                                                archived: false,
                                                is_muted: false,
                                                mute_end_timestamp: None,
                                                last_message: None,
                                                updated_at: now,
                                            });
                                            changed = true;
                                        }
                                    }

                                    if changed {
                                        chats.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
                                        storage_groups.save_chats(&acc_groups, &chats);
                                        if let Some(ref app) = app_groups {
                                            let _ = app.emit(
                                                "whatsapp://chats-updated",
                                                serde_json::json!({
                                                    "accountId": acc_groups,
                                                    "chats": chats
                                                }),
                                            );
                                        }
                                    }
                                }
                                Err(e) => {
                                    eprintln!(
                                        "[Zappo] Erro ao sincronizar grupos participantes: {:?}",
                                        e
                                    );
                                }
                            }
                        });
                    }
                }
            })
            .on_logged_out({
                let app = app_for_logout.clone();
                let acc = acc_for_logout.clone();
                let storage = storage_for_logout.clone();
                move |_| {
                    let app = app.clone();
                    let acc = acc.clone();
                    let storage = storage.clone();
                    async move {
                        println!("[Zappo] Conta {} desconectada do WhatsApp!", acc);
                        let mut accounts = storage.load_accounts();
                        if let Some(target) = accounts.iter_mut().find(|a| a.id == acc) {
                            target.status = "disconnected".to_string();
                            target.is_active = false;
                        }
                        storage.save_accounts(&accounts);

                        if let Some(app) = app {
                            let _ = app.emit(
                                "whatsapp://connection-state",
                                serde_json::json!({
                                    "accountId": acc,
                                    "status": "disconnected"
                                }),
                            );
                        }
                    }
                }
            })
            .on_event_for(&[EventKind::HistorySync], {
                let app = app_for_sync.clone();
                let acc = acc_for_sync.clone();
                let storage = storage_for_sync.clone();
                move |event, _client| {
                    let app = app.clone();
                    let acc = acc.clone();
                    let storage = storage.clone();
                    async move {
                        if let Event::HistorySync(lazy) = event.as_ref() {
                            if let Some(hs) = lazy.get() {
                                println!(
                                    "[Zappo] Recebido HistorySync: {} conversas sincronizadas",
                                    hs.conversations.len()
                                );
                                let mut existing_chats = storage.load_chats(&acc);
                                let mut any_updated = false;

                                for conv in &hs.conversations {
                                    let jid = conv.id.clone();
                                    if jid.is_empty() {
                                        continue;
                                    }

                                    let is_group = jid.ends_with("@g.us");
                                    let chat_name = conv.name.clone().unwrap_or_else(|| {
                                        jid.split('@').next().unwrap_or(&jid).to_string()
                                    });
                                    let unread_count = conv.unread_count.unwrap_or(0);

                                    let mut chat_messages = storage.load_messages(&acc, &jid);
                                    let mut last_msg_preview = None;
                                    let mut latest_timestamp = 0i64;

                                    for hmsg in &conv.messages {
                                        if let Some(wmi) = hmsg.message.as_option() {
                                            let key = wmi.key.as_option();
                                            let msg_id =
                                                key.and_then(|k| k.id.clone()).unwrap_or_else(
                                                    || uuid::Uuid::new_v4().to_string(),
                                                );
                                            let from_me =
                                                key.and_then(|k| k.from_me).unwrap_or(false);
                                            let timestamp =
                                                wmi.message_timestamp.unwrap_or(0) as i64 * 1000;
                                            if timestamp > latest_timestamp {
                                                latest_timestamp = timestamp;
                                            }

                                            let text = wmi
                                                .message
                                                .as_option()
                                                .and_then(|m| m.text_content())
                                                .map(|s| s.to_string());
                                            if text
                                                .as_ref()
                                                .map(|s| s.trim().is_empty())
                                                .unwrap_or(true)
                                            {
                                                continue;
                                            }
                                            let sender_name = wmi.push_name.clone();
                                            let reply_to = wmi
                                                .message
                                                .as_option()
                                                .and_then(extract_quoted_from_proto);

                                            let msg = Message {
                                                id: msg_id.clone(),
                                                chat_jid: jid.clone(),
                                                from_me,
                                                sender_name,
                                                sender_jid: key.and_then(|k| k.participant.clone()),
                                                text: text.clone(),
                                                timestamp: if timestamp > 0 {
                                                    timestamp
                                                } else {
                                                    chrono::Utc::now().timestamp_millis()
                                                },
                                                status: "read".to_string(),
                                                media: None,
                                                reply_to,
                                            };

                                            if !chat_messages.iter().any(|m| m.id == msg.id) {
                                                chat_messages.push(msg);
                                            }

                                            if let Some(t) = text {
                                                last_msg_preview =
                                                    Some(crate::models::LastMessagePreview {
                                                        id: msg_id,
                                                        text: t,
                                                        timestamp: if timestamp > 0 {
                                                            timestamp
                                                        } else {
                                                            chrono::Utc::now().timestamp_millis()
                                                        },
                                                        from_me,
                                                        r#type: "text".to_string(),
                                                        status: Some("read".to_string()),
                                                    });
                                            }
                                        }
                                    }

                                    chat_messages.sort_by_key(|m| m.timestamp);
                                    if !chat_messages.is_empty() {
                                        storage.save_messages(&acc, &jid, &chat_messages);
                                    }

                                    let now = chrono::Utc::now().timestamp_millis();
                                    let chat_ts = if latest_timestamp > 0 {
                                        latest_timestamp
                                    } else {
                                        now
                                    };

                                    if let Some(existing) =
                                        existing_chats.iter_mut().find(|c| c.jid == jid)
                                    {
                                        if existing.name == jid || existing.name.is_empty() {
                                            existing.name = chat_name;
                                        }
                                        if last_msg_preview.is_some() {
                                            existing.last_message = last_msg_preview;
                                        }
                                        existing.updated_at = existing.updated_at.max(chat_ts);
                                        existing.unread_count = unread_count;
                                    } else {
                                        existing_chats.push(crate::models::Chat {
                                            id: jid.clone(),
                                            jid: jid.clone(),
                                            name: chat_name,
                                            phone_number: None,
                                            avatar_url: None,
                                            is_group,
                                            unread_count,
                                            pinned: false,
                                            archived: false,
                                            is_muted: false,
                                            mute_end_timestamp: None,
                                            last_message: last_msg_preview,
                                            updated_at: chat_ts,
                                        });
                                        any_updated = true;
                                    }

                                    if any_updated {
                                        existing_chats
                                            .sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
                                        storage.save_chats(&acc, &existing_chats);

                                        if let Some(ref app) = app {
                                            let _ = app.emit(
                                                "whatsapp://chats-updated",
                                                serde_json::json!({
                                                    "accountId": acc,
                                                    "chats": existing_chats,
                                                }),
                                            );
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            })
            .on_message(move |ctx| {
                let app = app_for_msg.clone();
                let acc = acc_for_msg.clone();
                let storage = storage_for_msg.clone();
                async move {
                    let sender_jid = ctx.info.source.sender.to_string();
                    let chat_jid = ctx.info.source.chat.to_string();
                    let mut is_from_me = ctx.info.source.is_from_me;

                    // Fallback para eco de mensagens em múltiplos dispositivos:
                    // Se o número de telefone da conta bater com o sender, marca como is_from_me
                    if !is_from_me {
                        let accounts = storage.load_accounts();
                        if let Some(this_acc) = accounts.iter().find(|a| a.id == acc) {
                            if let Some(ref phone) = this_acc.phone {
                                let phone_digits: String = phone.chars().filter(|c| c.is_ascii_digit()).collect();
                                let sender_digits: String = sender_jid.chars().filter(|c| c.is_ascii_digit()).collect();
                                if !phone_digits.is_empty() && sender_digits.contains(&phone_digits) {
                                    is_from_me = true;
                                }
                            }
                        }
                    }

                    let msg_id = ctx.info.id.clone();
                    let mut text = ctx.message.text_content().map(|s| s.to_string());

                    // Verifica se há mídia anexada (Fotos, Figurinhas/Stickers, Vídeos, Áudio, Documentos)
                    let mut media_att = None;
                    let settings = storage.load_settings();
                    let is_within_max_size = |size: u64| {
                        if settings.auto_download.max_file_size_mb == 0 {
                            true
                        } else {
                            size <= (settings.auto_download.max_file_size_mb as u64) * 1024 * 1024
                        }
                    };
                    use base64::Engine;
                    let to_b64 = |opt: &Option<Vec<u8>>| {
                        opt.as_ref()
                            .map(|b| base64::engine::general_purpose::STANDARD.encode(b))
                    };

                    // 1. Fotos
                    if let Some(img) = ctx.message.image_message.as_option() {
                        let file_size = img.file_length.unwrap_or(0);
                        let should_download =
                            settings.auto_download.images && is_within_max_size(file_size);
                        let mut is_downloaded = false;
                        let mut local_path = None;

                        if should_download {
                            if let Ok(bytes) = ctx.client.download(img).await {
                                let path = storage
                                    .media_dir(&acc, "images")
                                    .join(format!("{}.jpg", msg_id));
                                if std::fs::write(&path, bytes).is_ok() {
                                    is_downloaded = true;
                                    local_path = Some(path.to_string_lossy().to_string());
                                }
                            }
                        }

                        let thumb = img.jpeg_thumbnail.as_ref().map(|b| {
                            format!(
                                "data:image/jpeg;base64,{}",
                                base64::engine::general_purpose::STANDARD.encode(b)
                            )
                        });

                        media_att = Some(crate::models::MediaAttachment {
                            id: format!("media_{}", msg_id),
                            media_type: "image".to_string(),
                            file_name: Some("foto.jpg".to_string()),
                            file_size,
                            mime_type: img
                                .mimetype
                                .clone()
                                .unwrap_or_else(|| "image/jpeg".to_string()),
                            thumbnail_data_url: thumb,
                            local_path,
                            is_downloaded,
                            is_downloading: Some(false),
                            download_progress: Some(if is_downloaded { 100 } else { 0 }),
                            duration_seconds: None,
                            direct_path: img.direct_path.clone(),
                            media_key: to_b64(&img.media_key),
                            file_sha256: to_b64(&img.file_sha256),
                            file_enc_sha256: to_b64(&img.file_enc_sha256),
                            is_view_once: img.view_once,
                        });
                    }
                    // 2. Figurinhas (Stickers - sempre baixadas para renderizar direto)
                    else if let Some(stk) = ctx.message.sticker_message.as_option() {
                        let file_size = stk.file_length.unwrap_or(0);
                        let mut is_downloaded = false;
                        let mut local_path = None;

                        if let Ok(bytes) = ctx.client.download(stk).await {
                            let path = storage
                                .media_dir(&acc, "stickers")
                                .join(format!("{}.webp", msg_id));
                            if std::fs::write(&path, bytes).is_ok() {
                                is_downloaded = true;
                                local_path = Some(path.to_string_lossy().to_string());
                            }
                        }

                        media_att = Some(crate::models::MediaAttachment {
                            id: format!("media_{}", msg_id),
                            media_type: "sticker".to_string(),
                            file_name: Some("figurinha.webp".to_string()),
                            file_size,
                            mime_type: "image/webp".to_string(),
                            thumbnail_data_url: None,
                            local_path,
                            is_downloaded,
                            is_downloading: Some(false),
                            download_progress: Some(if is_downloaded { 100 } else { 0 }),
                            duration_seconds: None,
                            direct_path: stk.direct_path.clone(),
                            media_key: to_b64(&stk.media_key),
                            file_sha256: to_b64(&stk.file_sha256),
                            file_enc_sha256: to_b64(&stk.file_enc_sha256),
                            is_view_once: None,
                        });
                    }
                    // 3. Vídeos
                    else if let Some(vid) = ctx.message.video_message.as_option() {
                        let file_size = vid.file_length.unwrap_or(0);
                        let should_download =
                            settings.auto_download.videos && is_within_max_size(file_size);
                        let mut is_downloaded = false;
                        let mut local_path = None;

                        if should_download {
                            if let Ok(bytes) = ctx.client.download(vid).await {
                                let path = storage
                                    .media_dir(&acc, "videos")
                                    .join(format!("{}.mp4", msg_id));
                                if std::fs::write(&path, bytes).is_ok() {
                                    is_downloaded = true;
                                    local_path = Some(path.to_string_lossy().to_string());
                                }
                            }
                        }

                        let thumb = vid.jpeg_thumbnail.as_ref().map(|b| {
                            format!(
                                "data:image/jpeg;base64,{}",
                                base64::engine::general_purpose::STANDARD.encode(b)
                            )
                        });

                        media_att = Some(crate::models::MediaAttachment {
                            id: format!("media_{}", msg_id),
                            media_type: "video".to_string(),
                            file_name: Some("video.mp4".to_string()),
                            file_size,
                            mime_type: vid
                                .mimetype
                                .clone()
                                .unwrap_or_else(|| "video/mp4".to_string()),
                            thumbnail_data_url: thumb,
                            local_path,
                            is_downloaded,
                            is_downloading: Some(false),
                            download_progress: Some(if is_downloaded { 100 } else { 0 }),
                            duration_seconds: vid.seconds,
                            direct_path: vid.direct_path.clone(),
                            media_key: to_b64(&vid.media_key),
                            file_sha256: to_b64(&vid.file_sha256),
                            file_enc_sha256: to_b64(&vid.file_enc_sha256),
                            is_view_once: vid.view_once,
                        });
                    }
                    // 4. Áudio / Mensagem de Voz
                    else if let Some(aud) = ctx.message.audio_message.as_option() {
                        let file_size = aud.file_length.unwrap_or(0);
                        let should_download =
                            settings.auto_download.audio && is_within_max_size(file_size);
                        let mut is_downloaded = false;
                        let mut local_path = None;

                        if should_download {
                            if let Ok(bytes) = ctx.client.download(aud).await {
                                let path = storage
                                    .media_dir(&acc, "audio")
                                    .join(format!("{}.ogg", msg_id));
                                if std::fs::write(&path, bytes).is_ok() {
                                    is_downloaded = true;
                                    local_path = Some(path.to_string_lossy().to_string());
                                }
                            }
                        }

                        let is_ptt = aud.ptt.unwrap_or(false);
                        media_att = Some(crate::models::MediaAttachment {
                            id: format!("media_{}", msg_id),
                            media_type: if is_ptt {
                                "voice".to_string()
                            } else {
                                "audio".to_string()
                            },
                            file_name: Some(if is_ptt {
                                "voz.ogg".to_string()
                            } else {
                                "audio.ogg".to_string()
                            }),
                            file_size,
                            mime_type: aud
                                .mimetype
                                .clone()
                                .unwrap_or_else(|| "audio/ogg".to_string()),
                            thumbnail_data_url: None,
                            local_path,
                            is_downloaded,
                            is_downloading: Some(false),
                            download_progress: Some(if is_downloaded { 100 } else { 0 }),
                            duration_seconds: aud.seconds,
                            direct_path: aud.direct_path.clone(),
                            media_key: to_b64(&aud.media_key),
                            file_sha256: to_b64(&aud.file_sha256),
                            file_enc_sha256: to_b64(&aud.file_enc_sha256),
                            is_view_once: aud.view_once,
                        });
                    }
                    // 5. Documentos
                    else if let Some(doc) = ctx.message.document_message.as_option() {
                        let file_size = doc.file_length.unwrap_or(0);
                        let file_name = doc
                            .file_name
                            .clone()
                            .unwrap_or_else(|| "documento.pdf".to_string());
                        let should_download =
                            settings.auto_download.documents && is_within_max_size(file_size);
                        let mut is_downloaded = false;
                        let mut local_path = None;

                        if should_download {
                            if let Ok(bytes) = ctx.client.download(doc).await {
                                let path = storage
                                    .media_dir(&acc, "documents")
                                    .join(format!("{}_{}", msg_id, file_name));
                                if std::fs::write(&path, bytes).is_ok() {
                                    is_downloaded = true;
                                    local_path = Some(path.to_string_lossy().to_string());
                                }
                            }
                        }

                        media_att = Some(crate::models::MediaAttachment {
                            id: format!("media_{}", msg_id),
                            media_type: "document".to_string(),
                            file_name: Some(file_name),
                            file_size,
                            mime_type: doc
                                .mimetype
                                .clone()
                                .unwrap_or_else(|| "application/pdf".to_string()),
                            thumbnail_data_url: None,
                            local_path,
                            is_downloaded,
                            is_downloading: Some(false),
                            download_progress: Some(if is_downloaded { 100 } else { 0 }),
                            duration_seconds: None,
                            direct_path: doc.direct_path.clone(),
                            media_key: to_b64(&doc.media_key),
                            file_sha256: to_b64(&doc.file_sha256),
                            file_enc_sha256: to_b64(&doc.file_enc_sha256),
                            is_view_once: None,
                        });
                    }

                    // Extrai legenda da mídia caso o texto principal não tenha sido preenchido
                    if text.as_ref().map(|s| s.trim().is_empty()).unwrap_or(true) {
                        if let Some(img) = ctx.message.image_message.as_option() {
                            if let Some(ref cap) = img.caption {
                                if !cap.trim().is_empty() {
                                    text = Some(cap.clone());
                                }
                            }
                        } else if let Some(vid) = ctx.message.video_message.as_option() {
                            if let Some(ref cap) = vid.caption {
                                if !cap.trim().is_empty() {
                                    text = Some(cap.clone());
                                }
                            }
                        } else if let Some(doc) = ctx.message.document_message.as_option() {
                            if let Some(ref cap) = doc.caption {
                                if !cap.trim().is_empty() {
                                    text = Some(cap.clone());
                                }
                            }
                        }
                    }

                    // Prevenção de mensagens fantasmas: descarta eventos internos que não têm texto e nem mídia
                    let has_text = text.as_ref().map(|s| !s.trim().is_empty()).unwrap_or(false);
                    let has_media = media_att.is_some();
                    if !has_text && !has_media {
                        return;
                    }

                    let now = chrono::Utc::now().timestamp_millis();
                    let reply_to = extract_quoted_from_proto(&ctx.message);
                    let message = Message {
                        id: msg_id.clone(),
                        chat_jid: chat_jid.clone(),
                        from_me: is_from_me,
                        sender_name: Some(ctx.info.push_name.clone()),
                        sender_jid: Some(sender_jid),
                        text: text.clone(),
                        timestamp: now,
                        status: "read".to_string(),
                        media: media_att.clone(),
                        reply_to,
                    };

                    // 1. Salva a mensagem localmente com deduplicação
                    let mut msgs = storage.load_messages(&acc, &chat_jid);
                    let mut already_exists = false;
                    for m in &mut msgs {
                        if m.id == message.id {
                            already_exists = true;
                            break;
                        }
                        // Unifica mensagem otimista enviada anteriormente por este cliente
                        if m.from_me
                            && is_from_me
                            && m.text == message.text
                            && (m.timestamp - now).abs() < 15000
                        {
                            m.id = message.id.clone();
                            m.status = "read".to_string();
                            already_exists = true;
                            break;
                        }
                    }

                    if !already_exists {
                        msgs.push(message.clone());
                    }
                    msgs.sort_by_key(|m| m.timestamp);
                    storage.save_messages(&acc, &chat_jid, &msgs);

                    // 2. Atualiza ou adiciona a conversa
                    let mut chats = storage.load_chats(&acc);
                    let preview = crate::models::LastMessagePreview {
                        id: msg_id,
                        text: text.unwrap_or_else(|| {
                            if media_att.is_some() {
                                "[Foto]".to_string()
                            } else {
                                "".to_string()
                            }
                        }),
                        timestamp: now,
                        from_me: is_from_me,
                        r#type: if media_att.is_some() {
                            "media".to_string()
                        } else {
                            "text".to_string()
                        },
                        status: Some("read".to_string()),
                    };

                    let is_group = chat_jid.ends_with("@g.us");
                    let chat_title = if is_group {
                        if let Some(existing) = chats.iter().find(|c| c.jid == chat_jid) {
                            if !existing.name.is_empty() && existing.name != chat_jid {
                                existing.name.clone()
                            } else {
                                "Grupo".to_string()
                            }
                        } else {
                            "Grupo".to_string()
                        }
                    } else if !ctx.info.push_name.is_empty() {
                        ctx.info.push_name.clone()
                    } else {
                        chat_jid.split('@').next().unwrap_or(&chat_jid).to_string()
                    };

                    // Se for grupo novo ou com nome padrão "Grupo", busca metadata em background
                    if is_group {
                        let client_grp = ctx.client.clone();
                        let c_jid = chat_jid.clone();
                        let acc_grp = acc.clone();
                        let storage_grp = storage.clone();
                        let app_grp = app.clone();
                        tokio::spawn(async move {
                            if let Ok(parsed_jid) = c_jid.parse::<Jid>() {
                                if let Ok(meta) =
                                    client_grp.groups().get_metadata(&parsed_jid).await
                                {
                                    let subject = meta.subject.trim().to_string();
                                    if !subject.is_empty() {
                                        let mut fresh_chats = storage_grp.load_chats(&acc_grp);
                                        if let Some(target) =
                                            fresh_chats.iter_mut().find(|c| c.jid == c_jid)
                                        {
                                            if target.name != subject {
                                                target.name = subject;
                                                storage_grp.save_chats(&acc_grp, &fresh_chats);
                                                if let Some(ref app) = app_grp {
                                                    let _ = app.emit(
                                                        "whatsapp://chats-updated",
                                                        serde_json::json!({
                                                            "accountId": acc_grp,
                                                            "chats": fresh_chats,
                                                        }),
                                                    );
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        });
                    }

                    if let Some(existing) = chats.iter_mut().find(|c| c.jid == chat_jid) {
                        existing.last_message = Some(preview);
                        existing.updated_at = now;
                        if !is_from_me {
                            existing.unread_count += 1;
                        }
                    } else {
                        chats.push(crate::models::Chat {
                            id: chat_jid.clone(),
                            jid: chat_jid.clone(),
                            name: chat_title,
                            phone_number: None,
                            avatar_url: None,
                            is_group,
                            unread_count: if is_from_me { 0 } else { 1 },
                            pinned: false,
                            archived: false,
                            is_muted: false,
                            mute_end_timestamp: None,
                            last_message: Some(preview),
                            updated_at: now,
                        });
                    }

                    chats.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
                    storage.save_chats(&acc, &chats);

                    // 3. Emite eventos para a interface (apenas se for mensagem nova não duplicada)
                    if let Some(app) = app {
                        if !already_exists {
                            let _ = app.emit(
                                "whatsapp://new-message",
                                serde_json::json!({
                                    "accountId": acc,
                                    "message": message
                                }),
                            );
                        }
                        let _ = app.emit(
                            "whatsapp://chats-updated",
                            serde_json::json!({
                                "accountId": acc,
                                "chats": chats
                            }),
                        );
                    }
                }
            })
            .build()
            .await;

        match bot_result {
            Ok(bot) => {
                let client = bot.client();
                let handle = bot.spawn();

                let mut client_guard = self.active_client.lock().await;
                *client_guard = Some(client);

                let mut handle_guard = self.active_bot_handle.lock().await;
                *handle_guard = Some(handle);
            }
            Err(e) => {
                eprintln!("[Zappo] Erro ao construir bot whatsapp-rust: {:?}", e);
            }
        }

        Ok(())
    }

    pub async fn send_message(
        &self,
        account_id: &str,
        chat_jid: &str,
        text: &str,
        reply_to_id: Option<String>,
    ) -> Result<Message, String> {
        // Resolve mensagem respondida se informada
        let (reply_to, wire_quote_context) = if let Some(ref r_id) = reply_to_id {
            let existing_msgs = self.storage.load_messages(account_id, chat_jid);
            if let Some(m) = existing_msgs.into_iter().find(|m| &m.id == r_id) {
                let r_text = m.text.clone().unwrap_or_else(|| {
                    if let Some(ref med) = m.media {
                        match med.media_type.as_str() {
                            "image" => "📷 Foto".to_string(),
                            "video" => "📹 Vídeo".to_string(),
                            "audio" | "voice" => "🎤 Áudio".to_string(),
                            "sticker" => "✨ Figurinha".to_string(),
                            _ => "📄 Documento".to_string(),
                        }
                    } else {
                        "Mensagem".to_string()
                    }
                });

                let quoted_model = crate::models::QuotedMessage {
                    id: m.id.clone(),
                    sender_name: m.sender_name.unwrap_or_else(|| "Participante".to_string()),
                    text: r_text.clone(),
                };

                // Constrói o contexto da citação no protocolo do WhatsApp
                let target_participant = m.sender_jid.clone().unwrap_or_else(|| {
                    if m.from_me {
                        account_id.to_string()
                    } else {
                        chat_jid.to_string()
                    }
                });

                let dummy_quoted_proto = wa::Message {
                    conversation: Some(r_text),
                    ..Default::default()
                };

                let context_info = wacore::proto_helpers::build_quote_context(
                    &m.id,
                    target_participant,
                    &dummy_quoted_proto,
                );

                (Some(quoted_model), Some(context_info))
            } else {
                (None, None)
            }
        } else {
            (None, None)
        };

        let mut real_msg_id = None;
        let client_opt = self.active_client.lock().await.clone();
        if let Some(client) = client_opt {
            if client.is_connected() {
                if let Ok(jid) = chat_jid.parse::<Jid>() {
                    let wa_msg = if let Some(ctx) = wire_quote_context {
                        wa::Message {
                            extended_text_message: buffa::MessageField::some(
                                wa::message::ExtendedTextMessage {
                                    text: Some(text.to_string()),
                                    context_info: buffa::MessageField::some(ctx),
                                    ..Default::default()
                                },
                            ),
                            ..Default::default()
                        }
                    } else {
                        wa::Message {
                            conversation: Some(text.to_string()),
                            ..Default::default()
                        }
                    };

                    match client.send_message(&jid, wa_msg).await {
                        Ok(res) => {
                            real_msg_id = Some(res.message_id);
                        }
                        Err(e) => {
                            eprintln!("[send_message] Falha ao enviar mensagem: {:?}", e);
                        }
                    }
                }
            }
        }

        let now = chrono::Utc::now().timestamp_millis();
        let msg_id =
            real_msg_id.unwrap_or_else(|| format!("msg_{}_{}", now, uuid::Uuid::new_v4().simple()));

        let message = Message {
            id: msg_id.clone(),
            chat_jid: chat_jid.to_string(),
            from_me: true,
            sender_name: Some("Você".to_string()),
            sender_jid: None,
            text: Some(text.to_string()),
            timestamp: now,
            status: "delivered".to_string(),
            media: None,
            reply_to,
        };

        // Salva na lista de mensagens locais
        let mut msgs = self.storage.load_messages(account_id, chat_jid);
        if !msgs.iter().any(|m| m.id == message.id) {
            msgs.push(message.clone());
            self.storage.save_messages(account_id, chat_jid, &msgs);
        }

        // Atualiza chat
        let mut chats = self.storage.load_chats(account_id);
        if let Some(chat) = chats.iter_mut().find(|c| c.jid == chat_jid) {
            chat.last_message = Some(crate::models::LastMessagePreview {
                id: msg_id,
                text: text.to_string(),
                timestamp: now,
                from_me: true,
                r#type: "text".to_string(),
                status: Some("delivered".to_string()),
            });
            chat.updated_at = now;
            chats.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
            self.storage.save_chats(account_id, &chats);
        }

        // Emite atualização do preview da conversa (o retorno da função já entrega a mensagem para a UI)
        if let Some(app) = self.app_handle.lock().await.as_ref() {
            let _ = app.emit(
                "whatsapp://chats-updated",
                serde_json::json!({
                    "accountId": account_id,
                    "chats": chats
                }),
            );
        }

        Ok(message)
    }

    pub async fn send_media(
        &self,
        account_id: &str,
        chat_jid: &str,
        media_type: &str,
        file_name: &str,
        file_data_base64: &str,
        caption: Option<String>,
        is_view_once: Option<bool>,
    ) -> Result<Message, String> {
        use base64::Engine;
        let clean_b64 = if let Some(idx) = file_data_base64.find(',') {
            &file_data_base64[idx + 1..]
        } else {
            file_data_base64
        };

        let mut bytes = base64::engine::general_purpose::STANDARD
            .decode(clean_b64)
            .map_err(|e| format!("Falha ao decodificar base64: {:?}", e))?;

        if media_type == "sticker" {
            bytes = inject_whatsapp_sticker_metadata(
                &bytes,
                "Zappo",
                "Zappo Desktop",
                "com.zappo.app",
                &["✨", "💬"],
            );
        }

        let mut audio_duration_sec: Option<u32> = None;
        if media_type == "voice" {
            let (converted, dur) = convert_to_ogg_opus(&bytes);
            bytes = converted;
            audio_duration_sec = dur;
        }

        let now = chrono::Utc::now().timestamp_millis();
        let uuid_str = uuid::Uuid::new_v4().simple().to_string();
        let msg_id = format!("media_{}_{}", now, &uuid_str[..8]);

        let sub_folder = match media_type {
            "image" => "images",
            "video" => "videos",
            "audio" | "voice" => "audio",
            "sticker" => "stickers",
            _ => "documents",
        };

        let ext = if media_type == "voice" {
            "ogg"
        } else {
            file_name
                .split('.')
                .last()
                .unwrap_or(if media_type == "image" { "jpg" } else { "bin" })
        };
        let dest = self
            .storage
            .media_dir(account_id, sub_folder)
            .join(format!("{}.{}", msg_id, ext));
        let _ = std::fs::write(&dest, &bytes);
        let dest_str = dest.to_string_lossy().to_string();

        let (wa_media_type, mime_type_str) = match media_type {
            "image" => (MediaType::Image, "image/jpeg"),
            "video" => (MediaType::Video, "video/mp4"),
            "voice" => (MediaType::Audio, "audio/ogg; codecs=opus"),
            "audio" => (MediaType::Audio, "audio/ogg"),
            "sticker" => (MediaType::Sticker, "image/webp"),
            _ => (MediaType::Document, "application/octet-stream"),
        };

        let mut real_msg_id = None;
        let mut upload_meta = None;

        let client_opt = self.active_client.lock().await.clone();
        if let Some(client) = client_opt {
            if client.is_connected() {
                if let Ok(jid) = chat_jid.parse::<Jid>() {
                    match client
                        .upload(bytes.clone(), wa_media_type, Default::default())
                        .await
                    {
                        Ok(upload) => {
                            upload_meta = Some((
                                upload.direct_path.clone(),
                                base64::engine::general_purpose::STANDARD.encode(&upload.media_key),
                                base64::engine::general_purpose::STANDARD
                                    .encode(&upload.file_sha256),
                                base64::engine::general_purpose::STANDARD
                                    .encode(&upload.file_enc_sha256),
                            ));

                            let wa_msg = match media_type {
                                "image" => {
                                    let mut msg = whatsapp_rust::media::image_message(
                                        upload,
                                        whatsapp_rust::media::ImageOptions {
                                            caption: caption.clone(),
                                            mimetype: Some(mime_type_str.to_string()),
                                            ..Default::default()
                                        },
                                    );
                                    if is_view_once.unwrap_or(false) {
                                        msg.image_message.get_or_insert_default().view_once =
                                            is_view_once;
                                    }
                                    msg
                                }
                                "video" => {
                                    let mut msg = whatsapp_rust::media::video_message(
                                        upload,
                                        whatsapp_rust::media::VideoOptions {
                                            caption: caption.clone(),
                                            mimetype: Some(mime_type_str.to_string()),
                                            ..Default::default()
                                        },
                                    );
                                    if is_view_once.unwrap_or(false) {
                                        msg.video_message.get_or_insert_default().view_once =
                                            is_view_once;
                                    }
                                    msg
                                }
                                "audio" | "voice" => {
                                    let is_ptt = media_type == "voice";
                                    // Para notas de voz PTT, o WhatsApp requer um array de waveform de 64 bytes
                                    let waveform = if is_ptt {
                                        Some(vec![
                                            15, 30, 50, 75, 40, 20, 60, 90, 70, 45, 30, 80, 55, 35,
                                            20, 40, 60, 85, 50, 25, 65, 95, 75, 50, 35, 80, 60, 40,
                                            20, 35, 55, 75, 45, 25, 65, 85, 65, 40, 30, 75, 50, 35,
                                            20, 40, 60, 80, 50, 30, 70, 90, 70, 45, 35, 75, 55, 35,
                                            20, 30, 50, 70, 40, 20, 15, 10,
                                        ])
                                    } else {
                                        None
                                    };

                                    let mut msg = whatsapp_rust::media::audio_message(
                                        upload,
                                        whatsapp_rust::media::AudioOptions {
                                            mimetype: Some(mime_type_str.to_string()),
                                            ptt: Some(is_ptt),
                                            duration_seconds: audio_duration_sec,
                                            waveform,
                                            ..Default::default()
                                        },
                                    );
                                    if is_view_once.unwrap_or(false) {
                                        msg.audio_message.get_or_insert_default().view_once =
                                            is_view_once;
                                    }
                                    msg
                                }
                                "sticker" => wa::Message {
                                    sticker_message: MessageField::some(
                                        wa::message::StickerMessage {
                                            url: Some(upload.url),
                                            direct_path: Some(upload.direct_path),
                                            media_key: Some(upload.media_key.to_vec()),
                                            file_sha256: Some(upload.file_sha256.to_vec()),
                                            file_enc_sha256: Some(upload.file_enc_sha256.to_vec()),
                                            file_length: Some(upload.file_length),
                                            media_key_timestamp: Some(upload.media_key_timestamp),
                                            mimetype: Some("image/webp".to_string()),
                                            height: Some(512),
                                            width: Some(512),
                                            ..Default::default()
                                        },
                                    ),
                                    ..Default::default()
                                },
                                _ => whatsapp_rust::media::document_message(
                                    upload,
                                    whatsapp_rust::media::DocumentOptions {
                                        file_name: Some(file_name.to_string()),
                                        caption: caption.clone(),
                                        mimetype: Some(mime_type_str.to_string()),
                                        ..Default::default()
                                    },
                                ),
                            };

                            match client.send_message(&jid, wa_msg).await {
                                Ok(res) => {
                                    real_msg_id = Some(res.message_id);
                                }
                                Err(e) => {
                                    eprintln!(
                                        "[send_media] Falha ao enviar mensagem de mídia: {:?}",
                                        e
                                    );
                                }
                            }
                        }
                        Err(e) => {
                            eprintln!("[send_media] Falha ao fazer upload de mídia: {:?}", e);
                        }
                    }
                }
            }
        }

        let final_id = real_msg_id.unwrap_or(msg_id);
        let (direct_path, media_key, file_sha256, file_enc_sha256) = match upload_meta {
            Some((dp, mk, fs, fe)) => (Some(dp), Some(mk), Some(fs), Some(fe)),
            None => (None, None, None, None),
        };

        let media_att = crate::models::MediaAttachment {
            id: format!("att_{}", final_id),
            media_type: media_type.to_string(),
            file_name: Some(if media_type == "voice" {
                format!("voice_note_{}.ogg", final_id)
            } else {
                file_name.to_string()
            }),
            file_size: bytes.len() as u64,
            mime_type: mime_type_str.to_string(),
            thumbnail_data_url: None,
            local_path: Some(dest_str),
            is_downloaded: true,
            is_downloading: Some(false),
            download_progress: Some(100),
            duration_seconds: audio_duration_sec,
            direct_path,
            media_key,
            file_sha256,
            file_enc_sha256,
            is_view_once,
        };

        let message = Message {
            id: final_id.clone(),
            chat_jid: chat_jid.to_string(),
            from_me: true,
            sender_name: Some("Você".to_string()),
            sender_jid: None,
            text: caption,
            timestamp: now,
            status: "delivered".to_string(),
            media: Some(media_att),
            reply_to: None,
        };

        let mut msgs = self.storage.load_messages(account_id, chat_jid);
        if !msgs.iter().any(|m| m.id == message.id) {
            msgs.push(message.clone());
            self.storage.save_messages(account_id, chat_jid, &msgs);
        }

        let mut chats = self.storage.load_chats(account_id);
        if let Some(chat) = chats.iter_mut().find(|c| c.jid == chat_jid) {
            let label = match media_type {
                "image" => "Foto",
                "video" => "Vídeo",
                "audio" | "voice" => "Áudio",
                "sticker" => "Figurinha",
                _ => "Documento",
            };
            chat.last_message = Some(crate::models::LastMessagePreview {
                id: final_id,
                text: format!("[{}] {}", label, file_name),
                timestamp: now,
                from_me: true,
                r#type: media_type.to_string(),
                status: Some("delivered".to_string()),
            });
            chat.updated_at = now;
            chats.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
            self.storage.save_chats(account_id, &chats);
        }

        if let Some(app) = self.app_handle.lock().await.as_ref() {
            let _ = app.emit(
                "whatsapp://chats-updated",
                serde_json::json!({
                    "accountId": account_id,
                    "chats": chats
                }),
            );
        }

        Ok(message)
    }

    pub async fn download_media(
        &self,
        account_id: &str,
        message_id: &str,
    ) -> Result<String, String> {
        let data_dir = self.storage.base_dir.join("data");
        if let Ok(entries) = std::fs::read_dir(&data_dir) {
            for entry in entries.flatten() {
                let file_name = entry.file_name().to_string_lossy().to_string();
                if file_name.starts_with(&format!("msgs_{}_", account_id))
                    && file_name.ends_with(".json")
                {
                    if let Ok(content) = std::fs::read_to_string(entry.path()) {
                        if let Ok(mut msgs) = serde_json::from_str::<Vec<Message>>(&content) {
                            if let Some(target) = msgs.iter_mut().find(|m| m.id == message_id) {
                                if let Some(ref mut att) = target.media {
                                    let sub_folder = match att.media_type.as_str() {
                                        "image" => "images",
                                        "video" => "videos",
                                        "audio" | "voice" => "audio",
                                        "sticker" => "stickers",
                                        _ => "documents",
                                    };
                                    let ext = match att.media_type.as_str() {
                                        "image" => "jpg",
                                        "video" => "mp4",
                                        "audio" | "voice" => "ogg",
                                        "sticker" => "webp",
                                        _ => "pdf",
                                    };
                                    let dest = self
                                        .storage
                                        .media_dir(account_id, sub_folder)
                                        .join(format!("{}.{}", message_id, ext));

                                    // Se o arquivo já existe mas tinha tamanho corrupto (<= 1024 bytes), remove para baixar real
                                    if let Ok(meta) = std::fs::metadata(&dest) {
                                        if meta.len() <= 1024 {
                                            let _ = std::fs::remove_file(&dest);
                                        }
                                    }

                                    // Baixa do WhatsApp CDN caso ainda não esteja no disco
                                    if !dest.exists() {
                                        use base64::Engine;
                                        if let (
                                            Some(dp),
                                            Some(mk_b64),
                                            Some(fs_b64),
                                            Some(fe_b64),
                                        ) = (
                                            &att.direct_path,
                                            &att.media_key,
                                            &att.file_sha256,
                                            &att.file_enc_sha256,
                                        ) {
                                            if let (Ok(mk), Ok(fs), Ok(fe)) = (
                                                base64::engine::general_purpose::STANDARD
                                                    .decode(mk_b64),
                                                base64::engine::general_purpose::STANDARD
                                                    .decode(fs_b64),
                                                base64::engine::general_purpose::STANDARD
                                                    .decode(fe_b64),
                                            ) {
                                                let wa_media_type = match att.media_type.as_str() {
                                                    "image" => MediaType::Image,
                                                    "video" => MediaType::Video,
                                                    "audio" | "voice" => MediaType::Audio,
                                                    "sticker" => MediaType::Sticker,
                                                    _ => MediaType::Document,
                                                };
                                                let params = whatsapp_rust::download::DownloadParams::encrypted(
                                                    dp,
                                                    &mk,
                                                    &fs,
                                                    &fe,
                                                    att.file_size,
                                                    wa_media_type,
                                                );
                                                let client_opt =
                                                    self.active_client.lock().await.clone();
                                                if let Some(client) = client_opt {
                                                    if client.is_connected() {
                                                        match client.download(&params).await {
                                                            Ok(bytes) => {
                                                                if let Err(e) =
                                                                    std::fs::write(&dest, bytes)
                                                                {
                                                                    return Err(format!("Falha ao salvar mídia em disco: {:?}", e));
                                                                }
                                                            }
                                                            Err(e) => {
                                                                return Err(format!("Falha ao baixar mídia do WhatsApp: {:?}", e));
                                                            }
                                                        }
                                                    } else {
                                                        return Err("WhatsApp não está conectado para baixar a mídia.".to_string());
                                                    }
                                                } else {
                                                    return Err(
                                                        "Nenhuma sessão ativa para baixar a mídia."
                                                            .to_string(),
                                                    );
                                                }
                                            }
                                        }
                                    }

                                    if !dest.exists() {
                                        return Err("Não foi possível obter o arquivo de mídia."
                                            .to_string());
                                    }

                                    let dest_str = dest.to_string_lossy().to_string();
                                    att.is_downloaded = true;
                                    att.local_path = Some(dest_str.clone());
                                    att.is_downloading = Some(false);
                                    att.download_progress = Some(100);

                                    if let Ok(json) = serde_json::to_string_pretty(&msgs) {
                                        let _ = std::fs::write(entry.path(), json);
                                    }
                                    return Ok(dest_str);
                                }
                            }
                        }
                    }
                }
            }
        }

        Err("Mensagem com anexo não encontrada.".to_string())
    }

    pub async fn clear_chat_messages(
        &self,
        account_id: &str,
        chat_jid: &str,
    ) -> Result<(), String> {
        let client_opt = self.active_client.lock().await.clone();
        if let Some(client) = client_opt {
            if client.is_connected() {
                if let Ok(jid) = chat_jid.parse::<Jid>() {
                    let _ = client
                        .chat_actions()
                        .clear_chat(&jid, false, false, None)
                        .await;
                }
            }
        }
        self.storage.clear_chat_messages(account_id, chat_jid);
        Ok(())
    }

    pub async fn delete_chat(&self, account_id: &str, chat_jid: &str) -> Result<(), String> {
        let client_opt = self.active_client.lock().await.clone();
        if let Some(client) = client_opt {
            if client.is_connected() {
                if let Ok(jid) = chat_jid.parse::<Jid>() {
                    let _ = client.chat_actions().delete_chat(&jid, false, None).await;
                }
            }
        }
        self.storage.delete_chat(account_id, chat_jid);
        Ok(())
    }

    pub async fn start_chat(
        &self,
        account_id: &str,
        phone_number: &str,
        name: Option<&str>,
    ) -> Result<crate::models::Chat, String> {
        let clean_digits: String = phone_number
            .chars()
            .filter(|c| c.is_ascii_digit())
            .collect();
        if clean_digits.is_empty() {
            return Err("Número de telefone inválido".to_string());
        }

        let chat_jid = format!("{}@s.whatsapp.net", clean_digits);
        let mut chats = self.storage.load_chats(account_id);

        // Desduplicação: verifica se já existe conversa com esse JID exato
        // ou se o número termina com os dígitos informados (para lidar com 9º dígito / DDI)
        if let Some(existing) = chats.iter().find(|c| {
            if c.jid == chat_jid {
                return true;
            }
            if let Some(phone) = &c.phone_number {
                let p_clean: String = phone.chars().filter(|ch| ch.is_ascii_digit()).collect();
                if p_clean == clean_digits {
                    return true;
                }
                if clean_digits.len() >= 8 && p_clean.len() >= 8 {
                    let min_len = 8.min(clean_digits.len().min(p_clean.len()));
                    return clean_digits.ends_with(&p_clean[p_clean.len() - min_len..])
                        || p_clean.ends_with(&clean_digits[clean_digits.len() - min_len..]);
                }
            }
            false
        }) {
            return Ok(existing.clone());
        }

        let now = chrono::Utc::now().timestamp_millis();
        let display_name = match name {
            Some(n) if !n.trim().is_empty() => n.trim().to_string(),
            _ => format!("+{}", clean_digits),
        };

        let new_chat = crate::models::Chat {
            id: chat_jid.clone(),
            jid: chat_jid.clone(),
            name: display_name,
            phone_number: Some(clean_digits),
            avatar_url: None,
            is_group: false,
            unread_count: 0,
            pinned: false,
            archived: false,
            is_muted: false,
            mute_end_timestamp: None,
            last_message: None,
            updated_at: now,
        };

        chats.insert(0, new_chat.clone());
        self.storage.save_chats(account_id, &chats);

        if let Some(app) = self.app_handle.lock().await.as_ref() {
            let _ = app.emit(
                "whatsapp://chats-updated",
                serde_json::json!({
                    "accountId": account_id,
                    "chats": chats
                }),
            );
        }

        Ok(new_chat)
    }

    pub async fn sync_groups(&self, account_id: &str) -> Result<Vec<crate::models::Chat>, String> {
        let client_opt = self.active_client.lock().await.clone();
        if let Some(client) = client_opt {
            if client.is_connected() {
                match client.groups().get_participating().await {
                    Ok(participating) => {
                        let mut chats = self.storage.load_chats(account_id);
                        let mut changed = false;
                        let now = chrono::Utc::now().timestamp_millis();

                        for (jid, meta) in participating {
                            let jid_str = jid.to_string();
                            let subject = meta.subject.trim().to_string();
                            if subject.is_empty() {
                                continue;
                            }

                            if let Some(existing) = chats.iter_mut().find(|c| c.jid == jid_str) {
                                if existing.name != subject || !existing.is_group {
                                    existing.name = subject;
                                    existing.is_group = true;
                                    changed = true;
                                }
                            } else {
                                chats.push(crate::models::Chat {
                                    id: jid_str.clone(),
                                    jid: jid_str,
                                    name: subject,
                                    phone_number: None,
                                    avatar_url: None,
                                    is_group: true,
                                    unread_count: 0,
                                    pinned: false,
                                    archived: false,
                                    is_muted: false,
                                    mute_end_timestamp: None,
                                    last_message: None,
                                    updated_at: now,
                                });
                                changed = true;
                            }
                        }

                        if changed {
                            chats.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
                            self.storage.save_chats(account_id, &chats);
                            if let Some(app) = self.app_handle.lock().await.as_ref() {
                                let _ = app.emit(
                                    "whatsapp://chats-updated",
                                    serde_json::json!({
                                        "accountId": account_id,
                                        "chats": chats
                                    }),
                                );
                            }
                        }
                        return Ok(chats);
                    }
                    Err(e) => return Err(format!("Erro ao buscar grupos: {:?}", e)),
                }
            }
        }
        Ok(self.storage.load_chats(account_id))
    }

    pub async fn disconnect_active(&self) -> Result<(), String> {
        let mut handle_guard = self.active_bot_handle.lock().await;
        if let Some(handle) = handle_guard.take() {
            handle.shutdown().await;
        }
        let mut client_guard = self.active_client.lock().await;
        *client_guard = None;

        let mut accounts = self.storage.load_accounts();
        for acc in &mut accounts {
            if acc.is_active {
                acc.status = "disconnected".to_string();
                acc.is_active = false;
            }
        }
        self.storage.save_accounts(&accounts);

        Ok(())
    }

    /// Busca a foto de perfil de um contato ou grupo no WhatsApp
    pub async fn get_profile_picture(&self, jid_str: &str) -> Result<Option<String>, String> {
        let client_opt = self.active_client.lock().await.clone();
        if let Some(client) = client_opt {
            if client.is_connected() {
                if let Ok(jid) = jid_str.parse::<Jid>() {
                    if jid.is_group() {
                        match client
                            .groups()
                            .get_profile_pictures(vec![jid], PictureType::Preview)
                            .await
                        {
                            Ok(pics) => {
                                if let Some(p) = pics.into_iter().next() {
                                    return Ok(p.url);
                                }
                            }
                            Err(e) => {
                                eprintln!("Erro ao buscar foto do grupo {}: {:?}", jid_str, e);
                            }
                        }
                    } else {
                        match client.contacts().get_profile_picture(&jid, true).await {
                            Ok(Some(pic)) => return Ok(Some(pic.url)),
                            Ok(None) => return Ok(None),
                            Err(e) => {
                                eprintln!("Erro ao buscar foto do contato {}: {:?}", jid_str, e);
                            }
                        }
                    }
                }
            }
        }
        Ok(None)
    }

    /// Obtém detalhes dos participantes e administradores de um grupo
    pub async fn get_group_members(
        &self,
        group_jid_str: &str,
    ) -> Result<Vec<crate::models::GroupParticipant>, String> {
        let client_opt = self.active_client.lock().await.clone();
        if let Some(client) = client_opt {
            if client.is_connected() {
                let jid = group_jid_str
                    .parse::<Jid>()
                    .map_err(|e| format!("JID inválido: {:?}", e))?;

                let meta = client
                    .groups()
                    .get_metadata(&jid)
                    .await
                    .map_err(|e| format!("Erro ao obter metadados do grupo: {:?}", e))?;

                let participants = meta
                    .participants
                    .into_iter()
                    .map(|p| {
                        let p_jid_str = p.jid.to_string();
                        let phone =
                            p.phone_number
                                .as_ref()
                                .map(|j| j.user.to_string())
                                .or_else(|| {
                                    if !p.jid.is_lid() {
                                        Some(p.jid.user.to_string())
                                    } else {
                                        None
                                    }
                                });
                        let display_name = p.username.as_ref().map(|u| u.to_string());
                        let is_admin = p.is_admin();
                        let is_super_admin = p.is_super_admin();

                        crate::models::GroupParticipant {
                            jid: p_jid_str,
                            phone,
                            display_name,
                            is_admin,
                            is_super_admin,
                            avatar_url: None,
                        }
                    })
                    .collect();

                return Ok(participants);
            }
        }
        Err("Sessão do WhatsApp não conectada".to_string())
    }

    /// Adiciona um novo participante ao grupo usando JID ou número de telefone
    pub async fn add_group_participant(
        &self,
        group_jid_str: &str,
        phone_or_jid: &str,
    ) -> Result<(), String> {
        let client_opt = self.active_client.lock().await.clone();
        if let Some(client) = client_opt {
            if client.is_connected() {
                let group_jid = group_jid_str
                    .parse::<Jid>()
                    .map_err(|e| format!("JID do grupo inválido: {:?}", e))?;

                let clean = phone_or_jid.replace(['+', '-', ' ', '(', ')'], "");
                let participant_jid_str = if clean.contains('@') {
                    clean
                } else {
                    format!("{}@s.whatsapp.net", clean)
                };

                let participant_jid = participant_jid_str
                    .parse::<Jid>()
                    .map_err(|e| format!("JID do participante inválido: {:?}", e))?;

                client
                    .groups()
                    .add_participants(&group_jid, &[participant_jid])
                    .await
                    .map_err(|e| format!("Erro ao adicionar participante: {:?}", e))?;

                return Ok(());
            }
        }
        Err("Sessão do WhatsApp não conectada".to_string())
    }

    /// Sai de um grupo no WhatsApp
    pub async fn leave_group(&self, account_id: &str, group_jid_str: &str) -> Result<(), String> {
        let client_opt = self.active_client.lock().await.clone();
        if let Some(client) = client_opt {
            if client.is_connected() {
                let group_jid = group_jid_str
                    .parse::<Jid>()
                    .map_err(|e| format!("JID do grupo inválido: {:?}", e))?;

                client
                    .groups()
                    .leave(&group_jid)
                    .await
                    .map_err(|e| format!("Erro ao sair do grupo: {:?}", e))?;
            }
        }

        // Atualiza armazenamento local caso grupo ainda esteja salvo
        let mut chats = self.storage.load_chats(account_id);
        chats.retain(|c| c.jid != group_jid_str);
        self.storage.save_chats(account_id, &chats);

        if let Some(app) = self.app_handle.lock().await.as_ref() {
            let _ = app.emit(
                "whatsapp://chats-updated",
                serde_json::json!({
                    "accountId": account_id,
                    "chats": chats
                }),
            );
        }

        Ok(())
    }

    /// Silencia notificações de uma conversa (grupo ou contato)
    pub async fn mute_chat(
        &self,
        account_id: &str,
        chat_jid_str: &str,
        mute_end_timestamp_ms: Option<i64>,
    ) -> Result<(), String> {
        let client_opt = self.active_client.lock().await.clone();
        if let Some(client) = client_opt {
            if client.is_connected() {
                if let Ok(jid) = chat_jid_str.parse::<Jid>() {
                    if let Some(until) = mute_end_timestamp_ms {
                        let _ = client.chat_actions().mute_chat_until(&jid, until).await;
                    } else {
                        let _ = client.chat_actions().mute_chat(&jid).await;
                    }
                }
            }
        }

        let mut chats = self.storage.load_chats(account_id);
        if let Some(chat) = chats.iter_mut().find(|c| c.jid == chat_jid_str) {
            chat.is_muted = true;
            chat.mute_end_timestamp = mute_end_timestamp_ms;
            self.storage.save_chats(account_id, &chats);

            if let Some(app) = self.app_handle.lock().await.as_ref() {
                let _ = app.emit(
                    "whatsapp://chats-updated",
                    serde_json::json!({
                        "accountId": account_id,
                        "chats": chats
                    }),
                );
            }
        }

        Ok(())
    }

    /// Desfaz o silenciamento de uma conversa
    pub async fn unmute_chat(&self, account_id: &str, chat_jid_str: &str) -> Result<(), String> {
        let client_opt = self.active_client.lock().await.clone();
        if let Some(client) = client_opt {
            if client.is_connected() {
                if let Ok(jid) = chat_jid_str.parse::<Jid>() {
                    let _ = client.chat_actions().unmute_chat(&jid).await;
                }
            }
        }

        let mut chats = self.storage.load_chats(account_id);
        if let Some(chat) = chats.iter_mut().find(|c| c.jid == chat_jid_str) {
            chat.is_muted = false;
            chat.mute_end_timestamp = None;
            self.storage.save_chats(account_id, &chats);

            if let Some(app) = self.app_handle.lock().await.as_ref() {
                let _ = app.emit(
                    "whatsapp://chats-updated",
                    serde_json::json!({
                        "accountId": account_id,
                        "chats": chats
                    }),
                );
            }
        }

        Ok(())
    }

    /// Envia reação com emoji para mensagem no WhatsApp
    pub async fn send_reaction(
        &self,
        chat_jid_str: &str,
        message_id: &str,
        from_me: bool,
        participant_jid_str: Option<&str>,
        emoji: &str,
    ) -> Result<(), String> {
        let client_opt = self.active_client.lock().await.clone();
        if let Some(client) = client_opt {
            if client.is_connected() {
                let chat_jid = chat_jid_str
                    .parse::<Jid>()
                    .map_err(|e| format!("JID inválido: {:?}", e))?;

                let mut key = wa::MessageKey::default();
                key.remote_jid = Some(chat_jid_str.to_string());
                key.id = Some(message_id.to_string());
                key.from_me = Some(from_me);

                if let Some(part) = participant_jid_str {
                    key.participant = Some(part.to_string());
                }

                client
                    .send_reaction(&chat_jid, key, emoji)
                    .await
                    .map_err(|e| format!("Erro ao enviar reação: {:?}", e))?;

                return Ok(());
            }
        }
        Err("Sessão do WhatsApp não conectada".to_string())
    }
}

/// Injeta metadados de figurinha (EXIF compatível com WhatsApp) no arquivo WebP.
///
/// O WhatsApp decodifica metadados em um chunk EXIF contendo um cabeçalho TIFF
/// com a tag customizada 0x5741 ('WA') apontando para um JSON UTF-8 com:
/// - sticker-pack-id
/// - sticker-pack-name
/// - sticker-pack-publisher
/// - emojis
pub fn inject_whatsapp_sticker_metadata(
    webp_bytes: &[u8],
    pack_name: &str,
    author: &str,
    pack_id: &str,
    emojis: &[&str],
) -> Vec<u8> {
    if webp_bytes.len() < 12 {
        return webp_bytes.to_vec();
    }
    // Verifica assinatura RIFF .... WEBP
    if &webp_bytes[0..4] != b"RIFF" || &webp_bytes[8..12] != b"WEBP" {
        return webp_bytes.to_vec();
    }

    let json_val = serde_json::json!({
        "sticker-pack-id": pack_id,
        "sticker-pack-name": pack_name,
        "sticker-pack-publisher": author,
        "android-app-store-link": "https://github.com/marcuth/Zappo",
        "ios-app-store-link": "https://github.com/marcuth/Zappo",
        "emojis": emojis
    });

    let json_bytes = match serde_json::to_vec(&json_val) {
        Ok(b) => b,
        Err(_) => return webp_bytes.to_vec(),
    };

    // Monta o payload TIFF EXIF:
    // Header (8 bytes): 'II' (0x4949 little-endian), 0x002A (magic), offset to IFD0 = 8 (0x00000008)
    // IFD0:
    //   num_entries = 1 (2 bytes: 0x0001)
    //   Entry 0:
    //     tag = 0x5741 (2 bytes: 0x41, 0x57)
    //     type = 7 (UNDEFINED, 2 bytes: 0x07, 0x00)
    //     count = json_len (4 bytes LE)
    //     value_or_offset = 22 (0x16, 0x00, 0x00, 0x00) -> 8 + 2 + 12 = 22 bytes offset to data
    //   next_ifd_offset = 0 (4 bytes: 0x00000000)
    // Data:
    //   json_bytes
    let mut exif_payload = Vec::with_capacity(26 + json_bytes.len());
    exif_payload.extend_from_slice(&[0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00]);
    exif_payload.extend_from_slice(&[0x01, 0x00]);
    exif_payload.extend_from_slice(&[0x41, 0x57, 0x07, 0x00]);
    exif_payload.extend_from_slice(&(json_bytes.len() as u32).to_le_bytes());
    exif_payload.extend_from_slice(&[0x16, 0x00, 0x00, 0x00]);
    exif_payload.extend_from_slice(&[0x00, 0x00, 0x00, 0x00]);
    exif_payload.extend_from_slice(&json_bytes);

    // Agora reconstroi ou anexa ao container WebP
    // Se o primeiro chunk for VP8X (bytes 12..16 == b"VP8X"), podemos ativar a flag EXIF (bit 3 / 0x08)
    // e remover qualquer chunk EXIF existente, inserindo o novo.
    let mut chunks: Vec<(&[u8], &[u8])> = Vec::new();
    let mut offset = 12;
    let mut _has_vp8x = false;
    let mut vp8x_flags: u8 = 0;
    let mut canvas_width = 512u32;
    let mut canvas_height = 512u32;

    while offset + 8 <= webp_bytes.len() {
        let fourcc = &webp_bytes[offset..offset + 4];
        let chunk_len = u32::from_le_bytes([
            webp_bytes[offset + 4],
            webp_bytes[offset + 5],
            webp_bytes[offset + 6],
            webp_bytes[offset + 7],
        ]) as usize;

        let data_start = offset + 8;
        let data_end = (data_start + chunk_len).min(webp_bytes.len());
        let chunk_data = &webp_bytes[data_start..data_end];

        if fourcc == b"VP8X" && chunk_data.len() >= 10 {
            _has_vp8x = true;
            vp8x_flags = chunk_data[0];
            // Dimensões canvas em VP8X: 24-bit width-1, 24-bit height-1
            canvas_width = 1
                + (chunk_data[4] as u32
                    | ((chunk_data[5] as u32) << 8)
                    | ((chunk_data[6] as u32) << 16));
            canvas_height = 1
                + (chunk_data[7] as u32
                    | ((chunk_data[8] as u32) << 8)
                    | ((chunk_data[9] as u32) << 16));
        } else if fourcc != b"EXIF" {
            // Ignora chunks EXIF antigos para substituir pelo novo
            chunks.push((fourcc, chunk_data));
        }

        // Chunks no WebP têm padding de 1 byte se o tamanho for ímpar
        let padded_size = 8 + chunk_len + (chunk_len % 2);
        offset += padded_size;
    }

    // Flag EXIF bit 3 = 0x08
    vp8x_flags |= 0x08;

    let mut new_webp = Vec::new();
    new_webp.extend_from_slice(b"RIFF");
    new_webp.extend_from_slice(&[0, 0, 0, 0]); // reservado para o tamanho total
    new_webp.extend_from_slice(b"WEBP");

    // Escreve VP8X atualizado ou criado
    new_webp.extend_from_slice(b"VP8X");
    new_webp.extend_from_slice(&10u32.to_le_bytes()); // tamanho do payload VP8X = 10
    let mut vp8x_payload = [0u8; 10];
    vp8x_payload[0] = vp8x_flags;
    let w_val = canvas_width.saturating_sub(1);
    let h_val = canvas_height.saturating_sub(1);
    vp8x_payload[4] = (w_val & 0xFF) as u8;
    vp8x_payload[5] = ((w_val >> 8) & 0xFF) as u8;
    vp8x_payload[6] = ((w_val >> 16) & 0xFF) as u8;
    vp8x_payload[7] = (h_val & 0xFF) as u8;
    vp8x_payload[8] = ((h_val >> 8) & 0xFF) as u8;
    vp8x_payload[9] = ((h_val >> 16) & 0xFF) as u8;
    new_webp.extend_from_slice(&vp8x_payload);

    // Escreve os demais chunks (VP8, VP8L, ANIM, etc.)
    for (fourcc, data) in chunks {
        new_webp.extend_from_slice(fourcc);
        new_webp.extend_from_slice(&(data.len() as u32).to_le_bytes());
        new_webp.extend_from_slice(data);
        if data.len() % 2 != 0 {
            new_webp.push(0x00);
        }
    }

    // Escreve o novo chunk EXIF
    new_webp.extend_from_slice(b"EXIF");
    new_webp.extend_from_slice(&(exif_payload.len() as u32).to_le_bytes());
    new_webp.extend_from_slice(&exif_payload);
    if exif_payload.len() % 2 != 0 {
        new_webp.push(0x00);
    }

    // Atualiza tamanho no RIFF (tamanho total - 8)
    let total_riff_size = (new_webp.len() - 8) as u32;
    new_webp[4..8].copy_from_slice(&total_riff_size.to_le_bytes());

    new_webp
}

/// Helper para converter áudio gravado (WebM ou outro formato) em Ogg/Opus
/// compatível com notas de voz do WhatsApp e extrair a duração real em segundos.
fn convert_to_ogg_opus(input_bytes: &[u8]) -> (Vec<u8>, Option<u32>) {
    let temp_dir = std::env::temp_dir();
    let nonce = uuid::Uuid::new_v4().simple().to_string();
    let in_file = temp_dir.join(format!("zappo_in_{}.bin", nonce));
    let out_file = temp_dir.join(format!("zappo_out_{}.ogg", nonce));

    if let Err(e) = std::fs::write(&in_file, input_bytes) {
        eprintln!(
            "[audio_convert] Falha ao escrever arquivo temporário: {:?}",
            e
        );
        return (input_bytes.to_vec(), None);
    }

    #[cfg(target_os = "windows")]
    use std::os::windows::process::CommandExt;
    use std::process::Command;

    let mut cmd = Command::new("ffmpeg");
    #[cfg(target_os = "windows")]
    cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW

    let res = cmd
        .arg("-y")
        .arg("-i")
        .arg(&in_file)
        .arg("-c:a")
        .arg("libopus")
        .arg("-b:a")
        .arg("32k")
        .arg("-vbr")
        .arg("on")
        .arg("-application")
        .arg("voip")
        .arg("-f")
        .arg("ogg")
        .arg(&out_file)
        .output();

    let converted_bytes = match res {
        Ok(out) if out.status.success() && out_file.exists() => {
            std::fs::read(&out_file).unwrap_or_else(|_| input_bytes.to_vec())
        }
        err => {
            eprintln!(
                "[audio_convert] ffmpeg falhou ou não está instalado: {:?}",
                err
            );
            input_bytes.to_vec()
        }
    };

    // Extrai duração usando ffprobe
    let mut probe_cmd = Command::new("ffprobe");
    #[cfg(target_os = "windows")]
    probe_cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW

    let probe_target = if out_file.exists() {
        &out_file
    } else {
        &in_file
    };
    let duration = probe_cmd
        .arg("-v")
        .arg("error")
        .arg("-show_entries")
        .arg("format=duration")
        .arg("-of")
        .arg("default=noprint_wrappers=1:nokey=1")
        .arg(probe_target)
        .output()
        .ok()
        .and_then(|out| {
            let s = String::from_utf8_lossy(&out.stdout).trim().to_string();
            s.parse::<f64>().ok().map(|secs| secs.round() as u32)
        });

    let _ = std::fs::remove_file(in_file);
    let _ = std::fs::remove_file(out_file);

    (converted_bytes, duration)
}

/// Extrai a mensagem citada (reply_to) de um wa::Message recebido
fn extract_quoted_from_proto(msg: &wa::Message) -> Option<crate::models::QuotedMessage> {
    let base = msg.get_base_message();
    let ctx = base
        .extended_text_message
        .as_option()
        .and_then(|m| m.context_info.as_option())
        .or_else(|| {
            base.image_message
                .as_option()
                .and_then(|m| m.context_info.as_option())
        })
        .or_else(|| {
            base.video_message
                .as_option()
                .and_then(|m| m.context_info.as_option())
        })
        .or_else(|| {
            base.audio_message
                .as_option()
                .and_then(|m| m.context_info.as_option())
        })
        .or_else(|| {
            base.document_message
                .as_option()
                .and_then(|m| m.context_info.as_option())
        })
        .or_else(|| {
            base.sticker_message
                .as_option()
                .and_then(|m| m.context_info.as_option())
        })
        .or_else(|| {
            base.location_message
                .as_option()
                .and_then(|m| m.context_info.as_option())
        })
        .or_else(|| {
            base.contact_message
                .as_option()
                .and_then(|m| m.context_info.as_option())
        })
        .or_else(|| {
            base.buttons_message
                .as_option()
                .and_then(|m| m.context_info.as_option())
        })
        .or_else(|| {
            base.template_message
                .as_option()
                .and_then(|m| m.context_info.as_option())
        })
        .or_else(|| {
            base.list_message
                .as_option()
                .and_then(|m| m.context_info.as_option())
        })
        .or_else(|| {
            base.poll_creation_message
                .as_option()
                .and_then(|m| m.context_info.as_option())
        })
        .or_else(|| {
            base.poll_creation_message_v2
                .as_option()
                .and_then(|m| m.context_info.as_option())
        })
        .or_else(|| {
            base.poll_creation_message_v3
                .as_option()
                .and_then(|m| m.context_info.as_option())
        })
        .or_else(|| {
            base.group_invite_message
                .as_option()
                .and_then(|m| m.context_info.as_option())
        })
        .or_else(|| {
            base.order_message
                .as_option()
                .and_then(|m| m.context_info.as_option())
        });

    let ctx = ctx?;
    let stanza_id = ctx.stanza_id.clone()?;
    let participant = ctx
        .participant
        .clone()
        .unwrap_or_else(|| "Participante".to_string());

    let text = if let Some(q_msg) = ctx.quoted_message.as_option() {
        if let Some(t) = q_msg.text_content() {
            t.to_string()
        } else if let Some(cap) = q_msg.get_caption() {
            cap.to_string()
        } else if q_msg.image_message.is_set() {
            "📷 Foto".to_string()
        } else if q_msg.video_message.is_set() {
            "📹 Vídeo".to_string()
        } else if q_msg.audio_message.is_set() {
            "🎤 Áudio".to_string()
        } else if q_msg.sticker_message.is_set() {
            "✨ Figurinha".to_string()
        } else if q_msg.document_message.is_set() {
            "📄 Documento".to_string()
        } else {
            "Mensagem".to_string()
        }
    } else {
        "Mensagem".to_string()
    };

    Some(crate::models::QuotedMessage {
        id: stanza_id,
        sender_name: participant,
        text,
    })
}
