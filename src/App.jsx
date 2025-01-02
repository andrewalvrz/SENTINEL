import "./App.css";
import StatusBar from "./components/StatusBar";
import Sidebar from "./components/Sidebar";
import 'leaflet/dist/leaflet.css'
import FlightTrajectory from "./components/FlightTrajectory";
import Graphs from "./components/Graphs";
import Orientation from "./components/Orientation";
import Map from "./components/Map";
import { useEffect, useState } from "react";

function generateMockTelemetryData(baseDate = new Date(), count = 1) {
  const FLIGHT_PHASES = {
    LAUNCH: { duration: 0.1, altitudeRate: 50, maxAltitude: 500 },
    ASCENT: { duration: 0.4, altitudeRate: 20, maxAltitude: 2000 },
    CRUISE: { duration: 0.4, altitudeRate: 0, maxAltitude: 2000 },
    DESCENT: { duration: 0.1, altitudeRate: -10, maxAltitude: 0 }
  };

  const randomFloat = (min, max, decimals = 1) => {
    return Number((Math.random() * (max - min) + min).toFixed(decimals));
  };

  const addNoise = (value, magnitude = 0.1) => {
    return value + (Math.random() - 0.5) * 2 * magnitude;
  };

  const calculateFlightParameters = (progress) => {
    let phase;
    let phaseProgress;

    if (progress < FLIGHT_PHASES.LAUNCH.duration) {
      phase = 'LAUNCH';
      phaseProgress = progress / FLIGHT_PHASES.LAUNCH.duration;
    } else if (progress < FLIGHT_PHASES.LAUNCH.duration + FLIGHT_PHASES.ASCENT.duration) {
      phase = 'ASCENT';
      phaseProgress = (progress - FLIGHT_PHASES.LAUNCH.duration) / FLIGHT_PHASES.ASCENT.duration;
    } else if (progress < FLIGHT_PHASES.LAUNCH.duration + FLIGHT_PHASES.ASCENT.duration + FLIGHT_PHASES.CRUISE.duration) {
      phase = 'CRUISE';
      phaseProgress = (progress - FLIGHT_PHASES.LAUNCH.duration - FLIGHT_PHASES.ASCENT.duration) / FLIGHT_PHASES.CRUISE.duration;
    } else {
      phase = 'DESCENT';
      phaseProgress = (progress - FLIGHT_PHASES.LAUNCH.duration - FLIGHT_PHASES.ASCENT.duration - FLIGHT_PHASES.CRUISE.duration) / FLIGHT_PHASES.DESCENT.duration;
    }

    let altitude = 0;
    switch (phase) {
      case 'LAUNCH':
        altitude = FLIGHT_PHASES.LAUNCH.maxAltitude * Math.pow(phaseProgress, 0.5);
        break;
      case 'ASCENT':
        altitude = FLIGHT_PHASES.LAUNCH.maxAltitude +
          (FLIGHT_PHASES.ASCENT.maxAltitude - FLIGHT_PHASES.LAUNCH.maxAltitude) * phaseProgress;
        break;
      case 'CRUISE':
        altitude = FLIGHT_PHASES.ASCENT.maxAltitude + addNoise(0, 50);
        break;
      case 'DESCENT':
        altitude = FLIGHT_PHASES.ASCENT.maxAltitude * (1 - Math.pow(phaseProgress, 0.5));
        break;
    }

    // Calculate realistic temperature based on altitude
    // Temperature decreases roughly 6.5°C per 1000m
    const temperature = 30 - (altitude * 0.0065);

    // Calculate realistic pressure based on altitude
    // Rough approximation of pressure decrease with altitude
    const pressure = 1013.25 * Math.exp(-altitude / 7400);

    // Base coordinates (White Sands Missile Range area)
    const baseLatitude = 32.3841;
    const baseLongitude = -106.4750;

    const latOffset = Math.sin(progress * Math.PI) * 0.1;
    const lonOffset = Math.cos(progress * Math.PI) * 0.1;

    return {
      phase,
      altitude: Math.max(0, altitude),
      temperature,
      pressure,
      latitude: baseLatitude + latOffset,
      longitude: baseLongitude + lonOffset,
      verticalSpeed: FLIGHT_PHASES[phase].altitudeRate + addNoise(0, 1),
    };
  };

  const generateSingleReading = (date, id, progress) => {
    const flightParams = calculateFlightParameters(progress);

    return {
      id: id,
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
      hour: date.getHours(),
      minute: date.getMinutes(),
      second: date.getSeconds(),
      // Acceleration varies by flight phase
      accelerationX: addNoise(0, 0.5),
      accelerationY: addNoise(0, 0.5),
      accelerationZ: flightParams.phase === 'LAUNCH' ? -15 : -9.81 + addNoise(0, 0.2),
      // Angular velocity depends on phase
      velocityX: addNoise(0, 0.2),
      velocityY: addNoise(0, 0.2),
      velocityZ: addNoise(0, 0.2),
      // Orientation with realistic variations
      pitch: flightParams.phase === 'DESCENT' ? -175 + addNoise(0, 5) : addNoise(0, 5),
      roll: addNoise(0, 2),
      yaw: addNoise(180, 5),
      // Environmental sensors
      temperature: flightParams.temperature,
      pressure: flightParams.pressure,
      altitude: flightParams.altitude,
      humidity: Math.max(0, Math.min(100, 60 - (flightParams.altitude / 100))),
      // GPS data
      latitude: flightParams.latitude,
      longitude: flightParams.longitude,
      satellites: Math.floor(randomFloat(8, 12)),
      // Radio metrics degrade with altitude
      RSSI: -70 - (flightParams.altitude / 100),
      SNR: 10 - (flightParams.altitude / 500),
      // System metrics
      battery: Math.max(0, 100 - (progress * 20)),
      connected: true,
      missionTime: progress * 3600
    };
  };

  if (count === 1) {
    return generateSingleReading(baseDate, 1, 0.5);
  }

  const readings = [];
  for (let i = 0; i < count; i++) {
    const progress = i / (count - 1);1
    const timestamp = new Date(baseDate.getTime() + (i * 1000));
    readings.push(generateSingleReading(timestamp, i + 1, progress));
  }
  return readings;
}

function App() {
  const [latestPacket, setLatestPacket] = useState({});
  const [packets, setPackets] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [packetRecieved, setPacketRecieved] = useState(false);

  useEffect(() => {
    // Generate all packets at once but store them for staged release
    const allMockPackets = generateMockTelemetryData(new Date(), 125);

    // Set up an interval to add packets one at a time
    const intervalId = setInterval(() => {
      setCurrentIndex(prevIndex => {
        if (prevIndex >= allMockPackets.length - 1) {
          clearInterval(intervalId);
          return prevIndex;
        }

        const nextIndex = prevIndex + 1;
        const packetsToShow = allMockPackets.slice(0, nextIndex + 1);
        setPacketRecieved(true);

        setPackets(packetsToShow);
        setLatestPacket(packetsToShow[packetsToShow.length - 1]);

        return nextIndex;
      });
    }, 250); // Add a new packet every second

    setPackets([allMockPackets[0]]);
    setLatestPacket(allMockPackets[0]);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <main id="main" className="w-screen h-screen bg-black flex flex-col">
      <StatusBar
        missionTime={latestPacket.missionTime}
        satellites={latestPacket.satellites}
        connected={latestPacket.connected}
        RSSI={latestPacket.RSSI}
        battery={latestPacket.battery}
      />

      <div className="flex flex-row h-full font-mono overflow-hidden">
        <div className="flex-1 flex flex-col p-2 gap-2">
          <div className="flex flex-row gap-2 w-full h-[55%] min-h-0">
            <Map
              markers={packets.map(packet => ({
                id: packet.id,
                position: [packet.latitude, packet.longitude]
              }))}
            />

            <Orientation
              rotation={
                {
                  pitch: latestPacket.pitch,
                  yaw: latestPacket.yaw,
                  roll: latestPacket.roll
                }
              }
            />
          </div>

          <div className="flex flex-row gap-2 w-full flex-1 min-h-0">
            <FlightTrajectory
              points={packets.map(packet => ({
                id: packet.id,
                position: [packet.latitude, packet.longitude],
                altitude: packet.altitude
              }))}
              packetRecieved={packetRecieved}
              setPacketRecieved={setPacketRecieved}
            />

            <Graphs
              velocity={packets.map(packet => ({
                name: packet.id,
                minute: packet.minute,
                second: packet.second,
                velocityX: packet.velocityX,
                velocityY: packet.velocityY,
                velocityZ: packet.velocityZ
              }))}
              acceleration={packets.map(packet => ({
                name: packet.id,
                minute: packet.minute,
                second: packet.second,
                accelerationX: packet.accelerationX,
                accelerationY: packet.accelerationY,
                accelerationZ: packet.accelerationZ
              }))}
              rotation={packets.map(packet => ({
                name: packet.id,
                minute: packet.minute,
                second: packet.second,
                pitch: packet.pitch,
                yaw: packet.yaw,
                roll: packet.roll
              }))}
            />

          </div>
        </div>
        <Sidebar />
      </div>
    </main>
  );
}

export default App;