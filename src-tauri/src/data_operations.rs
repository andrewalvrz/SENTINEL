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
    pub timestamp: u64,
    pub acc_x: f32,
    pub acc_y: f32,
    pub acc_z: f32,
    pub gyro_x: f32,
    pub gyro_y: f32,
    pub gyro_z: f32,
    pub mag_x: f32,
    pub mag_y: f32,
    pub mag_z: f32,
    pub baro_press: f32,
    pub press: f32,
    pub gps_lat: f32,
    pub gps_lon: f32,
    pub temp: f32,
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
fn parse_telemetry(message: &str, rssi: i32, snr: f32) -> Option<TelemetryData> {
    // Check if message has the expected format
    if !message.starts_with('[') || !message.ends_with(']') {
        return None;
    }
    
    // Extract the content between brackets
    let content = &message[1..message.len()-1];
    
    // Parse key-value pairs
    let mut data = TelemetryData {
        timestamp: 0,
        acc_x: 0.0,
        acc_y: 0.0,
        acc_z: 0.0,
        gyro_x: 0.0,
        gyro_y: 0.0,
        gyro_z: 0.0,
        mag_x: 0.0,
        mag_y: 0.0,
        mag_z: 0.0,
        baro_press: 0.0,
        press: 0.0,
        gps_lat: 0.0,
        gps_lon: 0.0,
        temp: 0.0,
        rssi,
        snr,
    };
    
    for pair in content.split(',') {
        let parts: Vec<&str> = pair.split(':').collect();
        if parts.len() != 2 {
            continue;
        }
        
        let key = parts[0].trim();
        let value = parts[1].trim();
        
        match key {
            "timestamp" => if let Ok(val) = value.parse() { data.timestamp = val },
            "acc_x" => if let Ok(val) = value.parse() { data.acc_x = val },
            "acc_y" => if let Ok(val) = value.parse() { data.acc_y = val },
            "acc_z" => if let Ok(val) = value.parse() { data.acc_z = val },
            "gyro_x" => if let Ok(val) = value.parse() { data.gyro_x = val },
            "gyro_y" => if let Ok(val) = value.parse() { data.gyro_y = val },
            "gyro_z" => if let Ok(val) = value.parse() { data.gyro_z = val },
            "mag_x" => if let Ok(val) = value.parse() { data.mag_x = val },
            "mag_y" => if let Ok(val) = value.parse() { data.mag_y = val },
            "mag_z" => if let Ok(val) = value.parse() { data.mag_z = val },
            "baro_press" => if let Ok(val) = value.parse() { data.baro_press = val },
            "press" => if let Ok(val) = value.parse() { data.press = val },
            "gps_lat" => if let Ok(val) = value.parse() { data.gps_lat = val },
            "gps_lon" => if let Ok(val) = value.parse() { data.gps_lon = val },
            "temp" => if let Ok(val) = value.parse() { data.temp = val },
            _ => {}
        }
    }
    
    Some(data)
}

/// Convert raw `TelemetryData` into the final `TelemetryPacket` structure.
fn convert_to_packet(data: &TelemetryData, packet_id: u32) -> TelemetryPacket {
    // Convert timestamp (milliseconds since start) to minutes and seconds
    let total_seconds = data.timestamp / 1000;
    let minutes = (total_seconds / 60) as u32;
    let seconds = (total_seconds % 60) as u32;

    TelemetryPacket {
        id: packet_id,
        mission_time: total_seconds.to_string(),
        connected: true,
        satellites: 0, // No satellites data in new format
        rssi: data.rssi,
        battery: 100.0, // placeholder battery value
        latitude: data.gps_lat as f64,
        longitude: data.gps_lon as f64,
        altitude: 0.0, // No altitude data in new format
        velocity_x: data.gyro_x,
        velocity_y: data.gyro_y,
        velocity_z: data.gyro_z,
        acceleration_x: data.acc_x,
        acceleration_y: data.acc_y,
        acceleration_z: data.acc_z,
        pitch: data.gyro_x,
        yaw: data.gyro_y,
        roll: data.gyro_z,
        minute: minutes,
        second: seconds,
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
        
        // Default RSSI and SNR values if not provided separately
        let default_rssi = -60;
        let default_snr = 10.0;

        loop {
            // Check if we've been asked to stop
            if stop_flag.load(std::sync::atomic::Ordering::Relaxed) {
                eprintln!("rt_parsed_stream: stop_flag detected, exiting thread.");
                break;
            }

            match port.read(&mut serial_buf) {
                Ok(n) if n > 0 => {
                    accumulated_data.push_str(&String::from_utf8_lossy(&serial_buf[..n]));

                    // Process complete messages enclosed in brackets
                    while let Some(start) = accumulated_data.find('[') {
                        if let Some(end) = accumulated_data[start..].find(']') {
                            let message = &accumulated_data[start..start+end+1];
                            
                            // Parse the telemetry data directly from the complete message
                            if let Some(parsed) = parse_telemetry(message, default_rssi, default_snr) {
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