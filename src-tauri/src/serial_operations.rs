use tauri::{AppHandle, Manager, Runtime};

#[tauri::command]
pub fn list_serial_ports<R: Runtime>(app_handle: AppHandle<R>) -> Result<Vec<String>, String> {
    let serial = app_handle.state::<tauri_plugin_serialplugin::SerialPort<R>>();
    serial
        .available_ports()
        .map(|ports| ports.keys().cloned().collect())
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn open_serial<R: Runtime>(
    port_name: String,
    baud_rate: u32,
    app_handle: AppHandle<R>,
) -> Result<String, String> {
    let serial = app_handle.state::<tauri_plugin_serialplugin::SerialPort<R>>();
    serial
        .open(port_name.clone(), baud_rate, None, None, None, None, None)
        .map_err(|e| e.to_string())?;
    Ok(format!("Connected to {} at {} baud", port_name, baud_rate))
}

#[tauri::command]
pub async fn close_serial<R: Runtime>(
    app_handle: AppHandle<R>,
    port_name: String,
) -> Result<String, String> {
    let serial = app_handle.state::<tauri_plugin_serialplugin::SerialPort<R>>();
    serial.close(port_name).map_err(|e| e.to_string())?;
    Ok("Serial port closed successfully".to_string())
}