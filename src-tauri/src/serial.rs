use std::time::Duration;
use std::sync::Mutex;
use serialport::SerialPort;
use serde::{Deserialize, Serialize};

pub struct SerialPortState(pub Mutex<Option<Box<dyn SerialPort>>>);

#[derive(Debug, Deserialize, Serialize)]
pub struct SerialPortResponse {
    success: bool,
    message: String,
    ports: Vec<String>,  // Add ports array to response
}

#[tauri::command]
pub async fn list_ports() -> Result<SerialPortResponse, String> {
    let ports = serialport::available_ports().map_err(|e| e.to_string())?;
    let port_names: Vec<String> = ports.iter()
        .map(|p| p.port_name.clone())
        .collect();
    
    println!("Available ports: {:?}", port_names);

    Ok(SerialPortResponse {
        success: true,
        message: "Ports listed successfully".to_string(),
        ports: port_names,
    })
}

#[tauri::command]
pub async fn open_port(
    state: tauri::State<'_, SerialPortState>,
    port_name: &str, 
    baud_rate: u32
) -> Result<SerialPortResponse, String> {
    let port = serialport::new(port_name, baud_rate)
        .timeout(Duration::from_millis(10))
        .open()
        .map_err(|e| e.to_string())?;

    let mut port_state = state.0.lock().unwrap();
    *port_state = Some(port);

    println!("Opened port: {}", port_name);

    Ok(SerialPortResponse {
        success: true,
        message: format!("Port {} opened successfully", port_name),
        ports: vec![], // Empty ports array for this response
    })
}

#[tauri::command]
pub async fn close_port(
    state: tauri::State<'_, SerialPortState>
) -> Result<SerialPortResponse, String> {
    let mut port_state = state.0.lock().unwrap();
    *port_state = None;

    println!("Closed port");

    Ok(SerialPortResponse {
        success: true,
        message: "Port closed successfully".to_string(),
        ports: vec![], // Empty ports array for this response
    })
}