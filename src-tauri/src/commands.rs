use crate::models::{
    Account, AppSettings, Chat, GroupParticipant, Message, PairingCodeResponse, QrCodeResponse,
    StorageStats,
};
use crate::session_manager::SessionManager;
use crate::storage::StorageManager;
use std::sync::Arc;
use tauri::State;

pub struct AppState {
    pub storage: Arc<StorageManager>,
    pub session_mgr: Arc<SessionManager>,
}

#[tauri::command]
pub fn get_accounts(state: State<AppState>) -> Vec<Account> {
    state.storage.load_accounts()
}

#[tauri::command]
pub fn get_active_account(state: State<AppState>) -> Option<Account> {
    state
        .storage
        .load_accounts()
        .into_iter()
        .find(|a| a.is_active)
}

#[tauri::command]
pub async fn create_account(
    state: State<'_, AppState>,
    name: String,
    phone_number: Option<String>,
) -> Result<Account, String> {
    let mut accounts = state.storage.load_accounts();
    let new_id = format!("acc_{}", uuid::Uuid::new_v4().simple());

    let new_acc = Account {
        id: new_id.clone(),
        name,
        phone: phone_number,
        push_name: None,
        avatar_url: None,
        is_active: false,
        status: "pairing".to_string(),
        created_at: chrono::Utc::now().timestamp_millis(),
        last_connected_at: None,
        unread_count: Some(0),
    };

    accounts.push(new_acc.clone());
    state.storage.save_accounts(&accounts);

    // Inicia a conexão e socket imediatamente para gerar o QR code do WhatsApp
    let _ = state.session_mgr.switch_account(&new_id).await;

    Ok(new_acc)
}

#[tauri::command]
pub async fn switch_account(
    state: State<'_, AppState>,
    account_id: String,
) -> Result<Account, String> {
    state.session_mgr.switch_account(&account_id).await
}

#[tauri::command]
pub async fn delete_account(state: State<'_, AppState>, account_id: String) -> Result<(), String> {
    let mut accounts = state.storage.load_accounts();
    accounts.retain(|a| a.id != account_id);
    state.storage.save_accounts(&accounts);
    Ok(())
}

#[tauri::command]
pub async fn get_pairing_qr(
    state: State<'_, AppState>,
    account_id: String,
) -> Result<QrCodeResponse, String> {
    if let Some(qr) = state.session_mgr.get_current_qr().await {
        return Ok(qr);
    }

    // Se ainda não estava rodando para esta conta, inicia
    let _ = state.session_mgr.spawn_active_session(&account_id).await;

    // Aguarda até 3 segundos pelo primeiro QR emitido pelo WhatsApp
    for _ in 0..15 {
        tokio::time::sleep(tokio::time::Duration::from_millis(200)).await;
        if let Some(qr) = state.session_mgr.get_current_qr().await {
            return Ok(qr);
        }
    }

    Err("Aguardando geração do QR Code pelo WhatsApp...".to_string())
}

#[tauri::command]
pub fn request_pairing_code(_account_id: String, _phone_number: String) -> PairingCodeResponse {
    let u = uuid::Uuid::new_v4().simple().to_string();
    let code = format!("{}-{}", &u[..4].to_uppercase(), &u[4..8].to_uppercase());

    PairingCodeResponse {
        code,
        expires_at: chrono::Utc::now().timestamp_millis() + 180000,
    }
}

#[tauri::command]
pub async fn disconnect_active_account(state: State<'_, AppState>) -> Result<(), String> {
    state.session_mgr.disconnect_active().await
}

#[tauri::command]
pub fn get_chats(state: State<AppState>, account_id: String) -> Vec<Chat> {
    state.storage.load_chats(&account_id)
}

#[tauri::command]
pub async fn sync_groups(
    state: State<'_, AppState>,
    account_id: String,
) -> Result<Vec<Chat>, String> {
    state.session_mgr.sync_groups(&account_id).await
}

#[tauri::command]
pub fn get_messages(
    state: State<AppState>,
    account_id: String,
    chat_jid: String,
    _limit: Option<usize>,
    _before_timestamp: Option<i64>,
) -> Vec<Message> {
    state.storage.load_messages(&account_id, &chat_jid)
}

#[tauri::command]
pub async fn send_message(
    state: State<'_, AppState>,
    account_id: String,
    chat_jid: String,
    text: String,
    reply_to_id: Option<String>,
) -> Result<Message, String> {
    state
        .session_mgr
        .send_message(&account_id, &chat_jid, &text, reply_to_id)
        .await
}

#[tauri::command]
pub async fn download_media(
    state: State<'_, AppState>,
    account_id: String,
    message_id: String,
) -> Result<String, String> {
    state
        .session_mgr
        .download_media(&account_id, &message_id)
        .await
}

#[tauri::command]
pub async fn send_media(
    state: State<'_, AppState>,
    account_id: String,
    chat_jid: String,
    media_type: String,
    file_name: String,
    file_data_base64: String,
    caption: Option<String>,
) -> Result<Message, String> {
    state
        .session_mgr
        .send_media(
            &account_id,
            &chat_jid,
            &media_type,
            &file_name,
            &file_data_base64,
            caption,
        )
        .await
}

#[tauri::command]
pub async fn start_chat(
    state: State<'_, AppState>,
    account_id: String,
    phone_number: String,
    name: Option<String>,
) -> Result<Chat, String> {
    state
        .session_mgr
        .start_chat(&account_id, &phone_number, name.as_deref())
        .await
}

#[tauri::command]
pub fn get_storage_stats(state: State<AppState>, account_id: Option<String>) -> StorageStats {
    state.storage.get_storage_stats(account_id.as_deref())
}

#[tauri::command]
pub fn clear_media_cache(
    state: State<AppState>,
    category: Option<String>,
    older_than_days: Option<u32>,
) -> serde_json::Value {
    let freed = state
        .storage
        .clear_media_cache(category.as_deref(), older_than_days);
    serde_json::json!({ "freedBytes": freed })
}

#[tauri::command]
pub fn clear_chat_cache(state: State<AppState>, chat_jid: String) -> serde_json::Value {
    let freed = state.storage.clear_chat_cache(&chat_jid);
    serde_json::json!({ "freedBytes": freed })
}

#[tauri::command]
pub async fn delete_chat(
    state: State<'_, AppState>,
    account_id: String,
    chat_jid: String,
) -> Result<(), String> {
    state.session_mgr.delete_chat(&account_id, &chat_jid).await
}

#[tauri::command]
pub async fn clear_chat_messages(
    state: State<'_, AppState>,
    account_id: String,
    chat_jid: String,
) -> Result<(), String> {
    state
        .session_mgr
        .clear_chat_messages(&account_id, &chat_jid)
        .await
}

#[tauri::command]
pub fn vacuum_database(state: State<AppState>) -> serde_json::Value {
    let freed = state.storage.vacuum_database();
    serde_json::json!({ "freedBytes": freed })
}

#[tauri::command]
pub fn clear_all_cache(state: State<AppState>) -> serde_json::Value {
    let freed = state.storage.clear_all_cache();
    serde_json::json!({ "freedBytes": freed })
}

#[tauri::command]
pub fn get_settings(state: State<AppState>) -> AppSettings {
    state.storage.load_settings()
}

#[tauri::command]
pub fn save_settings(state: State<AppState>, settings: AppSettings) -> Result<(), String> {
    state.storage.save_settings(&settings);
    Ok(())
}

#[tauri::command]
pub fn save_file_to_path(source_path: String, destination_path: String) -> Result<(), String> {
    std::fs::copy(&source_path, &destination_path)
        .map_err(|e| format!("Erro ao salvar arquivo: {}", e))?;
    Ok(())
}

#[tauri::command]
pub fn save_bytes_to_path(data_base64: String, destination_path: String) -> Result<(), String> {
    use base64::Engine;
    let bytes = base64::engine::general_purpose::STANDARD
        .decode(&data_base64)
        .map_err(|e| format!("Erro base64: {}", e))?;
    std::fs::write(&destination_path, bytes)
        .map_err(|e| format!("Erro ao salvar arquivo: {}", e))?;
    Ok(())
}

#[tauri::command]
pub async fn get_profile_picture(
    state: State<'_, AppState>,
    jid: String,
) -> Result<Option<String>, String> {
    state.session_mgr.get_profile_picture(&jid).await
}

#[tauri::command]
pub async fn get_group_members(
    state: State<'_, AppState>,
    group_jid: String,
) -> Result<Vec<GroupParticipant>, String> {
    state.session_mgr.get_group_members(&group_jid).await
}

#[tauri::command]
pub async fn add_group_participant(
    state: State<'_, AppState>,
    group_jid: String,
    phone_or_jid: String,
) -> Result<(), String> {
    state
        .session_mgr
        .add_group_participant(&group_jid, &phone_or_jid)
        .await
}

#[tauri::command]
pub async fn leave_group(
    state: State<'_, AppState>,
    account_id: String,
    group_jid: String,
) -> Result<(), String> {
    state.session_mgr.leave_group(&account_id, &group_jid).await
}

#[tauri::command]
pub async fn mute_chat(
    state: State<'_, AppState>,
    account_id: String,
    chat_jid: String,
    mute_end_timestamp: Option<i64>,
) -> Result<(), String> {
    state
        .session_mgr
        .mute_chat(&account_id, &chat_jid, mute_end_timestamp)
        .await
}

#[tauri::command]
pub async fn unmute_chat(
    state: State<'_, AppState>,
    account_id: String,
    chat_jid: String,
) -> Result<(), String> {
    state.session_mgr.unmute_chat(&account_id, &chat_jid).await
}

#[tauri::command]
pub async fn send_reaction(
    state: State<'_, AppState>,
    chat_jid: String,
    message_id: String,
    from_me: bool,
    participant_jid: Option<String>,
    emoji: String,
) -> Result<(), String> {
    state
        .session_mgr
        .send_reaction(
            &chat_jid,
            &message_id,
            from_me,
            participant_jid.as_deref(),
            &emoji,
        )
        .await
}
