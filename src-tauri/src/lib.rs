// lib.rs - this file's sole purpose is to define the entry point for the Tauri app. AKA. Makes stuff available to the front end. Don't write any logic here.
mod serial_operations;
mod data_operations;
mod file_operations;
mod telemetry_sim;

use serial_operations::SerialConnection;
use std::sync::Mutex;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(SerialConnection(Mutex::new(None)))
        .invoke_handler(tauri::generate_handler![
            serial_operations::list_serial_ports,
            serial_operations::open_serial,
            serial_operations::close_serial,
            file_operations::create_text_file,
            file_operations::list_files,
            data_operations::start_data_parser, 
            telemetry_sim::stream_telemetry
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
