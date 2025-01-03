// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
mod telemetry_sim;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            telemetry_sim::mockdata,
            telemetry_sim::stream_telemetry
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
