mod serial_operations;
mod data_operations;
mod file_operations;

use serial_operations::SerialConnection; // Updated import


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        // Instead of creating a raw Mutex(None), call the new() constructor:
        .manage(SerialConnection::new())
        .invoke_handler(tauri::generate_handler![
            serial_operations::list_serial_ports,
            serial_operations::open_serial,
            serial_operations::close_serial,
            serial_operations::write_serial,
            file_operations::create_text_file,
            file_operations::list_files,
            data_operations::rt_parsed_stream 
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
