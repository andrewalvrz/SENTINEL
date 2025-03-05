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