use std::io::Read;
use std::thread;
use std::time::Duration;
use std::sync::{Arc, Mutex};
use tauri::{State, AppHandle, Emitter};
use serde::Serialize;

use crate::serial_operations::SerialConnection;

/// Basic telemetry structure parsed from raw messages
#[derive(Debug, Serialize, Clone)]
pub struct TelemetryData {
    pub id: u32,
    pub mission_time: String,
    pub connected: bool,
    pub acceleration_x: f32,
    pub acceleration_y: f32,
    pub acceleration_z: f32,
    pub velocity_x: f32,
    pub velocity_y: f32,
    pub velocity_z: f32,
    pub pitch: f32,
    pub roll: f32,
    pub yaw: f32,
    pub mag_x: f32,
    pub mag_y: f32,
    pub mag_z: f32,
    pub baro_press: f32,
    pub altitude: f32,
    pub press: f32,
    pub latitude: f32,
    pub longitude: f32,
    pub satellites: u8,
    pub temp: f32,
    pub battery: f32,
    pub minute: u32,
    pub second: u32,
    pub rssi: i32,
    pub snr: f32,
}

/// This is what the front end ultimately receives via event emission
#[derive(Debug, Serialize, Clone)]
pub struct TelemetryPacket {
    pub id: u32,
    pub mission_time: String,
    pub connected: bool,
    pub satellites: u8,
    pub rssi: i32,
    pub battery: f32,
    pub latitude: f64,
    pub longitude: f64,
    pub altitude: f32,
    pub velocity_x: f32,
    pub velocity_y: f32,
    pub velocity_z: f32,
    pub acceleration_x: f32,
    pub acceleration_y: f32,
    pub acceleration_z: f32,
    pub pitch: f32,
    pub yaw: f32,
    pub roll: f32,
    pub minute: u32,
    pub second: u32,
}

/// Parse a single, complete telemetry message into our `TelemetryData` struct.
fn parse_telemetry(raw_message: &str) -> Option<TelemetryData> {
    // Split by ],rssi: to separate message and RSSI
    let parts: Vec<&str> = raw_message.split("],rssi:").collect();
    let message = parts.get(0)?;
    
    // Extract RSSI value if present, otherwise use a default
    let rssi = if parts.len() > 1 && !parts[1].trim().is_empty() {
        parts[1].trim().parse().unwrap_or(-100)
    } else {
        -100 // Default RSSI when not available
    };

    // Check if message has the expected format
    if !message.starts_with('[') {
        return None;
    }
    
    // Extract the content between brackets
    let content = &message[1..];
    
    // Initialize data structure
    let mut data = TelemetryData {
        id: 0,
        mission_time: String::new(),
        connected: false,
        acceleration_x: 0.0,
        acceleration_y: 0.0,
        acceleration_z: 0.0,
        velocity_x: 0.0,
        velocity_y: 0.0,
        velocity_z: 0.0,
        pitch: 0.0,
        roll: 0.0,
        yaw: 0.0,
        mag_x: 0.0,
        mag_y: 0.0,
        mag_z: 0.0,
        baro_press: 0.0,
        altitude: 0.0,
        press: 0.0,
        latitude: 0.0,
        longitude: 0.0,
        satellites: 0,
        temp: 0.0,
        battery: 0.0,
        minute: 0,
        second: 0,
        rssi,
        snr: 0.0, // Default SNR since it's not in the new format
    };
    
    // Parse key-value pairs
    for pair in content.split(',') {
        let parts: Vec<&str> = pair.split(':').collect();
        if parts.len() != 2 {
            continue;
        }
        
        let key = parts[0].trim();
        let value = parts[1].trim();
        
        match key {
            "id" => if let Ok(val) = value.parse() { data.id = val },
            "mission_time" => data.mission_time = value.to_string(),
            "connected" => if let Ok(val) = value.parse::<u8>() { data.connected = val > 0 },
            "acceleration_x" => if let Ok(val) = value.parse() { data.acceleration_x = val },
            "acceleration_y" => if let Ok(val) = value.parse() { data.acceleration_y = val },
            "acceleration_z" => if let Ok(val) = value.parse() { data.acceleration_z = val },
            "velocity_x" => if let Ok(val) = value.parse() { data.velocity_x = val },
            "velocity_y" => if let Ok(val) = value.parse() { data.velocity_y = val },
            "velocity_z" => if let Ok(val) = value.parse() { data.velocity_z = val },
            "pitch" => if let Ok(val) = value.parse() { data.pitch = val },
            "roll" => if let Ok(val) = value.parse() { data.roll = val },
            "yaw" => if let Ok(val) = value.parse() { data.yaw = val },
            "mag_x" => if let Ok(val) = value.parse() { data.mag_x = val },
            "mag_y" => if let Ok(val) = value.parse() { data.mag_y = val },
            "mag_z" => if let Ok(val) = value.parse() { data.mag_z = val },
            "baro_press" => if let Ok(val) = value.parse() { data.baro_press = val },
            "altitude" => if let Ok(val) = value.parse() { data.altitude = val },
            "press" => if let Ok(val) = value.parse() { data.press = val },
            "latitude" => if let Ok(val) = value.parse() { data.latitude = val },
            "longitude" => if let Ok(val) = value.parse() { data.longitude = val },
            "satellites" => if let Ok(val) = value.parse() { data.satellites = val },
            "temp" => if let Ok(val) = value.parse() { data.temp = val },
            "battery" => if let Ok(val) = value.parse() { data.battery = val },
            "minute" => if let Ok(val) = value.parse() { data.minute = val },
            "second" => if let Ok(val) = value.parse() { data.second = val },
            _ => {}
        }
    }
    
    Some(data)
}

/// Convert raw `TelemetryData` into the final `TelemetryPacket` structure.
fn convert_to_packet(data: &TelemetryData, packet_id: u32) -> TelemetryPacket {
    TelemetryPacket {
        id: packet_id,
        mission_time: data.mission_time.clone(),
        connected: data.connected,
        satellites: data.satellites,
        rssi: data.rssi,
        battery: data.battery,
        latitude: data.latitude as f64,
        longitude: data.longitude as f64,
        altitude: data.altitude,
        velocity_x: data.velocity_x,
        velocity_y: data.velocity_y,
        velocity_z: data.velocity_z,
        acceleration_x: data.acceleration_x,
        acceleration_y: data.acceleration_y,
        acceleration_z: data.acceleration_z,
        pitch: data.pitch,
        yaw: data.yaw,
        roll: data.roll,
        minute: data.minute,
        second: data.second,
    }
}

/// Spawns a background thread that reads from the currently open serial port,
/// parses each chunk of data, and emits it to the front end.
/// 
/// **Important**: The thread automatically stops when `close_serial` is invoked,
/// because that sets the shared `stop_flag`, and we check it each loop iteration.
#[tauri::command]
pub fn rt_parsed_stream(app_handle: AppHandle, serial_connection: State<'_, SerialConnection>) -> Result<(), String> {
    let connection = serial_connection.port.lock().unwrap();
    let mut port = match connection.as_ref() {
        Some(port) => port.try_clone().map_err(|e| e.to_string())?,
        None => return Err("No active serial connection".to_string()),
    };

    let stop_flag = serial_connection.stop_flag.clone();
    let packet_counter = Arc::new(Mutex::new(0u32));

    thread::spawn(move || {
        let mut serial_buf = vec![0u8; 1024];
        let mut accumulated_data = String::new();

        loop {
            // Check if we've been asked to stop
            if stop_flag.load(std::sync::atomic::Ordering::Relaxed) {
                eprintln!("rt_parsed_stream: stop_flag detected, exiting thread.");
                break;
            }

            match port.read(&mut serial_buf) {
                Ok(n) if n > 0 => {
                    accumulated_data.push_str(&String::from_utf8_lossy(&serial_buf[..n]));

                    // Process complete messages that end with rssi value or just ]
                    while let Some(start) = accumulated_data.find('[') {
                        // First check if complete message with RSSI
                        if let Some(end) = accumulated_data[start..].find("],rssi:") {
                            // Find the end of the RSSI value (newline or next [)
                            let mut rssi_end = accumulated_data[start + end + 7..].find('\n')
                                .map(|pos| start + end + 7 + pos)
                                .unwrap_or_else(|| accumulated_data.len());
                            
                            // Check if there's another [ before the newline
                            if let Some(next_start) = accumulated_data[start + end + 7..rssi_end].find('[') {
                                rssi_end = start + end + 7 + next_start;
                            }
                            
                            let full_message = &accumulated_data[start..rssi_end];
                            
                            // Parse the telemetry data
                            if let Some(parsed) = parse_telemetry(full_message) {
                                let mut count = packet_counter.lock().unwrap();
                                *count += 1;
                                let packet = convert_to_packet(&parsed, *count);

                                // Emit events
                                let _ = app_handle.emit("telemetry-packet", packet.clone());
                                let _ = app_handle.emit("telemetry-update", packet);
                            }
                            
                            // Remove the processed message
                            accumulated_data = accumulated_data[rssi_end..].to_string();
                        }
                        // Check if message ends with just ]
                        else if let Some(end) = accumulated_data[start..].find(']') {
                            if end > 0 {
                                let full_message = &accumulated_data[start..start+end+1];
                                
                                // Parse the telemetry data (with no RSSI)
                                if let Some(parsed) = parse_telemetry(full_message) {
                                    let mut count = packet_counter.lock().unwrap();
                                    *count += 1;
                                    let packet = convert_to_packet(&parsed, *count);

                                    // Emit events
                                    let _ = app_handle.emit("telemetry-packet", packet.clone());
                                    let _ = app_handle.emit("telemetry-update", packet);
                                }
                                
                                // Remove the processed message
                                accumulated_data = accumulated_data[start+end+1..].to_string();
                            } else {
                                // Incomplete message, wait for more data
                                break;
                            }
                        } else {
                            // Incomplete message, wait for more data
                            break;
                        }
                    }
                }
                Ok(_) => {
                    // No data read this time; just wait and try again
                    thread::sleep(Duration::from_millis(100));
                }
                Err(e) => {
                    // Timed out or critical error
                    if e.kind() == std::io::ErrorKind::TimedOut {
                        thread::sleep(Duration::from_millis(100));
                        continue;
                    }
                    eprintln!("Terminating rt_parsed_stream thread: {}", e);
                    break;
                }
            }
        }
    });

    Ok(())
}