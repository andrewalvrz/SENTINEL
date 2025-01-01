import React from 'react'

function Orientation() {
    return (
        <div className="flex-1 min-w-0" data-swapy-slot="2">
            <div data-swapy-item="b" className="border-2 border-[#201F1F] rounded-md flex flex-col h-full w-full overflow-hidden backdrop-blur-sm">
                <div className="w-full bg-[#09090B] flex items-center py-1 px-2 border-b-2 border-[#201F1F] drag-handle cursor-move select-none" data-swapy-handle>
                    <p className="text-[#9CA3AF] text-lg">Orientation</p>
                </div>
                <div className="flex-1 relative overflow-hidden">
                    <div className="absolute inset-0 h-full w-full bg-[radial-gradient(#201F1F_1px,transparent_1px)] [background-size:9px_9px]" />
                </div>
            </div>
        </div>
    )
}

export default Orientation