use std::process::exit;
use tauri::Manager;

#[cfg(target_os = "windows")]
mod win_noactivate {
    use tauri::WebviewWindow;
    // Use windows-sys for API calls, but Tauri's `.hwnd()` returns a `windows` crate `HWND` newtype.
    // Convert by taking the inner `.0` (isize) to `windows-sys`'s alias type.
    use windows_sys::Win32::Foundation::HWND as HWND_SYS;
    use windows_sys::Win32::UI::WindowsAndMessaging::{GetWindowLongPtrW, SetWindowLongPtrW, SetWindowPos, GWL_EXSTYLE, HWND_TOPMOST, SWP_NOMOVE, SWP_NOSIZE, SWP_NOACTIVATE, SWP_SHOWWINDOW, SWP_NOOWNERZORDER, SWP_NOSENDCHANGING, WS_EX_NOACTIVATE, WS_EX_TOOLWINDOW};

    // Mark a window as non-activating and toolwindow to avoid stealing focus.
    pub fn apply(window: &WebviewWindow) {
        // Best-effort; ignore errors to avoid crashing the app on edge cases.
        unsafe {
            // `hwnd()` is available on Windows targets in Tauri 2 and returns isize.
            if let Ok(raw_hwnd) = window.hwnd() {
                // `raw_hwnd` is `windows::Win32::Foundation::HWND` (newtype over isize).
                let hwnd: HWND_SYS = raw_hwnd.0 as HWND_SYS;
                log::info!("Applying WS_EX_NOACTIVATE | WS_EX_TOOLWINDOW to '{}'", window.label());
                // Read existing extended styles and OR with desired flags.
                let ex_style = GetWindowLongPtrW(hwnd, GWL_EXSTYLE);
                let new_ex_style = ex_style
                    | (WS_EX_NOACTIVATE as isize)
                    | (WS_EX_TOOLWINDOW as isize);
                SetWindowLongPtrW(hwnd, GWL_EXSTYLE, new_ex_style);

                // Re-apply Z-order/topmost without activating the window.
                let _ = SetWindowPos(
                    hwnd,
                    HWND_TOPMOST,
                    0,
                    0,
                    0,
                    0,
                    SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE | SWP_SHOWWINDOW | SWP_NOOWNERZORDER | SWP_NOSENDCHANGING,
                );
                log::info!("WS_EX_* styles and NOACTIVATE SetWindowPos applied to '{}'", window.label());
            }
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            let _ = app.get_webview_window("main")
                       .expect("no main window")
                       .set_focus();
        }))
        .plugin(tauri_plugin_dialog::init())
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

            // Apply non-activating style to overlay-like windows on Windows.
            #[cfg(target_os = "windows")]
            {
                for label in ["canvas", "menu", "random", "random/settings"] {
                    match app.get_webview_window(label) {
                        Some(w) => {
                            log::info!("Applying NOACTIVATE to window '{}'.", label);
                            win_noactivate::apply(&w);
                        }
                        None => {
                            log::info!("Window '{}' not found during setup; skipping.", label);
                        }
                    }
                }
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn quit() {
    exit(1)
}
