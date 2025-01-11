use std::time::Duration;
use std::sync::{Arc, Mutex};
use std::sync::atomic::{AtomicBool, Ordering};
use serialport::SerialPort;
use serde::{Deserialize, Serialize};
use tauri::Emitter;


pub struct SerialPortState {
    pub port: Mutex<Option<Box<dyn SerialPort>>>,
    pub stop_flag: Arc<AtomicBool>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct SerialPortResponse {
    success: bool,
    message: String,
    ports: Vec<String>,
}

#[tauri::command]
pub async fn list_ports() -> Result<SerialPortResponse, String> {
    let ports = serialport::available_ports().map_err(|e| e.to_string())?;
    let port_names: Vec<String> = ports.iter().map(|p| p.port_name.clone()).collect();

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
    baud_rate: u32,
) -> Result<SerialPortResponse, String> {
    let port = serialport::new(port_name, baud_rate)
        .timeout(Duration::from_millis(10))
        .open()
        .map_err(|e| e.to_string())?;

    let mut port_state = state.port.lock().unwrap();
    *port_state = Some(port);
    state.stop_flag.store(false, Ordering::Relaxed);

    println!("Opened port: {}", port_name);

    Ok(SerialPortResponse {
        success: true,
        message: format!("Port {} opened successfully", port_name),
        ports: vec![],
    })
}

#[tauri::command]
pub async fn close_port(
    state: tauri::State<'_, SerialPortState>,
) -> Result<SerialPortResponse, String> {
    let mut port_state = state.port.lock().unwrap();
    *port_state = None;
    state.stop_flag.store(true, Ordering::Relaxed);

    println!("Closed port");

    Ok(SerialPortResponse {
        success: true,
        message: "Port closed successfully".to_string(),
        ports: vec![],
    })
}

#[tauri::command]
pub async fn read_telemetry(
    state: tauri::State<'_, SerialPortState>,
    window: tauri::Window,
) -> Result<(), String> {
    let port_state = state.port.lock().unwrap();
    if let Some(ref mut port) = *port_state {
        let stop_flag = state.stop_flag.clone();
        let mut buffer = vec![0; 512];

        while !stop_flag.load(Ordering::Relaxed) {
            match port.read(&mut buffer) {
                Ok(bytes_read) => {
                    if bytes_read > 0 {
                        let data = String::from_utf8_lossy(&buffer[..bytes_read]).to_string();
                        if let Err(e) = window.emit("telemetry-packet", data) {
                            eprintln!("Error emitting telemetry packet: {}", e);
                        }
                    }
                }
                Err(e) => {
                    eprintln!("Error reading from serial port: {}", e);
                    break;
                }
            }
        }
    } else {
        return Err("No serial port open.".to_string());
    }

    Ok(())
}

#[tauri::command]
pub async fn stop_read_telemetry(state: tauri::State<'_, SerialPortState>) -> Result<(), String> {
    state.stop_flag.store(true, Ordering::Relaxed);
    Ok(())
}
