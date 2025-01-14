import React, { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from "../../src/utils";
import { motion, useMotionValue, AnimatePresence } from "framer-motion";
import Logo from "../assets/Logo.png";
import { useSerialPorts, useLiveDataStream } from './Controls';

function Sidebar({ isRunning, latestPacket, setIsRunning, onSystemReset }) {
    const [activeTab, setActiveTab] = useState("console");
    const mWidth = useMotionValue(window.innerWidth / 4.5);
    const [consoleArray, setConsoleArray] = useState([]);
    const initialized = useRef(false);
    const { ports, selectedPort, setSelectedPort, refreshPorts, openPort, closePort } = useSerialPorts(setConsoleArray);
    const { startLiveStream, stopLiveStream, systemCheck } = useLiveDataStream(setIsRunning, setConsoleArray);

    const tabContentVariants = {
        enter: { x: 20, opacity: 0 },
        center: { x: 0, opacity: 1 },
        exit: { x: -20, opacity: 0 },
    };

    useEffect(() => {
        if (!initialized.current) {
            setConsoleArray((prev) => [...prev, `Initializing system...`]);
            initialized.current = true;
        }
    }, []);

    function updateWidthAndHeight() {
        mWidth.set(window.innerWidth / 4.5);
    }

    const handleDrag = useCallback((event, info) => {
        const newWidth = mWidth.get() - info.delta.x;
        if (newWidth >= window.innerWidth / 4.5) {
            mWidth.set(newWidth);
        } else {
            mWidth.set(window.innerWidth / 4.5);
        }
    }, []);

    useEffect(() => {
        window.addEventListener("resize", updateWidthAndHeight);
        return () => window.removeEventListener("resize", updateWidthAndHeight);
    }, []);

    const handleStartStream = async () => {
        if (isRunning) {
            setConsoleArray(prev => [...prev, "Stream already running..."]);
            return;
        }
        
        const openResult = await openPort();
        if (openResult.success) {
            await startLiveStream();
        }
    };

    const handleStopStream = async () => {
        await stopLiveStream();
        await closePort();
    };

    return (
        <motion.div
            className="h-full bg-black border-l-2 border-[#18181B] flex flex-col font-mono relative"
            style={{ width: mWidth }}
        >
            <motion.div
                className="absolute h-full w-3 cursor-col-resize"
                drag="x"
                dragElastic={0}
                dragMomentum={false}
                dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
                onDrag={handleDrag}
                onDoubleClick={() => {
                    mWidth.set(window.innerWidth / 4.5);
                }}
            />

            <ul className="w-full h-10 border-b-2 border-[#18181B] flex flex-row items-center text-[#9CA3AF] relative">
                {["console", "controls"].map((tab) => (
                    <li key={tab} className="h-full">
                        <button
                            onClick={() => setActiveTab(tab)}
                            className={cn("px-3 h-full flex justify-center items-center uppercase relative", {
                                "text-white": activeTab === tab
                            })}
                        >
                            <p className='z-10'>{tab}</p>
                            {activeTab === tab && (
                                <motion.div
                                    className="absolute bottom-0 left:0 right-0 h-full bg-[#09090B]"
                                    layoutId="activeTab"
                                    initial={false}
                                    transition={{
                                        type: "spring",
                                        stiffness: 500,
                                        damping: 35
                                    }}
                                />
                            )}
                        </button>
                    </li>
                ))}
            </ul>

            <div className="relative flex-1 overflow-hidden">
                <AnimatePresence mode="wait">
                    {activeTab === "console" && (
                        <motion.div
                            key="console"
                            variants={tabContentVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.2 }}
                            className="absolute inset-0"
                        >
                            <textarea 
                                readOnly 
                                value={consoleArray.map((line) => "> " + line).join("\n")} 
                                className="bg-[#09090B] resize-none max-h-full h-full p-3 text-green-500 overflow-y-scroll overflow-x-hidden no-scrollbar focus:outline-none w-full" 
                            />
                        </motion.div>
                    )}

                    {activeTab === "controls" && (
                        <motion.div
                            key="controls"
                            variants={tabContentVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.2 }}
                            className="absolute inset-0"
                        >
                            <div className="flex flex-col gap-2 p-4">
                                <div className="flex flex-row gap-2">
                                    <select 
                                        className="flex-1 bg-zinc-800 text-[#9CA3AF] py-2 px-4"
                                        value={selectedPort}
                                        onChange={(e) => setSelectedPort(e.target.value)}
                                    >
                                        <option value="" disabled>Select a port</option>
                                        {ports.map(port => (
                                            <option key={port} value={port}>{port}</option>
                                        ))}
                                    </select>
                                    <button 
                                        onClick={refreshPorts}
                                        className="bg-zinc-800 hover:bg-zinc-900 text-[#9CA3AF] px-4"
                                    >
                                        ⟳
                                    </button>
                                </div>

                                <div className="flex flex-row gap-2">
                                    <button 
                                        onClick={handleStartStream}
                                        disabled={!selectedPort || isRunning}
                                        className={cn(
                                            "flex-1 py-2 px-4",
                                            selectedPort && !isRunning
                                                ? "bg-zinc-800 hover:bg-zinc-900 text-[#9CA3AF]" 
                                                : "bg-zinc-900 text-zinc-600 cursor-not-allowed"
                                        )}
                                    >
                                        Start Stream
                                    </button>
                                    <button 
                                        onClick={handleStopStream}
                                        disabled={!isRunning}
                                        className={cn(
                                            "flex-1 py-2 px-4",
                                            isRunning
                                                ? "bg-zinc-800 hover:bg-zinc-900 text-[#9CA3AF]" 
                                                : "bg-zinc-900 text-zinc-600 cursor-not-allowed"
                                        )}
                                    >
                                        Stop Stream
                                    </button>
                                </div>

                                <button 
                                    onClick={onSystemReset}
                                    disabled={isRunning}
                                    className={cn(
                                        "w-full py-2 px-4",
                                        isRunning
                                            ? "bg-zinc-900 text-zinc-600 cursor-not-allowed"
                                            : "bg-zinc-800 hover:bg-zinc-900 text-[#9CA3AF]"
                                    )}
                                >
                                    System Reset
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className='flex flex-col px-4 py-2 text-white gap-1 flex-1'>
                <h2 className='uppercase text-lg text-[#9CA3AF]'>Live Data</h2>
                <div className='flex flex-row justify-between'>
                    <p>Altitude</p>
                    <p>{latestPacket.altitude?.toFixed(2) || "0.00"} m</p>
                </div>
                <div className='flex flex-row justify-between'>
                    <p>SNR</p>
                    <p>{latestPacket.snr?.toFixed(2) || "0.00"} dBm</p>
                </div>
                <div className='flex flex-row justify-between'>
                    <p>Pressure</p>
                    <p>{latestPacket.pressure?.toFixed(2) || "0.00"} bar</p>
                </div>
                <div className='flex flex-row justify-between'>
                    <p>Acceleration (X Axis)</p>
                    <p>{latestPacket.acceleration_x?.toFixed(2) || "0.00"} m/s<sup>2</sup></p>
                </div>
                <div className='flex flex-row justify-between'>
                    <p>Acceleration (Y Axis)</p>
                    <p>{latestPacket.acceleration_y?.toFixed(2) || "0.00"} m/s<sup>2</sup></p>
                </div>
                <div className='flex flex-row justify-between'>
                    <p>Acceleration (Z Axis)</p>
                    <p>{latestPacket.acceleration_z?.toFixed(2) || "0.00"} m/s<sup>2</sup></p>
                </div>
                <div className='flex flex-row justify-between'>
                    <p>Velocity (X Axis)</p>
                    <p>{latestPacket.velocity_x?.toFixed(2) || "0.00"} m/s</p>
                </div>
                <div className='flex flex-row justify-between'>
                    <p>Velocity (Y Axis)</p>
                    <p>{latestPacket.velocity_y?.toFixed(2) || "0.00"} m/s</p>
                </div>
                <div className='flex flex-row justify-between'>
                    <p>Velocity (Z Axis)</p>
                    <p>{latestPacket.velocity_z?.toFixed(2) || "0.00"} m/s</p>
                </div>
                <div className='flex flex-row justify-between'>
                    <p>Longitude</p>
                    <p>{latestPacket.longitude?.toFixed(7) || "0.00"}</p>
                </div>
                <div className='flex flex-row justify-between'>
                    <p>Latitude</p>
                    <p>{latestPacket.latitude?.toFixed(7) || "0.00"}</p>
                </div>
            </div>

            <img src={Logo} width={64} height={64} className='absolute bottom-[10px] right-[10px]' />
        </motion.div>
    );
}

export default Sidebar;
