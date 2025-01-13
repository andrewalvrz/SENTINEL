//DO NOT TOUCH THIS UNLESS YOU ABSOLUTELY UNDERSTAND WHAT YOU ARE DOING
//CHECK OUT THE TESTING MODULE TO SEE HOW THIS CODE IS USED

use std::io::Read;
use std::thread;
use std::time::Duration;
use serialport::SerialPort;
use std::fs::OpenOptions;
use std::io::Write;
use crate::serial_operations::SerialConnection;
use tauri::State;
use serde::Serialize;
use std::collections::VecDeque;
use std::sync::{Arc, Mutex};
use std::time::Instant;
use tauri::Emitter; 

#[derive(Debug, Serialize, Clone)] 
pub struct TelemetryData {
    timestamp: String,
    accel_x: f32,
    accel_y: f32,
    accel_z: f32,
    gyro_x: f32,
    gyro_y: f32,
    gyro_z: f32,
    imu_temp: f32,       
    bme_temp: f32,        
    bme_pressure: f32,   
    bme_altitude: f32,    
    bme_humidity: f32,    
    gps_fix: u8,
    gps_fix_quality: u8,  
    gps_lat: f32,         
    gps_lon: f32,        
    gps_speed: f32,      
    gps_altitude: f32,    
    gps_satellites: u8,   
    rssi: i32,
    snr: f32,
}

#[derive(Debug, Serialize, Clone)]
pub struct TelemetryPacket {
    id: u32,
    mission_time: String,
    connected: bool,
    satellites: u8,
    rssi: i32,
    battery: f32,
    latitude: f64,
    longitude: f64,
    altitude: f32,
    velocity_x: f32,
    velocity_y: f32,
    velocity_z: f32,
    acceleration_x: f32,
    acceleration_y: f32,
    acceleration_z: f32,
    pitch: f32,
    yaw: f32,
    roll: f32,
    minute: u32,
    second: u32,
}

#[derive(Debug)]
pub struct TelemetryBuffer {
    buffer: VecDeque<TelemetryData>,
    last_emit: Instant,
    emit_interval: Duration,
    buffer_size: usize,
}

impl TelemetryBuffer {
    pub fn new(buffer_size: usize, emit_rate_hz: f32) -> Self {
        Self {
            buffer: VecDeque::with_capacity(buffer_size),
            last_emit: Instant::now(),
            emit_interval: Duration::from_secs_f32(1.0 / emit_rate_hz),
            buffer_size,
        }
    }

    pub fn add_data(&mut self, data: TelemetryData) -> Option<TelemetryData> {
        self.buffer.push_back(data);
        
        // Keep buffer at fixed size
        if self.buffer.len() > self.buffer_size {
            self.buffer.pop_front();
        }

        // Check if it's time to emit averaged data
        if self.last_emit.elapsed() >= self.emit_interval {
            self.last_emit = Instant::now();
            self.compute_average()
        } else {
            None
        }
    }

    fn compute_average(&self) -> Option<TelemetryData> {
        if self.buffer.is_empty() {
            return None;
        }

        let count = self.buffer.len() as f32;
        let mut avg = TelemetryData {
            timestamp: self.buffer.back()?.timestamp.clone(), // Use most recent timestamp
            accel_x: 0.0,
            accel_y: 0.0,
            accel_z: 0.0,
            gyro_x: 0.0,
            gyro_y: 0.0,
            gyro_z: 0.0,
            imu_temp: 0.0,
            bme_temp: 0.0,
            bme_pressure: 0.0,
            bme_altitude: 0.0,
            bme_humidity: 0.0,
            gps_fix: 0,
            gps_fix_quality: 0,
            gps_lat: 0.0,
            gps_lon: 0.0,
            gps_speed: 0.0,
            gps_altitude: 0.0,
            gps_satellites: self.buffer.back()?.gps_satellites, // Use most recent packet number
            rssi: 0,
            snr: 0.0,
        };

        // Sum all values
        for data in &self.buffer {
            avg.accel_x += data.accel_x;
            avg.accel_y += data.accel_y;
            avg.accel_z += data.accel_z;
            avg.gyro_x += data.gyro_x;
            avg.gyro_y += data.gyro_y;
            avg.gyro_z += data.gyro_z;
            avg.imu_temp += data.imu_temp;
            avg.bme_temp += data.bme_temp;
            avg.bme_pressure += data.bme_pressure;
            avg.bme_altitude += data.bme_altitude;
            avg.bme_humidity += data.bme_humidity;
            avg.gps_lat += data.gps_lat;
            avg.gps_lon += data.gps_lon;
            avg.gps_speed += data.gps_speed;
            avg.gps_altitude += data.gps_altitude;
            avg.rssi += data.rssi;
            avg.snr += data.snr;
        }

        // Calculate averages
        avg.accel_x /= count;
        avg.accel_y /= count;
        avg.accel_z /= count;
        avg.gyro_x /= count;
        avg.gyro_y /= count;
        avg.gyro_z /= count;
        avg.imu_temp /= count;
        avg.bme_temp /= count;
        avg.bme_pressure /= count;
        avg.bme_altitude /= count;
        avg.bme_humidity /= count;
        avg.gps_lat /= count;
        avg.gps_lon /= count;
        avg.gps_speed /= count;
        avg.gps_altitude /= count;
        avg.rssi = (avg.rssi as f32 / count) as i32;
        avg.snr /= count;

        // Use mode for discrete values
        avg.gps_fix = self.mode_u8(|d| d.gps_fix);
        avg.gps_fix_quality = self.mode_u8(|d| d.gps_fix_quality);
        avg.gps_satellites = self.mode_u8(|d| d.gps_satellites);

        Some(avg)
    }

    fn mode_u8<F>(&self, getter: F) -> u8 
    where
        F: Fn(&TelemetryData) -> u8 
    {
        let mut counts = [0u32; 256];
        for data in &self.buffer {
            counts[getter(data) as usize] += 1;
        }
        counts
            .iter()
            .enumerate()
            .max_by_key(|&(_, count)| count)
            .map(|(value, _)| value as u8)
            .unwrap_or(0)
    }
}


fn parse_timestamp(timestamp: &str) -> Option<String> {
    // Expected format: "2024/12/22 (Sunday) 15:34:09"
    let parts: Vec<&str> = timestamp.split(" ").collect();
    if parts.len() < 3 {
        return None;
    }

    let date = parts[0].replace("/", "-"); // Convert slashes to dashes
    let time = parts[2];
    
    Some(format!("{}T{}Z", date, time)) // ISO 8601 format
}

fn parse_telemetry(message: &str, rssi: i32, snr: f32) -> Option<TelemetryData> {
    let parts: Vec<&str> = message.split("] ").collect();
    if parts.len() != 2 {
        return None;
    }

    let raw_timestamp = parts[0].trim_start_matches('[');
    let timestamp = parse_timestamp(raw_timestamp)?;
    let data_str = parts[1];

    // Split the data into individual values
    let values: Vec<&str> = data_str.split(',').collect();
    if values.len() != 18 {
        return None;
    }

    // Parse all values, using ? operator to handle potential parsing errors
    Some(TelemetryData {
        timestamp,
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
    // Extract minute and second from timestamp
    let time_parts: Vec<&str> = data.timestamp.split('T').collect();
    let time = time_parts[1].trim_end_matches('Z');
    let time_components: Vec<&str> = time.split(':').collect();
    let minute = time_components[1].parse().unwrap_or(0);
    let second = time_components[2].parse().unwrap_or(0);

    TelemetryPacket {
        id: packet_id,
        mission_time: data.timestamp.clone(),
        connected: true,
        satellites: data.gps_satellites,
        rssi: data.rssi,
        battery: 100.0, // Mock battery value
        latitude: data.gps_lat as f64,
        longitude: data.gps_lon as f64,
        altitude: data.gps_altitude,
        velocity_x: data.gyro_x,  // Using gyro data for velocity
        velocity_y: data.gyro_y,
        velocity_z: data.gyro_z,
        acceleration_x: data.accel_x,
        acceleration_y: data.accel_y,
        acceleration_z: data.accel_z,
        pitch: data.gyro_x,  // Using gyro data for orientation
        yaw: data.gyro_y,
        roll: data.gyro_z,
        minute: minute,
        second: second,
    }
}

pub(crate) fn write_serial_to_file(mut port: Box<dyn SerialPort + Send>, file_path: String) {
    thread::spawn(move || {
        let mut serial_buf: Vec<u8> = vec![0; 1024];
        let mut accumulated_data = String::new();

        let file = OpenOptions::new()
            .write(true)
            .append(true)
            .create(true)
            .open(&file_path);

        let mut file = match file {
            Ok(f) => f,
            Err(e) => {
                println!("Failed to open file: {}", e);
                return;
            }
        };

        loop {
            match port.read(serial_buf.as_mut_slice()) {
                Ok(t) => {
                    if t > 0 {
                        accumulated_data.push_str(&String::from_utf8_lossy(&serial_buf[..t]));

                        while let Some(pos) = accumulated_data.find("\r\n") {
                            let line = accumulated_data[..pos].trim_start_matches('$');
                            if !line.is_empty() {
                                if let Err(e) = writeln!(file, "{}", line) {
                                    println!("Failed to write to file: {}", e);
                                    return;
                                }
                            }
                            accumulated_data = accumulated_data[pos + 2..].to_string();
                        }
                    }
                }
                Err(e) => {
                    if e.kind() == std::io::ErrorKind::TimedOut {
                        thread::sleep(Duration::from_millis(100));
                        continue;
                    }
                    println!("Critical error reading from port: {}", e);
                    break;
                }
            }
        }
    });
}

// Add new Tauri command that uses SerialConnection state
// DO NOT TOUCH THIS UNLESS YOU ABSOLUTELY UNDERSTAND WHAT YOU ARE DOING
#[tauri::command]
pub fn start_recording(file_path: String, serial_connection: State<'_, SerialConnection>) -> Result<String, String> {
    let connection = serial_connection.0.lock().unwrap();
    match connection.as_ref() {
        Some(port) => {
            let port_clone = port.try_clone().map_err(|e| e.to_string())?;
            write_serial_to_file(port_clone, file_path.clone());
            Ok(format!("Started recording to {}", file_path))
        }
        None => Err("No active serial connection".to_string()),
    }
}

#[tauri::command]
pub fn start_data_parser(app_handle: tauri::AppHandle, serial_connection: State<'_, SerialConnection>) -> Result<(), String> {
    let connection = serial_connection.0.lock().unwrap();
    match connection.as_ref() {
        Some(port) => {
            let mut port_clone = port.try_clone().map_err(|e| e.to_string())?;  // Add mut here
            let buffer = Arc::new(Mutex::new(TelemetryBuffer::new(10, 10.0)));
            let app_handle = Arc::new(app_handle);
            let packet_counter = Arc::new(Mutex::new(0u32));

            thread::spawn(move || {
                let mut serial_buf: Vec<u8> = vec![0; 1024];
                let mut accumulated_data = String::new();
                let mut current_message = String::new();
                let mut current_rssi: Option<i32> = None;
                let mut current_snr: Option<f32> = None;

                loop {
                    match port_clone.read(serial_buf.as_mut_slice()) {
                        Ok(t) => {
                            if t > 0 {
                                accumulated_data.push_str(&String::from_utf8_lossy(&serial_buf[..t]));

                                while let Some(pos) = accumulated_data.find("\r\n") {
                                    let line = accumulated_data[..pos].trim();
                                    
                                    if line.starts_with("Message: ") {
                                        current_message = line["Message: ".len()..].to_string();
                                    } else if line.starts_with("RSSI: ") {
                                        if let Ok(rssi) = line["RSSI: ".len()..].trim().parse() {
                                            current_rssi = Some(rssi);
                                        }
                                    } else if line.starts_with("Snr: ") {
                                        if let Ok(snr) = line["Snr: ".len()..].trim().parse() {
                                            current_snr = Some(snr);
                                        }

                                        if let (Some(rssi), Some(snr)) = (current_rssi, current_snr) {
                                            if let Some(telemetry) = parse_telemetry(&current_message, rssi, snr) {
                                                if let Ok(mut buffer) = buffer.lock() {
                                                    if let Some(averaged_data) = buffer.add_data(telemetry) {
                                                        let mut counter = packet_counter.lock().unwrap();
                                                        *counter += 1;
                                                        let packet = convert_to_packet(&averaged_data, *counter);
                                                        
                                                        // Emit both events to match simulator behavior
                                                        let _ = app_handle.emit("telemetry-packet", packet.clone());
                                                        let _ = app_handle.emit("telemetry-update", packet);
                                                    }
                                                }
                                            }
                                            current_message.clear();
                                            current_rssi = None;
                                            current_snr = None;
                                        }
                                    }
                                    accumulated_data = accumulated_data[pos + 2..].to_string();
                                }
                            }
                        }
                        Err(e) => {
                            if e.kind() == std::io::ErrorKind::TimedOut {
                                thread::sleep(Duration::from_millis(100));
                                continue;
                            }
                            println!("Critical error reading from port: {}", e);
                            break;
                        }
                    }
                }
            });
            Ok(())
        }
        None => Err("No active serial connection".to_string()),
    }
}