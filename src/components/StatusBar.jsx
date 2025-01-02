import React from 'react'
import { Satellite, BatteryFull, SignalHigh } from 'lucide-react';
import { cn } from "../utils";

function StatusBar({ missionTime, satellites, connected, RSSI, battery }) {

    function secondsToHHMMSS(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
    
        return [
            hours.toString().padStart(2, '0'),
            minutes.toString().padStart(2, '0'),
            secs.toString().padStart(2, '0')
        ].join(':');
    }

    return (
        <div className="w-full h-14 bg-[#09090B] flex flex-row items-center justify-between px-4 border-b-2 border-[#18181B]" data-tauri-drag-region>

            <div className="flex flex-col items-center font-mono">
                <p className="text-[#9CA3AF]">Mission Clock</p>
                <p className="text-white">{secondsToHHMMSS(missionTime)}</p>
            </div>

            <div className="flex flex-col items-center font-mono">
                <p className="text-[#9CA3AF]">Satellites</p>
                <div className="text-white flex flex-row items-center gap-2">
                    <p>{satellites}</p>
                    <Satellite size={18} />
                </div>
            </div>

            <div className="flex flex-col items-center font-mono">
                <p className="text-[#9CA3AF]">Status</p>
                <p className={cn("font-semibold", {
                    "text-red-600": !connected,
                    "text-green-600": connected
                })}>{connected ? "CONNECTED" : "DISCONNECTED"}</p>
            </div>

            <div className="flex flex-col items-center font-mono">
                <p className="text-[#9CA3AF]">Signal</p>
                <div className="text-white flex flex-row items-center gap-2">
                    <p>{Math.round(RSSI)} dBm</p>
                    <SignalHigh size={18} />
                </div>
            </div>

            <div className="flex flex-col items-center font-mono">
                <p className="text-[#9CA3AF]">Battery</p>
                <div className="text-white flex flex-row items-center gap-2">
                    <p>{Math.floor(battery)}%</p>
                    <BatteryFull size={18} />
                </div>
            </div>

        </div>
    )
}

export default StatusBar