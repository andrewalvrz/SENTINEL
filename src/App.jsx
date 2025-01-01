import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import StatusBar from "./components/StatusBar";
import Sidebar from "./components/Sidebar";
import 'leaflet/dist/leaflet.css'
import FlightTrajectory from "./components/FlightTrajectory";
import Graphs from "./components/Graphs";
import Orientation from "./components/Orientation";
import Map from "./components/Map";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  async function greet() {
    setGreetMsg(await invoke("greet", { name }));
  }

  return (
    <main id="main" className="w-screen h-screen bg-black flex flex-col">
      <StatusBar />

      <div className="flex flex-row h-full font-mono overflow-hidden">
        <div className="flex-1 flex flex-col p-2 gap-2">
          <div className="flex flex-row gap-2 w-full h-[55%] min-h-0">

            <Map />

            <Orientation />

          </div>

          <div className="flex flex-row gap-2 w-full flex-1 min-h-0">

            <FlightTrajectory />

            <Graphs />

          </div>
        </div>

        <Sidebar />
      </div>
    </main>
  );
}

export default App;