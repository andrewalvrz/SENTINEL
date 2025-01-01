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
        }), uv: 4000
    },
    {
        name: new Date(Date.now()).toLocaleString('en-US', {
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
        }), uv: 3000
    },
    {
        name: new Date(Date.now()).toLocaleString('en-US', {
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
        }), uv: 2000
    },
    {
        name: new Date(Date.now()).toLocaleString('en-US', {
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
        })
    },
    {
        name: new Date(Date.now()).toLocaleString('en-US', {
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
        }), uv: 1890
    },
    {
        name: new Date(Date.now()).toLocaleString('en-US', {
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
        }), uv: 3000
    },
    {
        name: new Date(Date.now()).toLocaleString('en-US', {
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
        }), uv: 3490
    },
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
                <div className="flex-1 overflow-hidden flex flex-row p-2">
                    {
                        graphActiveTab === "rotation" && (
                            <>
                                <div className="flex-1 flex flex-col">
                                    <h2 className="text-[#9CA3AF] text-center">Pitch</h2>
                                    <div className="flex-1 overflow-hidden">
                                        <ResponsiveContainer className={"w-full h-full"}>
                                            <LineChart
                                                width={500}
                                                height={200}
                                                data={data}
                                                margin={{
                                                    bottom: 20
                                                }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="name" angle={-45} textAnchor="end" />
                                                <YAxis />
                                                <Tooltip />
                                                <Line type="monotone" dataKey="uv" stroke="#84cc16" fill="#84cc16" />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col">
                                    <h2 className="text-[#9CA3AF] text-center">Yaw</h2>
                                    <div className="flex-1 overflow-hidden">
                                        <ResponsiveContainer className={"w-full h-full overflow-visible"}>
                                            <LineChart
                                                width={500}
                                                height={200}
                                                data={data}
                                                margin={{
                                                    bottom: 20
                                                }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="name" angle={-45} textAnchor="end" />
                                                <YAxis />
                                                <Tooltip />
                                                <Line type="monotone" dataKey="uv" stroke="#dc2626" fill="#dc2626" />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col">
                                    <h2 className="text-[#9CA3AF] text-center ">Roll</h2>
                                    <div className="flex-1 overflow-hidden">
                                        <ResponsiveContainer className={"w-full h-full"}>
                                            <LineChart
                                                width={500}
                                                height={200}
                                                data={data}
                                                margin={{
                                                    bottom: 20
                                                }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="name" angle={-45} textAnchor="end" />
                                                <YAxis />
                                                <Tooltip />
                                                <Line type="monotone" dataKey="uv" stroke="#facc15" fill="#facc15" />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </>
                        )
                    }

                    {
                        graphActiveTab === "velocity" && (
                            <>
                                <div className="flex-1 flex flex-col">
                                    <h2 className="text-[#9CA3AF] text-center ">X Axis</h2>
                                    <div className="flex-1 overflow-hidden">
                                        <ResponsiveContainer className={"w-full h-full"}>
                                            <LineChart
                                                width={500}
                                                height={200}
                                                data={data}
                                                margin={{
                                                    bottom: 20
                                                }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="name" angle={-45} textAnchor="end" />
                                                <YAxis />
                                                <Tooltip />
                                                <Line type="monotone" dataKey="uv" stroke="#84cc16" fill="#84cc16" />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col">
                                    <h2 className="text-[#9CA3AF] text-center ">Y Axis</h2>
                                    <div className="flex-1 overflow-hidden">
                                        <ResponsiveContainer className={"w-full h-full"}>
                                            <LineChart
                                                width={500}
                                                height={200}
                                                data={data}
                                                margin={{
                                                    bottom: 20
                                                }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="name" angle={-45} textAnchor="end" />
                                                <YAxis />
                                                <Tooltip />
                                                <Line type="monotone" dataKey="uv" stroke="#dc2626" fill="#dc2626" />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col">
                                    <h2 className="text-[#9CA3AF] text-center ">Z Axis</h2>
                                    <div className="flex-1 overflow-hidden">
                                        <ResponsiveContainer className={"w-full h-full"}>
                                            <LineChart
                                                width={500}
                                                height={200}
                                                data={data}
                                                margin={{
                                                    bottom: 20
                                                }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="name" angle={-45} textAnchor="end" />
                                                <YAxis />
                                                <Tooltip />
                                                <Line type="monotone" dataKey="uv" stroke="#facc15" fill="#facc15" />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </>
                        )
                    }

                    {
                        graphActiveTab === "acceleration" && (
                            <>
                                <div className="flex-1 flex flex-col">
                                    <h2 className="text-[#9CA3AF] text-center ">X Axis</h2>
                                    <div className="flex-1 overflow-hidden">
                                        <ResponsiveContainer className={"w-full h-full"}>
                                            <LineChart
                                                width={500}
                                                height={200}
                                                data={data}
                                                margin={{
                                                    bottom: 20
                                                }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="name" angle={-45} textAnchor="end" />
                                                <YAxis />
                                                <Tooltip />
                                                <Line type="monotone" dataKey="uv" stroke="#84cc16" fill="#84cc16" />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col">
                                    <h2 className="text-[#9CA3AF] text-center ">Y Axis</h2>
                                    <div className="flex-1 overflow-hidden">
                                        <ResponsiveContainer className={"w-full h-full"}>
                                            <LineChart
                                                width={500}
                                                height={200}
                                                data={data}
                                                margin={{
                                                    bottom: 20
                                                }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="name" angle={-45} textAnchor="end" />
                                                <YAxis />
                                                <Tooltip />
                                                <Line type="monotone" dataKey="uv" stroke="#dc2626" fill="#dc2626" />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col">
                                    <h2 className="text-[#9CA3AF] text-center ">Z Axis</h2>
                                    <div className="flex-1 overflow-hidden">
                                        <ResponsiveContainer className={"w-full h-full"}>
                                            <LineChart
                                                width={500}
                                                height={200}
                                                data={data}
                                                margin={{
                                                    bottom: 20
                                                }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="name" angle={-45} textAnchor="end" />
                                                <YAxis />
                                                <Tooltip />
                                                <Line type="monotone" dataKey="uv" stroke="#facc15" fill="#facc15" />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </>
                        )
                    }
                </div>
            </div>
        </div>
    )
}

export default Graphs