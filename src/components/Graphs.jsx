import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { cn } from "../utils";
import { useState } from "react";

const data = [
    {
        name: new Date(Date.now()).toLocaleString('en-US', {
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
        }),
        // Velocity (m/s)
        xVelocity: 45.2,
        yVelocity: 312.5,
        zVelocity: 12.8,
        // Acceleration (m/s²)
        xAccel: 2.5,
        yAccel: 85.4,
        zAccel: 1.2,
        // Rotation (degrees/s)
        roll: 15.2,
        pitch: 2.1,
        yaw: 1.8
    },
    {
        name: new Date(Date.now()).toLocaleString('en-US', {
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
        }),
        xVelocity: 52.8,
        yVelocity: 425.7,
        zVelocity: 18.3,
        xAccel: 4.2,
        yAccel: 95.2,
        zAccel: 2.1,
        roll: 18.5,
        pitch: 3.2,
        yaw: 2.4
    },
    {
        name: new Date(Date.now()).toLocaleString('en-US', {
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
        }),
        xVelocity: 38.4,
        yVelocity: 528.9,
        zVelocity: 22.5,
        xAccel: 3.8,
        yAccel: 102.8,
        zAccel: 2.8,
        roll: 22.4,
        pitch: 4.5,
        yaw: 3.2
    },
    {
        name: new Date(Date.now()).toLocaleString('en-US', {
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
        }),
        xVelocity: 25.6,
        yVelocity: 482.3,
        zVelocity: 15.7,
        xAccel: -2.1,
        yAccel: 45.6,
        zAccel: 1.5,
        roll: 25.8,
        pitch: 2.8,
        yaw: 2.1
    },
    {
        name: new Date(Date.now()).toLocaleString('en-US', {
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
        }),
        xVelocity: 18.9,
        yVelocity: 325.4,
        zVelocity: 12.4,
        xAccel: -3.5,
        yAccel: -25.8,
        zAccel: -1.2,
        roll: 28.2,
        pitch: -1.5,
        yaw: 1.8
    },
    {
        name: new Date(Date.now()).toLocaleString('en-US', {
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
        }),
        xVelocity: 12.3,
        yVelocity: 185.6,
        zVelocity: 8.9,
        xAccel: -2.8,
        yAccel: -65.4,
        zAccel: -2.1,
        roll: 32.5,
        pitch: -2.8,
        yaw: 1.2
    },
    {
        name: new Date(Date.now()).toLocaleString('en-US', {
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
        }),
        xVelocity: 8.5,
        yVelocity: 85.2,
        zVelocity: 5.4,
        xAccel: -1.5,
        yAccel: -45.2,
        zAccel: -1.8,
        roll: 35.8,
        pitch: -3.2,
        yaw: 0.8
    }
];

function Graphs() {
    const [graphActiveTab, setGraphActiveTab] = useState("velocity");

    return (
        <div className="flex-1 min-w-0" data-swapy-slot="4">
            <div data-swapy-item="d" className="border-2 border-[#201F1F] rounded-md flex flex-col h-full w-full overflow-hidden backdrop-blur-sm">
                <ul className="w-full flex items-center border-b-2 border-[#201F1F] drag-handle cursor-move select-none" data-swapy-handle>
                    <li>
                        <button
                            className={cn("text-[#9CA3AF] text-lg px-3 py-1", {
                                "bg-[#09090B]": graphActiveTab === "velocity"
                            })}
                            onClick={() => setGraphActiveTab("velocity")}
                        >Velocity</button>
                    </li>
                    <li>
                        <button
                            className={cn("text-[#9CA3AF] text-lg px-3 py-1", {
                                "bg-[#09090B]": graphActiveTab === "acceleration"
                            })}
                            onClick={() => setGraphActiveTab("acceleration")}
                        >Acceleration</button>
                    </li>
                    <li>
                        <button
                            className={cn("text-[#9CA3AF] text-lg px-3 py-1", {
                                "bg-[#09090B]": graphActiveTab === "rotation"
                            })}
                            onClick={() => setGraphActiveTab("rotation")}
                        >Rotation</button>
                    </li>
                </ul>
                <div className="flex-1 overflow-hidden flex flex-row py-2">
                    {
                        graphActiveTab === "rotation" && (
                            <div className="flex-1 overflow-hidden">
                                <ResponsiveContainer className={"w-full h-full"}>
                                    <LineChart
                                        width={500}
                                        height={200}
                                        data={data}
                                        margin={{
                                            top: 8,
                                            right: 20
                                        }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" angle={-45} textAnchor="end" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend wrapperStyle={{ paddingTop: "20px" }} />
                                        <Line type="monotone" dataKey="pitch" stroke="#84cc16" fill="#84cc16" />
                                        <Line type="monotone" dataKey="yaw" stroke="#dc2626" fill="#dc2626" />
                                        <Line type="monotone" dataKey="roll" stroke="#facc15" fill="#facc15" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )
                    }

                    {
                        graphActiveTab === "velocity" && (
                            <div className="flex-1 overflow-hidden">
                                <ResponsiveContainer className={"w-full h-full"}>
                                    <LineChart
                                        width={500}
                                        height={200}
                                        data={data}
                                        margin={{
                                            top: 8,
                                            right: 20
                                        }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" angle={-45} textAnchor="end" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend wrapperStyle={{ paddingTop: "20px" }} />
                                        <Line type="monotone" dataKey="xVelocity" stroke="#84cc16" fill="#84cc16" />
                                        <Line type="monotone" dataKey="yVelocity" stroke="#dc2626" fill="#dc2626" />
                                        <Line type="monotone" dataKey="zVelocity" stroke="#facc15" fill="#facc15" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )
                    }

                    {
                        graphActiveTab === "acceleration" && (
                            <div className="flex-1 overflow-hidden">
                                <ResponsiveContainer className={"w-full h-full"}>
                                    <LineChart
                                        width={500}
                                        height={200}
                                        data={data}
                                        margin={{
                                            top: 8,
                                            right: 20
                                        }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" angle={-45} textAnchor="end" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend wrapperStyle={{ paddingTop: "20px" }} />
                                        <Line type="monotone" dataKey="xAccel" stroke="#84cc16" fill="#84cc16" />
                                        <Line type="monotone" dataKey="yAccel" stroke="#dc2626" fill="#dc2626" />
                                        <Line type="monotone" dataKey="zAccel" stroke="#facc15" fill="#facc15" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )
                    }
                </div>
            </div>
        </div>
    )
}

export default Graphs