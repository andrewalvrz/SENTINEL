use chrono::{Datelike, Timelike, Local};
use serde::{Deserialize, Serialize};
use std::f64::consts::PI;
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

struct FlightPhase {
    pub duration: f64,
    pub max_altitude: f64,
}

struct FlightPhases {
    pub launch: FlightPhase,
    pub ascent: FlightPhase,
    pub cruise: FlightPhase,
    pub descent: FlightPhase,
}

fn random_float(min: f64, max: f64, decimals: u32) -> f64 {
    let multiplier = 10f64.powi(decimals as i32);
    ((rand::random::<f64>() * (max - min) + min) * multiplier).round() / multiplier
}

fn add_noise(value: f64, magnitude: f64) -> f64 {
    value + (rand::random::<f64>() - 0.5) * 2.0 * magnitude
}

#[tauri::command]
pub fn mockdata(count: i32) -> Vec<TelemetryPacket> {
    let flight_phases = FlightPhases {
        launch: FlightPhase { duration: 0.1, max_altitude: 500.0 },
        ascent: FlightPhase { duration: 0.4, max_altitude: 2000.0 },
        cruise: FlightPhase { duration: 0.4, max_altitude: 2000.0 },
        descent: FlightPhase { duration: 0.1, max_altitude: 0.0 },
    };

    let base_date = Local::now();
    let mut packets = Vec::new();

    for i in 0..count {
        let progress = i as f64 / (count - 1) as f64;
        let timestamp = base_date + chrono::Duration::seconds(i as i64);
        
        // Calculate phase and progress
        let (phase, altitude) = if progress < flight_phases.launch.duration {
            let phase_progress = progress / flight_phases.launch.duration;
            ("LAUNCH", flight_phases.launch.max_altitude * phase_progress.powf(0.5))
        } else if progress < flight_phases.launch.duration + flight_phases.ascent.duration {
            let phase_progress = (progress - flight_phases.launch.duration) / flight_phases.ascent.duration;
            ("ASCENT", flight_phases.launch.max_altitude + 
                (flight_phases.ascent.max_altitude - flight_phases.launch.max_altitude) * phase_progress)
        } else if progress < flight_phases.launch.duration + flight_phases.ascent.duration + flight_phases.cruise.duration {
            ("CRUISE", flight_phases.ascent.max_altitude + add_noise(0.0, 50.0))
        } else {
            let phase_progress = (progress - flight_phases.launch.duration - flight_phases.ascent.duration - 
                flight_phases.cruise.duration) / flight_phases.descent.duration;
            ("DESCENT", flight_phases.ascent.max_altitude * (1.0 - phase_progress.powf(0.5)))
        };

        let altitude = altitude.max(0.0);
        let temperature = 30.0 - (altitude * 0.0065);
        let pressure = 1013.25 * (-altitude / 7400.0).exp();
        
        // Base coordinates (White Sands Missile Range area)
        let base_latitude = 32.3841;
        let base_longitude = -106.4750;
        let lat_offset = (progress * PI).sin() * 0.1;
        let lon_offset = (progress * PI).cos() * 0.1;

        let packet = TelemetryPacket {
            id: i + 1,
            year: timestamp.year(),
            month: timestamp.month(),
            day: timestamp.day(),
            hour: timestamp.hour(),
            minute: timestamp.minute(),
            second: timestamp.second(),
            acceleration_x: add_noise(0.0, 0.5),
            acceleration_y: add_noise(0.0, 0.5),
            acceleration_z: if phase == "LAUNCH" { -15.0 } else { -9.81 + add_noise(0.0, 0.2) },
            velocity_x: add_noise(0.0, 0.2),
            velocity_y: add_noise(0.0, 0.2),
            velocity_z: add_noise(0.0, 0.2),
            pitch: if phase == "DESCENT" { -175.0 + add_noise(0.0, 5.0) } else { add_noise(0.0, 5.0) },
            roll: add_noise(0.0, 2.0),
            yaw: add_noise(180.0, 5.0),
            temperature,
            pressure,
            altitude,
            humidity: (60.0 - (altitude / 100.0)).max(0.0).min(100.0),
            latitude: base_latitude + lat_offset,
            longitude: base_longitude + lon_offset,
            satellites: random_float(8.0, 12.0, 0) as i32,
            rssi: -70.0 - (altitude / 100.0),
            snr: 10.0 - (altitude / 500.0),
            battery: (100.0 - (progress * 20.0)).max(0.0),
            connected: true,
            mission_time: progress * 3600.0,
        };

        packets.push(packet);
    }

    packets
}

#[tauri::command]
pub async fn stream_telemetry(window: tauri::Window) {
    println!("Starting telemetry stream from Rust...");
    let packets = mockdata(125);
    println!("Generated {} packets", packets.len());
    
    for (i, packet) in packets.iter().enumerate() {
        println!("Sending packet {} with altitude {}", i + 1, packet.altitude);
        if let Err(e) = window.emit("telemetry-packet", &packet) {
            eprintln!("Failed to emit packet {}: {:?}", i + 1, e);
            return;
        }
        tokio::time::sleep(tokio::time::Duration::from_millis(250)).await;
    }
    
    if let Err(e) = window.emit("telemetry-complete", ()) {
        eprintln!("Failed to emit complete signal: {:?}", e);
    }
}