import React, { useEffect, useRef } from 'react'
import { cn } from "../../src/utils";
import { motion, useMotionValue } from "framer-motion";
import Logo from "../assets/Logo.png";
import { useState, useCallback } from "react";
import { useMockDataFlow } from './Controls';

function Sidebar({ isRunning, latestPacket, updateTelemetryData, setIsRunning }) {
    const [activeTab, setActiveTab] = useState("console");
    const mWidth = useMotionValue(window.innerWidth / 4.75);
    const [consoleArray, setConsoleArray] = useState([]);
    const initialized = useRef(false);
    const { initializeLaunchSequence, systemCheck } = useMockDataFlow(updateTelemetryData, setIsRunning);

    useEffect(() => {
        if (!initialized.current) {
            setConsoleArray(prev => [...prev, `Initializing system...`]);
            setConsoleArray(prev => [...prev, `Initializing system 1...`]);
            setConsoleArray(prev => [...prev, `Initializing system 2...`]);
            initialized.current = true;
        }
    }, []);

    function updateWidthAndHeight() {
        mWidth.set(window.innerWidth / 4.75);
    }

    const handleDrag = useCallback((event, info) => {
        const newWidth = mWidth.get() - info.delta.x;
        if (newWidth >= (window.innerWidth / 4.75)) {
            mWidth.set(newWidth);
        } else {
            mWidth.set(window.innerWidth / 4.75);
        }
    }, []);

    useEffect(() => {
        window.addEventListener("resize", updateWidthAndHeight);
        return () => window.removeEventListener("resize", updateWidthAndHeight);
    }, []);

    const handleLaunchSequence = async () => {
        if (isRunning) {
            setConsoleArray(prev => [...prev, "Simulation already running..."]);
            return;
        }
        setConsoleArray(prev => [...prev, "Initializing launch sequence..."]);
        const data = await initializeLaunchSequence();
        if (data.length > 0) {
            setConsoleArray(prev => [...prev, "Launch sequence initialized successfully"]);
        } else {
            setConsoleArray(prev => [...prev, "Launch sequence initialization failed"]);
        }
    };

    const handleSystemCheck = async () => {
        setConsoleArray(prev => [...prev, "Running system check..."]);
        const success = await systemCheck();
        if (success) {
            setConsoleArray(prev => [...prev, "System check completed successfully"]);
        } else {
            setConsoleArray(prev => [...prev, "System check failed"]);
        }
    };

    return (
        <motion.div
            className="h-full bg-black border-l-2 border-[#18181B] flex flex-col font-mono relative"
            style={{
                width: mWidth,
            }}
        >
            <motion.div
                className="absolute h-full w-3 cursor-col-resize"
                drag="x"
                dragElastic={0}
                dragMomentum={false}
                dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
                onDrag={handleDrag}
                onDoubleClick={() => {
                    mWidth.set(window.innerWidth / 4.75);
                }}
            />

            <ul className="w-full h-10 border-b-2 border-[#18181B] flex flex-row items-center text-[#9CA3AF]">
                <li className="h-full"><button onClick={() => setActiveTab("console")} className={cn("px-3 h-full flex justify-center items-center uppercase", { "bg-[#09090B]": activeTab === "console" })}>Console</button></li>
                <li className="h-full"><button onClick={() => setActiveTab("controls")} className={cn("px-3 h-full flex justify-center items-center uppercase", { "bg-[#09090B]": activeTab === "controls" })}>Controls</button></li>
            </ul>

            {activeTab === "console" &&
                <textarea readOnly value={consoleArray.map((line) => "> " + line).join("\n")} className="bg-[#09090B] h-96 max-h-96 p-3 text-green-500 overflow-y-scroll overflow-x-hidden no-scrollbar focus:outline-none" />
            }

            {activeTab === "controls" &&
                <div className="flex flex-col gap-2 p-4">
                    <button 
                        onClick={handleLaunchSequence}
                        className="w-full bg-zinc-800 hover:bg-zinc-900 text-[#9CA3AF] py-2 px-4"
                    >
                        Initialize Launch Sequence
                    </button>
                    <button 
                        onClick={handleSystemCheck}
                        className="w-full bg-zinc-800 hover:bg-zinc-900 text-[#9CA3AF] py-2 px-4"
                    >
                        System Check
                    </button>
                </div>
            }

            <div className='flex flex-col px-4 py-2 text-white gap-1'>
                <h2 className='uppercase text-lg text-[#9CA3AF]'>Live Data</h2>
                <div className='flex flex-row justify-between'>
                    <p>Altitude</p>
                    <p>{latestPacket.altitude?.toFixed(2) || "0.00"} m</p>
                </div>
                <div className='flex flex-row justify-between'>
                    <p>SNR</p>
                    <p>9.50 dBm</p>
                </div>
                <div className='flex flex-row justify-between'>
                    <p>Pressure</p>
                    <p>1017.00 bar (&Delta;: 17.00 bar)</p>
                </div>
                <div className='flex flex-row justify-between'>
                    <p>Acceleration</p>
                    <p>0.97 m/s<sup>2</sup> (&Delta;: 0.07 m/s<sup>2</sup>)</p>
                </div>
                <div className='flex flex-row justify-between'>
                    <p>Longitude</p>
                    <p>32.9903312</p>
                </div>
                <div className='flex flex-row justify-between'>
                    <p>Latitude</p>
                    <p>-106.9747588</p>
                </div>
            </div>

            <img src={Logo} width={64} height={64} className='absolute bottom-[10px] right-[10px]' />

        </motion.div>
    )
}

export default Sidebar