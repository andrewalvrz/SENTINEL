use chrono::{Datelike, Local, Timelike};
use serde::{Deserialize, Serialize};
use tauri::State;
use tauri::Window;
use std::sync::Mutex;
use std::io::Read;
use std::time::Duration;
use tauri::Emitter;


#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TelemetryPacket {
    id: i32,
    year: i32,
    month: u32,
    day: u32,
    hour: u32,
    minute: u32,
    second: u32,
    acceleration_x: f64,
    acceleration_y: f64,
    acceleration_z: f64,
    velocity_x: f64,
    velocity_y: f64,
    velocity_z: f64,
    pitch: f64,
    roll: f64,
    yaw: f64,
    temperature: f64,
    pressure: f64,
    altitude: f64,
    humidity: f64,
    latitude: f64,
    longitude: f64,
    satellites: i32,
    rssi: f64,
    snr: f64,
    battery: f64,
    connected: bool,
    mission_time: f64,
}

// Serial Port State Management
pub struct SerialPortState(pub Mutex<Option<Box<dyn serialport::SerialPort>>>);

#[tauri::command]
pub async fn stream_serial_telemetry(
    state: State<'_, SerialPortState>,
    window: Window,
) -> Result<(), String> {
    let port_state = state.0.lock().unwrap();

    if let Some(ref mut port) = *port_state {
        let mut buffer = vec![0; 512];
        let mut packet_id = 1;

        loop {
            match port.read(&mut buffer) {
                Ok(bytes_read) if bytes_read > 0 => {
                    // Decode the incoming telemetry data
                    let raw_data = String::from_utf8_lossy(&buffer[..bytes_read]);

                    // Parse raw telemetry data (you can adapt this as needed)
                    match parse_telemetry_data(&raw_data, packet_id) {
                        Ok(packet) => {
                            // Emit telemetry packet to frontend
                            if let Err(e) = window.emit("telemetry-packet", packet) {
                                eprintln!("Failed to emit telemetry packet: {:?}", e);
                                break;
                            }
                            packet_id += 1;
                        }
                        Err(e) => eprintln!("Failed to parse telemetry data: {:?}", e),
                    }
                }
                Err(e) => {
                    eprintln!("Error reading from serial port: {:?}", e);
                    break;
                }
                _ => {}
            }
            tokio::time::sleep(Duration::from_millis(250)).await;
        }
    } else {
        return Err("No serial port open.".to_string());
    }

    Ok(())
}

// Function to parse raw telemetry data into a TelemetryPacket
fn parse_telemetry_data(raw_data: &str, id: i32) -> Result<TelemetryPacket, String> {
    let base_date = Local::now();

    // Example of parsing telemetry data from raw input
    // Format: "acceleration_x,acceleration_y,acceleration_z,..."
    let values: Vec<&str> = raw_data.split(',').collect();

    if values.len() < 17 {
        return Err("Incomplete telemetry data".to_string());
    }

    Ok(TelemetryPacket {
        id,
        year: base_date.year(),
        month: base_date.month(),
        day: base_date.day(),
        hour: base_date.hour(),
        minute: base_date.minute(),
        second: base_date.second(),
        acceleration_x: values[0].parse().unwrap_or(0.0),
        acceleration_y: values[1].parse().unwrap_or(0.0),
        acceleration_z: values[2].parse().unwrap_or(0.0),
        velocity_x: values[3].parse().unwrap_or(0.0),
        velocity_y: values[4].parse().unwrap_or(0.0),
        velocity_z: values[5].parse().unwrap_or(0.0),
        pitch: values[6].parse().unwrap_or(0.0),
        roll: values[7].parse().unwrap_or(0.0),
        yaw: values[8].parse().unwrap_or(0.0),
        temperature: values[9].parse().unwrap_or(0.0),
        pressure: values[10].parse().unwrap_or(0.0),
        altitude: values[11].parse().unwrap_or(0.0),
        humidity: values[12].parse().unwrap_or(0.0),
        latitude: values[13].parse().unwrap_or(0.0),
        longitude: values[14].parse().unwrap_or(0.0),
        satellites: values[15].parse().unwrap_or(0),
        rssi: values[16].parse().unwrap_or(0.0),
        snr: 0.0,
        battery: 100.0,
        connected: true,
        mission_time: 0.0,
    })
}
