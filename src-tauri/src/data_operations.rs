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

#[cfg(test)]
mod tests {
    use super::*;
    
    // Test combining multiple cases for parsing telemetry messages
    #[test]
    fn test_parse_telemetry_combined() {
        let test_cases = vec![
            (
                "[timestamp:1832944,acc_x:-8.40,acc_y:1.50,acc_z:6.10,gyro_x:-19.30,gyro_y:91.70,gyro_z:1.60,mag_x:5.20,mag_y:-21.70,mag_z:34.30,baro_press:966.23,press:993.64,gps_lat:37.784698,gps_lon:-122.409698,temp:22.80]",
                -60,
                10.0,
                TelemetryData {
                    timestamp: 1832944,
                    acc_x: -8.40,
                    acc_y: 1.50,
                    acc_z: 6.10,
                    gyro_x: -19.30,
                    gyro_y: 91.70,
                    gyro_z: 1.60,
                    mag_x: 5.20,
                    mag_y: -21.70,
                    mag_z: 34.30,
                    baro_press: 966.23,
                    press: 993.64,
                    gps_lat: 37.784698,
                    gps_lon: -122.409698,
                    temp: 22.80,
                    rssi: -60,
                    snr: 10.0,
                }
            ),
            (
                "[timestamp:987654,acc_x:1.23,acc_y:2.34,acc_z:3.45,gyro_x:4.56,gyro_y:5.67,gyro_z:6.78,mag_x:7.89,mag_y:8.90,mag_z:9.01,baro_press:1011.12,press:1112.13,gps_lat:13.14,gps_lon:14.15,temp:15.16]",
                -50,
                12.0,
                TelemetryData {
                    timestamp: 987654,
                    acc_x: 1.23,
                    acc_y: 2.34,
                    acc_z: 3.45,
                    gyro_x: 4.56,
                    gyro_y: 5.67,
                    gyro_z: 6.78,
                    mag_x: 7.89,
                    mag_y: 8.90,
                    mag_z: 9.01,
                    baro_press: 1011.12,
                    press: 1112.13,
                    gps_lat: 13.14,
                    gps_lon: 14.15,
                    temp: 15.16,
                    rssi: -50,
                    snr: 12.0,
                }
            ),
        ];
    
        for (message, rssi, snr, expected) in test_cases {
            let parsed = parse_telemetry(message, rssi, snr)
                .expect("Failed to parse telemetry message");
    
            assert_eq!(parsed.timestamp, expected.timestamp);
            assert!((parsed.acc_x - expected.acc_x).abs() < f32::EPSILON);
            assert!((parsed.acc_y - expected.acc_y).abs() < f32::EPSILON);
            assert!((parsed.acc_z - expected.acc_z).abs() < f32::EPSILON);
            assert!((parsed.gyro_x - expected.gyro_x).abs() < f32::EPSILON);
            assert!((parsed.gyro_y - expected.gyro_y).abs() < f32::EPSILON);
            assert!((parsed.gyro_z - expected.gyro_z).abs() < f32::EPSILON);
            assert!((parsed.mag_x - expected.mag_x).abs() < f32::EPSILON);
            assert!((parsed.mag_y - expected.mag_y).abs() < f32::EPSILON);
            assert!((parsed.mag_z - expected.mag_z).abs() < f32::EPSILON);
            assert!((parsed.baro_press - expected.baro_press).abs() < f32::EPSILON);
            assert!((parsed.press - expected.press).abs() < f32::EPSILON);
            assert!((parsed.gps_lat - expected.gps_lat).abs() < f32::EPSILON);
            assert!((parsed.gps_lon - expected.gps_lon).abs() < f32::EPSILON);
            assert!((parsed.temp - expected.temp).abs() < f32::EPSILON);
            assert_eq!(parsed.rssi, expected.rssi);
            assert_eq!(parsed.snr, expected.snr);
        }
    }
    
    // Test that conversion from TelemetryData to TelemetryPacket is correct
    #[test]
    fn test_convert_to_packet() {
        let data = TelemetryData {
            timestamp: 123456,
            acc_x: 1.0,
            acc_y: 2.0,
            acc_z: 3.0,
            gyro_x: 4.0,
            gyro_y: 5.0,
            gyro_z: 6.0,
            mag_x: 7.0,
            mag_y: 8.0,
            mag_z: 9.0,
            baro_press: 10.0,
            press: 11.0,
            gps_lat: 12.0,
            gps_lon: 13.0,
            temp: 14.0,
            rssi: -60,
            snr: 10.0,
        };
    
        let packet_id = 1;
        let packet = convert_to_packet(&data, packet_id);
    
        assert_eq!(packet.id, packet_id);
        assert_eq!(packet.mission_time, "123");
        assert_eq!(packet.connected, true);
        assert_eq!(packet.satellites, 0);
        assert_eq!(packet.rssi, -60);
        assert_eq!(packet.battery, 100.0);
        assert_eq!(packet.latitude, 12.0);
        assert_eq!(packet.longitude, 13.0);
        assert_eq!(packet.altitude, 0.0);
        assert_eq!(packet.velocity_x, 4.0);
        assert_eq!(packet.velocity_y, 5.0);
        assert_eq!(packet.velocity_z, 6.0);
        assert_eq!(packet.acceleration_x, 1.0);
        assert_eq!(packet.acceleration_y, 2.0);
        assert_eq!(packet.acceleration_z, 3.0);
        assert_eq!(packet.pitch, 4.0);
        assert_eq!(packet.yaw, 5.0);
        assert_eq!(packet.roll, 6.0);
        assert_eq!(packet.minute, 2);
        assert_eq!(packet.second, 3);
    }
}