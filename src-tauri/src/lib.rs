pub mod commands;
pub mod models;
pub mod session_manager;
pub mod storage;

use commands::AppState;
use session_manager::SessionManager;
use std::sync::Arc;
use storage::StorageManager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let storage = Arc::new(StorageManager::new());
    let session_mgr = Arc::new(SessionManager::new(storage.clone()));

    let app_state = AppState {
        storage,
        session_mgr: session_mgr.clone(),
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(app_state)
        .setup(move |app| {
            let handle = app.handle().clone();
            let session_clone = session_mgr.clone();
            tauri::async_runtime::spawn(async move {
                session_clone.set_app_handle(handle).await;
                let active_id = session_clone.active_account_id.lock().await.clone();
                if let Some(id) = active_id {
                    let _ = session_clone.spawn_active_session(&id).await;
                }
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_accounts,
            commands::get_active_account,
            commands::create_account,
            commands::switch_account,
            commands::delete_account,
            commands::get_pairing_qr,
            commands::request_pairing_code,
            commands::disconnect_active_account,
            commands::get_chats,
            commands::get_messages,
            commands::send_message,
            commands::send_media,
            commands::start_chat,
            commands::download_media,
            commands::get_storage_stats,
            commands::clear_media_cache,
            commands::clear_chat_cache,
            commands::delete_chat,
            commands::clear_chat_messages,
            commands::vacuum_database,
            commands::clear_all_cache,
            commands::get_settings,
            commands::save_settings,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
