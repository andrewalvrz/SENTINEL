// src/components/Sidebar.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from "../utils";
import { motion, useMotionValue, AnimatePresence } from "framer-motion";
import Logo from "../assets/Logo.png";
import { useSerialPorts, useLiveDataStream } from './Controls';

function Sidebar({ isRunning, latestPacket, setIsRunning, onSystemReset }) {
    const [activeTab, setActiveTab] = useState("console");
    const mWidth = useMotionValue(window.innerWidth / 4.5);
    const [consoleArray, setConsoleArray] = useState([]);
    const initialized = useRef(false);
    const { ports, selectedPort, setSelectedPort, refreshPorts, openPort, closePort } = useSerialPorts(setConsoleArray, isRunning);
    const { startLiveStream, stopLiveStream, systemCheck } = useLiveDataStream(setIsRunning, setConsoleArray);

    const [loraSettings, setLoraSettings] = useState({
        frequency: "915.0",
        spreadingFactor: "7",
        bandwidth: "250.0",
        codingRate: "5",
        outputPower: "17",
        syncWord: "0xAB",
        fcAddress: "0xA2",
        gsAddress: "0xA1",
        preambleLength: "8"
    });

    const handleSettingChange = (setting, value) => {
        setLoraSettings(prev => ({ ...prev, [setting]: value }));
        setConsoleArray(prev => [...prev, `Setting ${setting} changed to ${value}`]);
    };

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

    const handleBuzzer = () => {
        setConsoleArray(prev => [...prev, "Activating buzzer..."]);
    };

    const handlePressureValve = () => {
        setConsoleArray(prev => [...prev, "Activating pressure valve..."]);
    };

    const handleApplySettings = () => {
        setConsoleArray(prev => [...prev, "Applying LoRa settings..."]);
    };

    return (
        <motion.div
            className="h-full bg-gray-100 border-l-2 border-gray-300 flex flex-col font-mono relative text-black"
            style={{ width: mWidth }}
        >
            <motion.div
                className="absolute h-full w-3 cursor-col-resize bg-gray-200"
                drag="x"
                dragElastic={0}
                dragMomentum={false}
                dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
                onDrag={handleDrag}
                onDoubleClick={() => mWidth.set(window.innerWidth / 4.5)}
            />

            <ul className="w-full h-10 border-b-2 border-gray-300 flex flex-row items-center text-gray-500 relative">
                {["console", "controls", "settings"].map((tab) => (
                    <li key={tab} className="h-full">
                        <button
                            onClick={() => setActiveTab(tab)}
                            className={cn("px-3 h-full flex justify-center items-center uppercase relative", {
                                "text-black": activeTab === tab
                            })}
                        >
                            <p className='z-10'>{tab}</p>
                            {activeTab === tab && (
                                <motion.div
                                    className="absolute bottom-0 left-0 right-0 h-full bg-gray-200"
                                    layoutId="activeTab"
                                    initial={false}
                                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
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
                                className="bg-gray-200 resize-none max-h-full h-full p-3 text-green-500 overflow-y-scroll overflow-x-hidden no-scrollbar focus:outline-none w-full" 
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
                                        className="flex-1 bg-gray-200 text-gray-700 py-2 px-4"
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
                                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4"
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
                                                ? "bg-gray-200 hover:bg-gray-300 text-gray-700" 
                                                : "bg-gray-300 text-gray-500 cursor-not-allowed"
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
                                                ? "bg-gray-200 hover:bg-gray-300 text-gray-700" 
                                                : "bg-gray-300 text-gray-500 cursor-not-allowed"
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
                                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                            : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                                    )}
                                >
                                    System Reset
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === "settings" && (
                        <motion.div
                            key="settings"
                            variants={tabContentVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.2 }}
                            className="absolute inset-0 overflow-y-auto"
                        >
                            <div className="flex flex-col gap-3 p-4 text-gray-700">
                                <h2 className="text-lg font-semibold text-black">LoRa Settings</h2>
                                
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm">Frequency (MHz)</label>
                                    <select 
                                        className="bg-gray-200 py-2 px-3 text-gray-700"
                                        value={loraSettings.frequency}
                                        onChange={(e) => handleSettingChange('frequency', e.target.value)}
                                        disabled={isRunning}
                                    >
                                        <option value="868.0">868.0 MHz (Europe)</option>
                                        <option value="915.0">915.0 MHz (North America)</option>
                                        <option value="433.0">433.0 MHz (Asia)</option>
                                    </select>
                                    <p className="text-xs text-gray-500">Range: 862.0–928.0 MHz (region specific)</p>
                                </div>
                                
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm">Spreading Factor</label>
                                    <select 
                                        className="bg-gray-200 py-2 px-3 text-gray-700"
                                        value={loraSettings.spreadingFactor}
                                        onChange={(e) => handleSettingChange('spreadingFactor', e.target.value)}
                                        disabled={isRunning}
                                    >
                                        {[6, 7, 8, 9, 10, 11, 12].map(sf => (
                                            <option key={sf} value={sf.toString()}>SF{sf} {sf === 7 ? '(Default - Fast)' : sf === 12 ? '(Slow, Long Range)' : ''}</option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-500">Lower = faster, Higher = longer range</p>
                                </div>
                                
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm">Bandwidth (kHz)</label>
                                    <select 
                                        className="bg-gray-200 py-2 px-3 text-gray-700"
                                        value={loraSettings.bandwidth}
                                        onChange={(e) => handleSettingChange('bandwidth', e.target.value)}
                                        disabled={isRunning}
                                    >
                                        <option value="125.0">125 kHz (Long Range)</option>
                                        <option value="250.0">250 kHz (Default - Balanced)</option>
                                        <option value="500.0">500 kHz (High Speed)</option>
                                    </select>
                                    <p className="text-xs text-gray-500">Wider = faster, Narrower = better sensitivity</p>
                                </div>
                                
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm">Coding Rate</label>
                                    <select 
                                        className="bg-gray-200 py-2 px-3 text-gray-700"
                                        value={loraSettings.codingRate}
                                        onChange={(e) => handleSettingChange('codingRate', e.target.value)}
                                        disabled={isRunning}
                                    >
                                        <option value="5">4/5 (Default - Less Robust)</option>
                                        <option value="6">4/6</option>
                                        <option value="7">4/7</option>
                                        <option value="8">4/8 (Most Robust)</option>
                                    </select>
                                    <p className="text-xs text-gray-500">Higher = more error correction</p>
                                </div>
                                
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm">Output Power (dBm): {loraSettings.outputPower}</label>
                                    <input 
                                        type="range" 
                                        min="2" 
                                        max="20" 
                                        value={loraSettings.outputPower}
                                        onChange={(e) => handleSettingChange('outputPower', e.target.value)}
                                        className="bg-gray-200"
                                        disabled={isRunning}
                                    />
                                    <p className="text-xs text-gray-500">Range: 2–20 dBm (higher = longer range)</p>
                                </div>
                                
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm">Sync Word (hex)</label>
                                    <input 
                                        type="text" 
                                        value={loraSettings.syncWord}
                                        onChange={(e) => handleSettingChange('syncWord', e.target.value)}
                                        className="bg-gray-200 py-2 px-3 text-gray-700"
                                        placeholder="0xAB"
                                        disabled={isRunning}
                                    />
                                    <p className="text-xs text-gray-500">Must match between devices</p>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm">FC Address (hex)</label>
                                        <input 
                                            type="text" 
                                            value={loraSettings.fcAddress}
                                            onChange={(e) => handleSettingChange('fcAddress', e.target.value)}
                                            className="bg-gray-200 py-2 px-3 text-gray-700"
                                            placeholder="0xA2"
                                            disabled={isRunning}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm">GS Address (hex)</label>
                                        <input 
                                            type="text" 
                                            value={loraSettings.gsAddress}
                                            onChange={(e) => handleSettingChange('gsAddress', e.target.value)}
                                            className="bg-gray-200 py-2 px-3 text-gray-700"
                                            placeholder="0xA1"
                                            disabled={isRunning}
                                        />
                                    </div>
                                </div>
                                
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm">Preamble Length</label>
                                    <input 
                                        type="number" 
                                        min="6"
                                        max="65535"
                                        value={loraSettings.preambleLength}
                                        onChange={(e) => handleSettingChange('preambleLength', e.target.value)}
                                        className="bg-gray-200 py-2 px-3 text-gray-700"
                                        disabled={isRunning}
                                    />
                                    <p className="text-xs text-gray-500">Range: 6–65535 symbols</p>
                                </div>
                                
                                <button
                                    onClick={handleApplySettings}
                                    disabled={isRunning}
                                    className={cn(
                                        "w-full py-2 px-4 mt-2",
                                        isRunning
                                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                            : "bg-gray-400 hover:bg-gray-500 text-black"
                                    )}
                                >
                                    Apply Settings
                                </button>
                                
                                <div className="border-t border-gray-300 my-2 pt-4">
                                    <h2 className="text-lg font-semibold text-black mb-3">Control Systems</h2>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={handleBuzzer}
                                            className="bg-yellow-600 hover:bg-yellow-700 text-white py-3 px-4"
                                        >
                                            Activate Buzzer
                                        </button>
                                        <button
                                            onClick={handlePressureValve}
                                            className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-4"
                                        >
                                            Pressure Valve
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="flex flex-col px-4 py-2 gap-1 flex-1">
                <h2 className="uppercase text-lg text-gray-500">Live Data</h2>
                <div className="flex flex-row justify-between">
                    <p>Altitude</p>
                    <p>{latestPacket.altitude?.toFixed(2) || "0.00"} m</p>
                </div>
                <div className="flex flex-row justify-between">
                    <p>SNR</p>
                    <p>{latestPacket.snr?.toFixed(2) || "0.00"} dBm</p>
                </div>
                <div className="flex flex-row justify-between">
                    <p>Pressure</p>
                    <p>{latestPacket.pressure?.toFixed(2) || "0.00"} bar</p>
                </div>
                <div className="flex flex-row justify-between">
                    <p>Acceleration (X Axis)</p>
                    <p>{latestPacket.acceleration_x?.toFixed(2) || "0.00"} m/s<sup>2</sup></p>
                </div>
                <div className="flex flex-row justify-between">
                    <p>Acceleration (Y Axis)</p>
                    <p>{latestPacket.acceleration_y?.toFixed(2) || "0.00"} m/s<sup>2</sup></p>
                </div>
                <div className="flex flex-row justify-between">
                    <p>Acceleration (Z Axis)</p>
                    <p>{latestPacket.acceleration_z?.toFixed(2) || "0.00"} m/s<sup>2</sup></p>
                </div>
                <div className="flex flex-row justify-between">
                    <p>Velocity (X Axis)</p>
                    <p>{latestPacket.velocity_x?.toFixed(2) || "0.00"} m/s</p>
                </div>
                <div className="flex flex-row justify-between">
                    <p>Velocity (Y Axis)</p>
                    <p>{latestPacket.velocity_y?.toFixed(2) || "0.00"} m/s</p>
                </div>
                <div className="flex flex-row justify-between">
                    <p>Velocity (Z Axis)</p>
                    <p>{latestPacket.velocity_z?.toFixed(2) || "0.00"} m/s</p>
                </div>
                <div className="flex flex-row justify-between">
                    <p>Longitude</p>
                    <p>{latestPacket.longitude?.toFixed(7) || "0.00"}</p>
                </div>
                <div className="flex flex-row justify-between">
                    <p>Latitude</p>
                    <p>{latestPacket.latitude?.toFixed(7) || "0.00"}</p>
                </div>
            </div>

            <img src={Logo} width={64} height={64} className="absolute bottom-[10px] right-[10px]" />
        </motion.div>
    );
}

export default Sidebar;