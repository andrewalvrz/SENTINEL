//App.jsx
import "./App.css";
import StatusBar from "./components/StatusBar";
import Sidebar from "./components/Sidebar";
import 'leaflet/dist/leaflet.css'
import FlightTrajectory from "./components/FlightTrajectory";
import Graphs from "./components/Graphs";
import Orientation from "./components/Orientation";
import Map from "./components/Map";
import { useState } from 'react';

function AppContent() {
  const [latestPacket, setLatestPacket] = useState({});
  const [packets, setPackets] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [packetReceived, setPacketReceived] = useState(false);

  const updateTelemetryData = (allPackets) => {
    setPackets([allPackets[0]]);
    setLatestPacket(allPackets[0]);

    let index = 0;
    const intervalId = setInterval(() => {
      if (index >= allPackets.length - 1) {
        clearInterval(intervalId);
        setIsRunning(false);
        return;
      }
      index++;
      setCurrentIndex(index);
      setPacketReceived(true);
      setPackets(allPackets.slice(0, index + 1));
      setLatestPacket(allPackets[index]);
    }, 250);

    return () => clearInterval(intervalId);
  };

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
          updateTelemetryData={updateTelemetryData}
          setIsRunning={setIsRunning}
        />
      </div>
    </main>
  );
}

//Handles the telemetry data, makes it available to the rest of the app
function App() {
  return (
    <AppContent />
  );
}

export default App;