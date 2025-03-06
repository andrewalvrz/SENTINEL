use serialport::SerialPort;
use std::sync::{Arc, Mutex};
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::Duration;
use tauri::State;

/// Holds the serial port plus a stop flag for any spawned threads.
pub struct SerialConnection {
    /// The actual serial port, if open
    pub port: Mutex<Option<Box<dyn SerialPort + Send>>>,
    /// A flag to indicate the parsing thread should stop
    pub stop_flag: Arc<AtomicBool>,
}

impl SerialConnection {
    /// Create a new `SerialConnection` with no open port and `stop_flag=false`
    pub fn new() -> Self {
        Self {
            port: Mutex::new(None),
            stop_flag: Arc::new(AtomicBool::new(false)),
        }
    }
}

/// Lists all available serial ports on the system
#[tauri::command]
pub fn list_serial_ports() -> Result<Vec<String>, String> {
    match serialport::available_ports() {
        Ok(ports) => Ok(ports.iter().map(|p| p.port_name.clone()).collect()),
        Err(e) => Err(format!("Failed to list ports: {}", e)),
    }
}

/// Opens a new serial connection at the specified port/baud rate
#[tauri::command]
pub async fn open_serial(
    port_name: String,
    baud_rate: u32,
    serial_connection: State<'_, SerialConnection>,
) -> Result<String, String> {
    // 1) Reset the stop flag in case it was set by a previous `close_serial`.
    serial_connection
        .stop_flag
        .store(false, Ordering::Relaxed);

    // 2) Check if there's already an open connection
    let mut connection = serial_connection.port.lock().unwrap();
    if connection.is_some() {
        return Err("A serial connection is already open".to_string());
    }

    // 3) Attempt to open the port
    match serialport::new(&port_name, baud_rate)
        .timeout(Duration::from_millis(0)) // No timeout for continuous streaming
        .open()
    {
        Ok(port) => {
            *connection = Some(port);
            let message = format!("Connected to {} at {} baud", port_name, baud_rate);
            println!("{}", message); // Debug print statement
            Ok(message)
        }
        Err(e) => Err(format!("Failed to connect: {}", e)),
    }
}

/// Closes the currently active serial connection and signals the parser thread to stop
#[tauri::command]
pub async fn close_serial(
    serial_connection: State<'_, SerialConnection>,
) -> Result<String, String> {
    {
        let mut connection = serial_connection.port.lock().unwrap();
        if connection.is_none() {
            return Err("No active serial connection to close".to_string());
        }

        // 1) Set the stop flag so the parsing thread breaks out
        serial_connection
            .stop_flag
            .store(true, Ordering::Relaxed);

        // 2) Drop the actual port handle
        *connection = None;
    }

    Ok("Serial port closed successfully".to_string())
}

#[tauri::command]
pub async fn write_serial(state: State<'_, SerialConnection>, command: String) -> Result<(), String> {
    let mut port_lock = state.port.lock().map_err(|_| "Mutex poisoned".to_string())?;
    if let Some(ref mut port) = *port_lock {
        port.write_all(command.as_bytes())
            .map_err(|e| e.to_string())?;
        port.flush()
            .map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err("Serial port not open".into())
    }
}