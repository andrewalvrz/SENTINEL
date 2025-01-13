import "./App.css";
import StatusBar from "./components/StatusBar";
import Sidebar from "./components/Sidebar";
import 'leaflet/dist/leaflet.css'
import FlightTrajectory from "./components/FlightTrajectory";
import Graphs from "./components/Graphs";
import Orientation from "./components/Orientation";
import Map from "./components/Map";
import { useState, useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';

function App() {
  const [latestPacket, setLatestPacket] = useState({});
  const [packets, setPackets] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [packetReceived, setPacketReceived] = useState(false);

  useEffect(() => {
    const unlisten = [];

    async function setupListeners() {
      // Listen for telemetry packets
      unlisten.push(
        await listen('telemetry-packet', event => {
          setPackets(prev => [...prev, event.payload]);
          setLatestPacket(event.payload);
          setPacketReceived(true);
          setIsRunning(true);
        })
      );

      // Optional: Listen for connection status changes
      unlisten.push(
        await listen('serial-disconnected', () => {
          setIsRunning(false);
          // Optionally clear or preserve existing data
          // setPackets([]);
          // setLatestPacket({});
        })
      );
    }

    setupListeners();
    return () => unlisten.forEach(fn => fn());
  }, []);

  return (
    <main id="main" className="w-screen h-screen bg-black flex flex-col">
      <StatusBar
        missionTime={latestPacket.mission_time}
        satellites={latestPacket.satellites}
        connected={latestPacket.connected}
        RSSI={latestPacket.rssi}
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
              packetRecieved={packetReceived}
              setPacketRecieved={setPacketReceived}
            />

            <Graphs
              velocity={packets.map(packet => ({
                name: packet.id,
                minute: packet.minute,
                second: packet.second,
                velocityX: packet.velocity_x,
                velocityY: packet.velocity_y,
                velocityZ: packet.velocity_z
              }))}
              acceleration={packets.map(packet => ({
                name: packet.id,
                minute: packet.minute,
                second: packet.second,
                accelerationX: packet.acceleration_x,
                accelerationY: packet.acceleration_y,
                accelerationZ: packet.acceleration_z
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

        <Sidebar 
          isRunning={isRunning} 
          latestPacket={latestPacket}
          setIsRunning={setIsRunning}
        />
      </div>
    </main>
  );
}

export default App;