use serde::{Deserialize, Serialize};
use regex::Regex;
use tauri::Emitter;

#[derive(Debug, Serialize, Deserialize)]
pub struct ParsedData {
    timestamp: String,
    accel_x: f64,
    accel_y: f64,
    accel_z: f64,
    gyro_x: f64,
    gyro_y: f64,
    gyro_z: f64,
    imu_temp: f64,
    bme_temp: f64,
    bme_pressure: f64,
    bme_altitude: f64,
    bme_humidity: f64,
    gps_fix: i32,
    gps_fix_quality: i32,
    gps_lat: f64,
    gps_lon: f64,
    gps_speed: f64,
    gps_altitude: f64,
    gps_satellites: i32,
    rssi: i32,
    snr: f64,
}

#[derive(Debug, Serialize)]
pub struct ParserResponse {
    success: bool,
    message: String,
    data: Option<ParsedData>,
}

#[tauri::command]
pub fn parse_serial_data(window: tauri::Window, raw_data: &str) -> ParserResponse {
    // Extract the main message part using regex
    let message_regex = Regex::new(r"\[(.*?)\] (.*?)(?:\r?\n|\z)").unwrap();
    let rssi_regex = Regex::new(r"RSSI: (-?\d+)").unwrap();
    let snr_regex = Regex::new(r"Snr: (-?\d+\.?\d*)").unwrap();

    let message_cap = match message_regex.captures(raw_data) {
        Some(cap) => cap,
        None => return ParserResponse {
            success: false,
            message: "Failed to parse message format".to_string(),
            data: None,
        },
    };

    let timestamp = message_cap[1].to_string();
    let values: Vec<&str> = message_cap[2].split(',').collect();

    if values.len() < 18 {
        return ParserResponse {
            success: false,
            message: "Insufficient data values".to_string(),
            data: None,
        };
    }

    // Extract RSSI and SNR
    let rssi = rssi_regex.captures(raw_data)
        .and_then(|cap| cap[1].parse::<i32>().ok())
        .unwrap_or(0);

    let snr = snr_regex.captures(raw_data)
        .and_then(|cap| cap[1].parse::<f64>().ok())
        .unwrap_or(0.0);

    // Parse all values with safe conversion
    let parse_f64 = |s: &str| s.trim().parse::<f64>().unwrap_or(0.0);
    let parse_i32 = |s: &str| s.trim().parse::<i32>().unwrap_or(0);

    let parsed_data = ParsedData {
        timestamp,
        accel_x: parse_f64(values[0]),
        accel_y: parse_f64(values[1]),
        accel_z: parse_f64(values[2]),
        gyro_x: parse_f64(values[3]),
        gyro_y: parse_f64(values[4]),
        gyro_z: parse_f64(values[5]),
        imu_temp: parse_f64(values[6]),
        bme_temp: parse_f64(values[7]),
        bme_pressure: parse_f64(values[8]),
        bme_altitude: parse_f64(values[9]),
        bme_humidity: parse_f64(values[10]),
        gps_fix: parse_i32(values[11]),
        gps_fix_quality: parse_i32(values[12]),
        gps_lat: parse_f64(values[13]),
        gps_lon: parse_f64(values[14]),
        gps_speed: parse_f64(values[15]),
        gps_altitude: parse_f64(values[16]),
        gps_satellites: parse_i32(values[17]),
        rssi,
        snr,
    };

    let parsed_response = ParserResponse {
        success: true,
        message: "Data parsed successfully".to_string(),
        data: Some(parsed_data),
    };

    if let Some(parsed_data) = &parsed_response.data {
        // Emit the parsed data as an event
        let _ = window.emit("parsed-telemetry", parsed_data);
    }

    parsed_response
}
