use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter, Listener, Manager, Runtime};
use serde::Serialize;

#[derive(Debug, Serialize, Clone)]
pub struct TelemetryData {
    pub timestamp: String,
    pub accel_x: f32,
    pub accel_y: f32,
    pub accel_z: f32,
    pub gyro_x: f32,
    pub gyro_y: f32,
    pub gyro_z: f32,
    pub imu_temp: f32,
    pub bme_temp: f32,
    pub bme_pressure: f32,
    pub bme_altitude: f32,
    pub bme_humidity: f32,
    pub gps_fix: u8,
    pub gps_fix_quality: u8,
    pub gps_lat: f32,
    pub gps_lon: f32,
    pub gps_speed: f32,
    pub gps_altitude: f32,
    pub gps_satellites: u8,
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

fn parse_telemetry(message: &str, rssi: i32, snr: f32) -> Option<TelemetryData> {
    let parts: Vec<&str> = message.split("] ").collect();
    if parts.len() != 2 {
        return None;
    }

    let raw_timestamp = parts[0].trim_start_matches('[');
    let ts_parts: Vec<&str> = raw_timestamp.split(' ').collect();
    if ts_parts.len() < 3 {
        return None;
    }
    let date = ts_parts[0].replace("/", "-");
    let time = ts_parts[2];
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
        mission_time: total_seconds.to_string(),
        connected: true,
        satellites: data.gps_satellites,
        rssi: data.rssi,
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

    // Start listening on the port
    serial
        .start_listening(port_name.clone(), Some(100), Some(1024))
        .map_err(|e| e.to_string())?;

    // Register an event listener for incoming data
    let event_name = format!(
        "plugin-serialplugin-read-{}",
        port_name.replace(".", "-").replace("/", "-")
    );
    app_handle.listen(event_name, move |event| {
        let payload = event.payload(); // payload is &str
        let mut accumulated_data = String::new();
        let mut current_message = String::new();
        let mut current_rssi: Option<i32> = None;
        let mut current_snr: Option<f32> = None;

        accumulated_data.push_str(payload);

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
                    if let Some(parsed) = parse_telemetry(&current_message, rssi, snr) { // Fixed typo
                        let mut count = packet_counter.lock().unwrap();
                        *count += 1;
                        let packet = convert_to_packet(&parsed, *count);

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