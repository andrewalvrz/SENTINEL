// serial_operations.rs
use serialport::SerialPort;
use std::sync::Mutex;
use std::time::Duration;
use tauri::State;

pub struct SerialConnection(pub Mutex<Option<Box<dyn SerialPort + Send>>>);

/// Lists all available serial ports on the system **NEEDS TO BE MODIFIED TO WORK ON LINUX AND MAC**
#[tauri::command]
pub fn list_serial_ports() -> Result<Vec<String>, String> {
    match serialport::available_ports() {
        Ok(ports) => Ok(ports.iter().map(|p| p.port_name.clone()).collect()),
        Err(e) => Err(format!("Failed to list ports: {}", e)),
    }
}

#[tauri::command]
pub async fn open_serial(
    port_name: String,
    baud_rate: u32,
    serial_connection: State<'_, SerialConnection>,
) -> Result<String, String> {
    // Check if there's already an open connection
    if serial_connection.0.lock().unwrap().is_some() {
        return Err("A serial connection is already open".to_string());
    }

    match serialport::new(&port_name, baud_rate)
        .timeout(Duration::from_millis(0)) // No timeout for continuous streaming
        .open()
    {
        Ok(port) => {
            let mut connection = serial_connection.0.lock().unwrap();
            *connection = Some(port);        

            let message = format!("Connected to {} at {} baud", port_name, baud_rate);
            println!("{}", message); // Debug print statement
            Ok(message)
        }
        Err(e) => Err(format!("Failed to connect: {}", e)),
    }
}

#[tauri::command]
pub async fn close_serial(
    serial_connection: State<'_, SerialConnection>,
) -> Result<String, String> {
    let mut connection = serial_connection.0.lock().unwrap();
    if connection.is_some() {
        *connection = None;
        Ok("Serial port closed successfully".to_string())
    } else {
        Err("No active serial connection to close".to_string())
    }
}
