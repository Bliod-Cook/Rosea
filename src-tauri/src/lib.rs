use std::process::exit;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[cfg(not(debug_assertions))]
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_positioner::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![quit])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");

    #[cfg(debug_assertions)]
    {
        tauri::Builder::default()
                    .plugin(tauri_plugin_devtools::init())
                    .plugin(tauri_plugin_notification::init())
                    .plugin(tauri_plugin_positioner::init())
                    .plugin(tauri_plugin_fs::init())
                    .plugin(tauri_plugin_updater::Builder::new().build())
                    .invoke_handler(tauri::generate_handler![quit])
                    .setup(|app| {
//                         if cfg!(debug_assertions) {
//                             app.handle().plugin(
//                                 tauri_plugin_log::Builder::default()
//                                     .level(log::LevelFilter::Info)
//                                     .build(),
//                             )?;
//                         }
                        Ok(())
                    })
                    .run(tauri::generate_context!())
                    .expect("error while running tauri application");
    }
}

#[tauri::command]
fn quit() {
    exit(1)
}
