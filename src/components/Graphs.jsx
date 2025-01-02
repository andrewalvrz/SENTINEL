import React, { useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { cn } from "../utils";
import { useState } from "react";

function Graphs({ velocity, acceleration, rotation }) {
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
                                        data={rotation}
                                        margin={{
                                            top: 8,
                                            right: 20
                                        }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" angle={-45} textAnchor="end" interval={8} />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend wrapperStyle={{ paddingTop: "20px" }} />
                                        <Line isAnimationActive={false} type="monotone" dataKey="pitch" stroke="#84cc16" fill="#84cc16" />
                                        <Line isAnimationActive={false} type="monotone" dataKey="yaw" stroke="#dc2626" fill="#dc2626" />
                                        <Line isAnimationActive={false} type="monotone" dataKey="roll" stroke="#facc15" fill="#facc15" />
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
                                        data={velocity}
                                        margin={{
                                            top: 8,
                                            right: 20
                                        }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" angle={-45} textAnchor="end" interval={8} />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend wrapperStyle={{ paddingTop: "20px" }} />
                                        <Line isAnimationActive={false} type="monotone" dataKey="velocityX" stroke="#84cc16" fill="#84cc16" />
                                        <Line isAnimationActive={false} type="monotone" dataKey="velocityY" stroke="#dc2626" fill="#dc2626" />
                                        <Line isAnimationActive={false} type="monotone" dataKey="velocityZ" stroke="#facc15" fill="#facc15" />
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
                                        data={acceleration}
                                        margin={{
                                            top: 8,
                                            right: 20
                                        }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" angle={-45} textAnchor="end" interval={8} />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend wrapperStyle={{ paddingTop: "20px" }} />
                                        <Line isAnimationActive={false} type="monotone" dataKey="accelerationX" stroke="#84cc16" fill="#84cc16" />
                                        <Line isAnimationActive={false} type="monotone" dataKey="accelerationY" stroke="#dc2626" fill="#dc2626" />
                                        <Line isAnimationActive={false} type="monotone" dataKey="accelerationZ" stroke="#facc15" fill="#facc15" />
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