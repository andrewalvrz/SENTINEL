use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter, Listener, Manager, Runtime};
use serde::Serialize;

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

// Original parse_telemetry function (outside test module)
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

    let raw_timestamp = parts[0].trim_start_matches('[');
    let ts_parts: Vec<&str> = raw_timestamp.split(' ').collect();
    if ts_parts.len() != 2 { // Adjusted for [YYYY-MM-DD HH:MM:SS]
        return None;
    }
    let date = ts_parts[0].replace("/", "-");
    let time = ts_parts[1];
    let iso_timestamp = format!("{}T{}Z", date, time);

    let data_str = parts[1];
    let values: Vec<&str> = data_str.split(',').collect();
    if values.len() != 18 {
        return None;
    }

    Some(TelemetryData {
        timestamp: iso_timestamp,
        accel_x: values[0].trim().parse().ok()?,
        accel_y: values[1].trim().parse().ok()?,
        accel_z: values[2].trim().parse().ok()?,
        gyro_x: values[3].trim().parse().ok()?,
        gyro_y: values[4].trim().parse().ok()?,
        gyro_z: values[5].trim().parse().ok()?,
        imu_temp: values[6].trim().parse().ok()?,
        bme_temp: values[7].trim().parse().ok()?,
        bme_pressure: values[8].trim().parse().ok()?,
        bme_altitude: values[9].trim().parse().ok()?,
        bme_humidity: values[10].trim().parse().ok()?,
        gps_fix: values[11].trim().parse().ok()?,
        gps_fix_quality: values[12].trim().parse().ok()?,
        gps_lat: values[13].trim().parse().ok()?,
        gps_lon: values[14].trim().parse().ok()?,
        gps_speed: values[15].trim().parse().ok()?,
        gps_altitude: values[16].trim().parse().ok()?,
        gps_satellites: values[17].trim().parse().ok()?,
        rssi,
        snr,
    })
}

fn convert_to_packet(data: &TelemetryData, packet_id: u32) -> TelemetryPacket {
    let time_parts: Vec<&str> = data.timestamp.split('T').collect();
    let time_str = time_parts.get(1).unwrap_or(&"").trim_end_matches('Z');
    let comps: Vec<&str> = time_str.split(':').collect();

    let hours: u32 = comps.get(0).unwrap_or(&"0").parse().unwrap_or(0);
    let minutes: u32 = comps.get(1).unwrap_or(&"0").parse().unwrap_or(0);
    let seconds: u32 = comps.get(2).unwrap_or(&"0").parse().unwrap_or(0);

    let total_seconds = (hours * 3600) + (minutes * 60) + seconds;

    TelemetryPacket {
        id: packet_id,
        mission_time: data.mission_time.clone(),
        connected: data.connected,
        satellites: data.satellites,
        mission_time: total_seconds.to_string(),
        connected: true,
        satellites: data.gps_satellites,
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
        battery: 100.0,
        latitude: data.gps_lat as f64,
        longitude: data.gps_lon as f64,
        altitude: data.gps_altitude,
        velocity_x: data.gyro_x,
        velocity_y: data.gyro_y,
        velocity_z: data.gyro_z,
        acceleration_x: data.accel_x,
        acceleration_y: data.accel_y,
        acceleration_z: data.accel_z,
        pitch: data.gyro_x,
        yaw: data.gyro_y,
        roll: data.gyro_z,
        minute: minutes,
        second: seconds,
    }
}

#[tauri::command]
pub fn rt_parsed_stream<R: Runtime>(
    app_handle: AppHandle<R>,
    port_name: String,
) -> Result<(), String> {
    let packet_counter = Arc::new(Mutex::new(0u32));
    let app_handle_clone = app_handle.clone();
    let serial = app_handle.state::<tauri_plugin_serialplugin::SerialPort<R>>();

    serial
        .start_listening(port_name.clone(), Some(100), Some(1024))
        .map_err(|e| e.to_string())?;

    let event_name = format!(
        "plugin-serialplugin-read-{}",
        port_name.replace(".", "-").replace("/", "-")
    );
    app_handle.listen(event_name, move |event| {
        let payload = event.payload();
        let mut accumulated_data = String::new();

        accumulated_data.push_str(payload);

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
        while let Some(pos) = accumulated_data.find("\r\n") {
            let line = accumulated_data[..pos].trim();

            if line.starts_with("Message: ") {
                current_message = line["Message: ".len()..].to_string();
            } else if line.starts_with("RSSI: ") {
                if let Ok(rssi_val) = line["RSSI: ".len()..].trim().parse() {
                    current_rssi = Some(rssi_val);
                }
            } else if line.starts_with("Snr: ") {
                if let Ok(snr_val) = line["Snr: ".len()..].trim().parse() {
                    current_snr = Some(snr_val);
                }

                if let (Some(rssi), Some(snr)) = (current_rssi, current_snr) {
                    if let Some(parsed) = parse_telemetry(&current_message, rssi, snr) {
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
                        let _ = app_handle_clone.emit("telemetry-packet", packet.clone());
                        let _ = app_handle_clone.emit("telemetry-update", packet);
                    }

                    current_message.clear();
                    current_rssi = None;
                    current_snr = None;
                }
            }

            accumulated_data = accumulated_data[pos + 2..].to_string();
        }
    });

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_telemetry_valid() {
        let input = "[2025-02-21 12:34:56] 1.0,2.0,3.0,4.0,5.0,6.0,7.0,8.0,9.0,10.0,11.0,0,1,32.99,-106.97,10.5,1000.0,5";
        let result = parse_telemetry(input, -90, 10.0).unwrap();
        assert_eq!(result.accel_x, 1.0);
        assert_eq!(result.gps_lat, 32.99);
        assert_eq!(result.rssi, -90);
        assert_eq!(result.snr, 10.0);
    }

    #[test]
    fn test_parse_telemetry_invalid_format() {
        let input = "bad data";
        let result = parse_telemetry(input, -90, 10.0);
        assert!(result.is_none());
    }

    #[test]
    fn test_convert_to_packet() {
        let data = TelemetryData {
            timestamp: "2025-02-21T12:34:56Z".to_string(),
            accel_x: 1.0, accel_y: 2.0, accel_z: 3.0,
            gyro_x: 4.0, gyro_y: 5.0, gyro_z: 6.0,
            imu_temp: 7.0, bme_temp: 8.0, bme_pressure: 9.0,
            bme_altitude: 10.0, bme_humidity: 11.0,
            gps_fix: 0, gps_fix_quality: 1,
            gps_lat: 32.99, gps_lon: -106.97, gps_speed: 10.5,
            gps_altitude: 1000.0, gps_satellites: 5,
            rssi: -90, snr: 10.0,
        };
        let packet = convert_to_packet(&data, 1);
        assert_eq!(packet.id, 1);
        assert_eq!(packet.mission_time, "45296");
        assert!((packet.latitude - 32.99).abs() < 0.0001);
        assert_eq!(packet.altitude, 1000.0);
    }
}