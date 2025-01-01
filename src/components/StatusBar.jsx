import React from 'react'
import { Satellite, BatteryFull, SignalHigh } from 'lucide-react';

function StatusBar() {
    return (
        <div className="w-full h-14 bg-[#09090B] flex flex-row items-center justify-between px-4 border-b-2 border-[#18181B]" data-tauri-drag-region>

            <div className="flex flex-col items-center font-mono">
                <p className="text-[#9CA3AF]">Mission Clock</p>
                <p className="text-white">00:00:00</p>
            </div>

            <div className="flex flex-col items-center font-mono">
                <p className="text-[#9CA3AF]">Satellites</p>
                <div className="text-white flex flex-row items-center gap-2">
                    <p>0</p>
                    <Satellite size={18} />
                </div>
            </div>

            <div className="flex flex-col items-center font-mono">
                <p className="text-[#9CA3AF]">Status</p>
                <p className="text-red-600">DISCONNECTED</p>
            </div>

            <div className="flex flex-col items-center font-mono">
                <p className="text-[#9CA3AF]">Signal</p>
                <div className="text-white flex flex-row items-center gap-2">
                    <p>5.00 KB/s</p>
                    <SignalHigh size={18} />
                </div>
            </div>

            <div className="flex flex-col items-center font-mono">
                <p className="text-[#9CA3AF]">Battery</p>
                <div className="text-white flex flex-row items-center gap-2">
                    <p>100%</p>
                    <BatteryFull size={18} />
                </div>
            </div>

        </div>
    )
}

export default StatusBar