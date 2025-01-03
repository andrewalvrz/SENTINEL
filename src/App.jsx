//App.jsx
import "./App.css";
import StatusBar from "./components/StatusBar";
import Sidebar from "./components/Sidebar";
import 'leaflet/dist/leaflet.css'
import FlightTrajectory from "./components/FlightTrajectory";
import Graphs from "./components/Graphs";
import Orientation from "./components/Orientation";
import Map from "./components/Map";
import { useState, useEffect, useCallback } from 'react';
import { listen } from '@tauri-apps/api/event';

function App() {
  const [latestPacket, setLatestPacket] = useState({});
  const [packets, setPackets] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [packetReceived, setPacketReceived] = useState(false);

  const resetSimulation = () => {
    setIsRunning(false); // Add this line to ensure we reset the running state
    setPackets([]);
    setLatestPacket({});
    setCurrentIndex(0);
    setPacketReceived(false);
  };

  const handlePacket = useCallback((event) => {
    console.log('Processing packet:', event.payload);
    setPackets(prev => [...prev, event.payload]);
    setLatestPacket(event.payload);
    setPacketReceived(true);
    setIsRunning(true);
  }, []);

  const handleComplete = useCallback(() => {
    console.log('Telemetry complete');
    setIsRunning(false);
  }, []);

  useEffect(() => {
    let unlistenFunctions = [];
    let mounted = true;

    async function setupListeners() {
      try {
        console.log('Setting up event listeners...');
        
        // Unregister any existing listeners first
        unlistenFunctions.forEach(fn => fn());
        unlistenFunctions = [];

        if (mounted) {
          const unlistenPacket = await listen('telemetry-packet', handlePacket);
          const unlistenComplete = await listen('telemetry-complete', handleComplete);
          
          unlistenFunctions.push(unlistenPacket, unlistenComplete);
          console.log('Event listeners setup complete');
        }
      } catch (error) {
        console.error('Error setting up event listeners:', error);
      }
    }

    setupListeners();

    return () => {
      mounted = false;
      console.log('Cleaning up listeners...');
      unlistenFunctions.forEach(fn => fn());
    };
  }, []); // Empty dependency array since we're using useCallback for handlers

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
          resetSimulation={resetSimulation} // Add this line back
        />
      </div>
    </main>
  );
}

export default App;