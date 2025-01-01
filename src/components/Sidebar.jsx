import React from 'react'
import { cn } from "../../src/utils";
import { motion, useMotionValue } from "framer-motion";
import Logo from "../assets/Logo.png";
import { useState, useCallback } from "react";

function Sidebar() {
    const [activeTab, setActiveTab] = useState("console");
    const mWidth = useMotionValue(window.innerWidth / 5);

    function updateWidthAndHeight() {
        mWidth.set(window.innerWidth / 5);
    }

    const handleDrag = useCallback((event, info) => {
        const newWidth = mWidth.get() - info.delta.x;
        if (newWidth >= (window.innerWidth / 5)) {
            mWidth.set(newWidth);
        } else {
            mWidth.set(window.innerWidth / 5);
        }

        window.addEventListener("resize", updateWidthAndHeight);
        return () => window.removeEventListener("resize", updateWidthAndHeight);
    }, []);

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
                    mWidth.set(window.innerWidth / 5);
                }}
            />

            <ul className="w-full h-10 border-b-2 border-[#18181B] flex flex-row items-center text-[#9CA3AF]">
                <li className="h-full"><button onClick={() => setActiveTab("console")} className={cn("px-3 h-full flex justify-center items-center uppercase", { "bg-[#09090B]": activeTab === "console" })}>Console</button></li>
                <li className="h-full"><button onClick={() => setActiveTab("controls")} className={cn("px-3 h-full flex justify-center items-center uppercase", { "bg-[#09090B]": activeTab === "controls" })}>Controls</button></li>
            </ul>
            {activeTab === "console" && <>
                <div className="bg-[#09090B] h-96 p-3 text-green-500 overflow-y-scroll overflow-x-hidden no-scrollbar truncate">
                    <p>{"> Establishing ground control link..."}</p>
                    <p>{"> Establishing ground control link..."}</p>
                    <p>{"> Establishing ground control link..."}</p>
                    <p>{"> Establishing ground control link..."}</p>
                    <p>{"> Establishing ground control link..."}</p>
                    <p>{"> Establishing ground control link..."}</p>
                    <p>{"> Establishing ground control link..."}</p>
                    <p>{"> Establishing ground control link..."}</p>
                    <p>{"> Establishing ground control link..."}</p>
                    <p>{"> Establishing ground control link..."}</p>
                    <p>{"> Establishing ground control link..."}</p>
                    <p>{"> Establishing ground control link..."}</p>
                    <p>{"> Establishing ground control link..."}</p>
                    <p>{"> Establishing ground control link..."}</p>
                    <p>{"> Establishing ground control link..."}</p>
                    <p>{"> Establishing ground control link..."}</p>
                    <p>{"> Establishing ground control link..."}</p>
                    <p>{"> Establishing ground control link..."}</p>
                    <p>{"> Establishing ground control link..."}</p>
                    <p>{"> Establishing ground control link..."}</p>
                    <p>{"> Establishing ground control link..."}</p>
                    <p>{"> Establishing ground control link..."}</p>
                </div>

                <div className='flex flex-col px-4 py-2 text-[#9CA3AF] gap-1'>
                    <h2 className='uppercase text-lg'>Live Data</h2>
                    <div className='flex flex-row justify-between'>
                        <p>Altitude</p>
                        <p>0.00 m</p>
                    </div>
                    <div className='flex flex-row justify-between'>
                        <p>Velocity</p>
                        <p>0.00 m/s</p>
                    </div>
                    <div className='flex flex-row justify-between'>
                        <p>Acceleration</p>
                        <p>0.00 m/s<sup>2</sup></p>
                    </div>
                </div>

            </>
            }
            
            <img src={Logo} width={64} height={64} className='absolute bottom-[10px] right-[10px]' />

        </motion.div>
    )
}

export default Sidebar