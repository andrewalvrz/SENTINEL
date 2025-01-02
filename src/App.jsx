import React from 'react';
import './index.css';

function App() {
  return (
    <div className="flex flex-col w-full h-screen bg-[#232323]">
      {/* Header */}
      <div className="flex justify-between items-center h-20 px-10 bg-[#232323]">
        <InfoCard title="Time" value="00:00:00" />
        <InfoCard title="Satellites" value="0" />
        <InfoCard title="Status" value="DISCONNECTED" valueClass="text-red-500" />
        <InfoCard title="Signal" value="5.00 KB/s" />
        <InfoCard title="Battery" value="100%" />
      </div>

      {/* Main Content */}
      <div className="flex flex-wrap gap-6 p-6">
        <div className="flex-none w-1/4 h-1/8 bg-[#201f1f] shadow-md border border-[#444] rounded-3xl"></div>
        <div className="flex-none w-[10vw] h-[20vw] bg-[#1a1a1a] shadow-md border border-[#444] rounded-lg"></div>
        <div className="flex-none w-[15vw] h-[40vh] bg-[#1a1a1a] shadow-md border border-[#444] rounded-lg"></div>
        <div className="flex-none w-[20vw] h-[30vh] bg-[#1a1a1a] shadow-md border border-[#444] rounded-2xl"></div>
        <div className="flex-none w-[20vw] h-[30vh] bg-[#1a1a1a] shadow-md border border-[#444] rounded-2xl"></div>
        <div className="flex-grow w-[40vw] h-[40vh] bg-[#1a1a1a] shadow-md border border-[#444] rounded-lg"></div>
        <div className="flex-none w-[40vw] h-[40vh] bg-[#1a1a1a] shadow-md border border-[#444] rounded-2xl"></div>
      </div>
    </div>
  );
}

function InfoCard({ title, value, valueClass }) {
  return (
    <div className="flex flex-col items-center text-white">
      <div className={`text-xl font-mono ${valueClass || ''}`}>{value}</div>
      <div className="text-gray-400 text-lg font-mono">{title}</div>
    </div>
  );
}

export default App;
