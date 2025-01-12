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
        // Removed timeout setting to prevent disconnections
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

#[tauri::command]
pub async fn monitor_port(
    state: tauri::State<'_, SerialPortState>
) -> Result<SerialPortResponse, String> {
    let port_state = state.0.lock().unwrap();
    
    match &*port_state {
        Some(port) => {
            let mut serial_buf: Vec<u8> = vec![0; 1024];
            match port.try_clone() {
                Ok(mut port_clone) => {
                    // Set a longer timeout just for reading
                    port_clone.set_timeout(Duration::from_millis(100))
                        .map_err(|e| e.to_string())?;
                    
                    match port_clone.read(serial_buf.as_mut_slice()) {
                        Ok(t) => {
                            if t > 0 {
                                let received_data = String::from_utf8_lossy(&serial_buf[..t]);
                                Ok(SerialPortResponse {
                                    success: true,
                                    message: received_data.to_string(),
                                    ports: vec![],
                                })
                            } else {
                                Ok(SerialPortResponse {
                                    success: true,
                                    message: "No data available".to_string(),
                                    ports: vec![],
                                })
                            }
                        }
                        Err(ref e) if e.kind() == std::io::ErrorKind::TimedOut => {
                            Ok(SerialPortResponse {
                                success: true,
                                message: "No data available".to_string(),
                                ports: vec![],
                            })
                        }
                        Err(e) => Err(format!("Failed to read from port: {}", e))
                    }
                }
                Err(e) => Err(format!("Failed to clone port: {}", e))
            }
        }
        None => Err("No port is currently open".to_string())
    }
}