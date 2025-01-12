import React, { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from "../../src/utils";
import { motion, useMotionValue, AnimatePresence } from "framer-motion";
import Logo from "../assets/Logo.png";
import { useMockDataFlow, useSerialPorts, useSerialMonitor } from './Controls';

function Sidebar({ isRunning, setIsRunning }) {
    const [activeTab, setActiveTab] = useState("console");
    const mWidth = useMotionValue(window.innerWidth / 4.5);
    const [consoleArray, setConsoleArray] = useState([]);
    const initialized = useRef(false);
    const { initializeLaunchSequence, systemCheck } = useMockDataFlow(setIsRunning);
    const { ports, listPorts, openPort, closePort } = useSerialPorts();  // Get listPorts, openPort, closePort functions
    const [selectedPort, setSelectedPort] = useState('');
    const { isMonitoring, toggleMonitoring, parsedData } = useSerialMonitor();

    // Animation variants
    const tabContentVariants = {
        enter: {
            x: 20,
            opacity: 0
        },
        center: {
            x: 0,
            opacity: 1
        },
        exit: {
            x: -20,
            opacity: 0
        }
    };

    // Rest of your existing useEffects and handlers...
    useEffect(() => {
        if (!initialized.current) {
            setConsoleArray(prev => [...prev, `Initializing system...`]);
            initialized.current = true;
        }
    }, []);

    function updateWidthAndHeight() {
        mWidth.set(window.innerWidth / 4.5);
    }

    const handleDrag = useCallback((event, info) => {
        const newWidth = mWidth.get() - info.delta.x;
        if (newWidth >= (window.innerWidth / 4.5)) {
            mWidth.set(newWidth);
        } else {
            mWidth.set(window.innerWidth / 4.5);
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
        const success = await initializeLaunchSequence();
        if (!success) {
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

    const handleRefreshPorts = async () => {
        setConsoleArray(prev => [...prev, "Refreshing available ports..."]);
        const response = await listPorts();
        if (response.success) {
            setConsoleArray(prev => [...prev, "Port list updated"]);
        } else {
            setConsoleArray(prev => [...prev, "Failed to refresh ports"]);
        }
    };

    const handleToggleMonitor = useCallback(() => {
        toggleMonitoring(!isMonitoring);
        setConsoleArray(prev => [...prev, 
            !isMonitoring ? "Started monitoring serial port..." : "Stopped monitoring serial port"
        ]);
    }, [isMonitoring, toggleMonitoring]);

    const handleOpenPort = async () => {
        if (!selectedPort) {
            setConsoleArray(prev => [...prev, "No port selected"]);
            return;
        }
        const response = await openPort(selectedPort);
        setConsoleArray(prev => [...prev, response.message]);
    };

    const handleClosePort = async () => {
        const response = await closePort();
        setConsoleArray(prev => [...prev, response.message]);
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
                            transition={{
                                duration: 0.2
                            }}
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
                            transition={{
                                duration: 0.2
                            }}
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
                                        onClick={handleRefreshPorts}
                                        className="bg-zinc-800 hover:bg-zinc-900 text-[#9CA3AF] px-4"
                                    >
                                        ⟳
                                    </button>
                                </div>

                                <div className="flex flex-row gap-2">
                                    <button 
                                        onClick={handleOpenPort}
                                        disabled={!selectedPort}
                                        className={cn(
                                            "flex-1 py-2 px-4",
                                            selectedPort 
                                                ? "bg-zinc-800 hover:bg-zinc-900 text-[#9CA3AF]" 
                                                : "bg-zinc-900 text-zinc-600 cursor-not-allowed"
                                        )}
                                    >
                                        Open Serial
                                    </button>
                                    <button 
                                        onClick={handleClosePort}
                                        disabled={!selectedPort}
                                        className={cn(
                                            "flex-1 py-2 px-4",
                                            selectedPort 
                                                ? "bg-zinc-800 hover:bg-zinc-900 text-[#9CA3AF]" 
                                                : "bg-zinc-900 text-zinc-600 cursor-not-allowed"
                                        )}
                                    >
                                        Close Serial
                                    </button>
                                </div>

                                {/* Console Output Switch */}
                                <div className={cn(
                                    "flex flex-row items-center justify-between w-full py-2 px-4",
                                    selectedPort ? "bg-zinc-800" : "bg-zinc-900"
                                )}>
                                    <span className={cn(
                                        "text-[#9CA3AF]",
                                        !selectedPort && "text-zinc-600"
                                    )}>
                                        Show Serial Data on Console
                                    </span>
                                    <button
                                        onClick={handleToggleMonitor}
                                        disabled={!selectedPort}
                                        className={cn(
                                            "w-8 h-4 rounded-full relative transition-colors duration-200",
                                            isMonitoring ? "bg-green-600" : "bg-gray-600",
                                            !selectedPort && "opacity-50 cursor-not-allowed"
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                "absolute w-3 h-3 bg-white rounded-full top-0.5 transition-transform duration-200",
                                                isMonitoring ? "translate-x-4" : "translate-x-1"
                                            )}
                                        />
                                    </button>
                                </div>

                                <button 
                                    onClick={handleLaunchSequence}
                                    disabled={!selectedPort}
                                    className={cn(
                                        "w-full py-2 px-4",
                                        selectedPort 
                                            ? "bg-zinc-800 hover:bg-zinc-900 text-[#9CA3AF]" 
                                            : "bg-zinc-900 text-zinc-600 cursor-not-allowed"
                                    )}
                                >
                                    Initialize Launch Sequence
                                </button>

                                <button 
                                    onClick={handleSystemCheck}
                                    disabled={!selectedPort}
                                    className={cn(
                                        "w-full py-2 px-4",
                                        selectedPort 
                                            ? "bg-zinc-800 hover:bg-zinc-900 text-[#9CA3AF]" 
                                            : "bg-zinc-900 text-zinc-600 cursor-not-allowed"
                                    )}
                                >
                                    System Check
                                </button>

                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className='flex flex-col px-4 py-2 text-white gap-1 flex-1'>
                <h2 className='uppercase text-lg text-[#9CA3AF]'>Live Data</h2>
                {parsedData && (
                    <>
                        <div className='flex flex-row justify-between'>
                            <p>Acceleration X</p>
                            <p>{parsedData.accel_x?.toFixed(2) || "0.00"} m/s²</p>
                        </div>
                        {/* Add more data fields as needed */}
                    </>
                )}
            </div>

            <img src={Logo} width={64} height={64} className='absolute bottom-[10px] right-[10px]' />
        </motion.div>
    )
}

export default Sidebar;