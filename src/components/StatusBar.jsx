// src/components/StatusBar.jsx
import React, { useState } from 'react';
import { Satellite, BatteryFull, SignalHigh } from 'lucide-react';
import { cn } from "../utils";

function StatusBar({ missionTime, satellites, connected, RSSI, battery }) {
    const [showConsoleOutput] = useState(false);

    function secondsToHHMMSS(seconds) {
        const totalSeconds = typeof seconds === 'string' ? parseInt(seconds, 10) : seconds;
        if (isNaN(totalSeconds)) return '00:00:00';
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const secs = Math.floor(totalSeconds % 60);
        return [
            hours.toString().padStart(2, '0'),
            minutes.toString().padStart(2, '0'),
            secs.toString().padStart(2, '0')
        ].join(':');
    }

    return (
        <div className="w-full h-14 bg-gray-200 flex flex-row items-center justify-between px-4 border-b-2 border-gray-300 text-black" data-tauri-drag-region>
            <div className="flex flex-col items-center font-mono">
                <p className="text-gray-500">Mission Clock</p>
                <p>{secondsToHHMMSS(missionTime)}</p>
            </div>

            <div className="flex flex-col items-center font-mono">
                <p className="text-gray-500">Satellites</p>
                <div className="flex flex-row items-center gap-2">
                    <p>{satellites}</p>
                    <Satellite size={18} />
                </div>
            </div>

            <div className="flex flex-col items-center font-mono">
                <p className="text-gray-500">Status</p>
                <p className={cn("font-semibold", {
                    "text-red-600": !connected,
                    "text-green-600": connected
                })}>{connected ? "CONNECTED" : "DISCONNECTED"}</p>
            </div>

            <div className="flex flex-col items-center font-mono">
                <p className="text-gray-500">Signal</p>
                <div className="flex flex-row items-center gap-2">
                    <p>{Math.round(RSSI)} dBm</p>
                    <SignalHigh size={18} />
                </div>
            </div>

            <div className="flex flex-col items-center font-mono">
                <p className="text-gray-500">Battery</p>
                <div className="flex flex-row items-center gap-2">
                    <p>{Math.floor(battery)}%</p>
                    <BatteryFull size={18} />
                </div>
            </div>
        </div>
    );
}

export default StatusBar;