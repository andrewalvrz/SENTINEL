//TelemetryContext.jsx
import { createContext, useContext, useState } from 'react';

const TelemetryContext = createContext();

export const TelemetryProvider = ({ children }) => {
    const [latestPacket, setLatestPacket] = useState({});
    const [packets, setPackets] = useState([]);
    const [isRunning, setIsRunning] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [packetReceived, setPacketReceived] = useState(false);

    const updateTelemetryData = (allPackets) => {
        setPackets([allPackets[0]]);
        setLatestPacket(allPackets[0]);
        
        let index = 0;
        const intervalId = setInterval(() => {
            if (index >= allPackets.length - 1) {
                clearInterval(intervalId);
                setIsRunning(false);
                return;
            }

            index++;
            setCurrentIndex(index);
            setPacketReceived(true);
            setPackets(allPackets.slice(0, index + 1));
            setLatestPacket(allPackets[index]);
        }, 250);

        return () => clearInterval(intervalId);
    };

    return (
        <TelemetryContext.Provider value={{
            latestPacket,
            packets,
            isRunning,
            currentIndex,
            packetReceived,
            setPacketReceived,
            updateTelemetryData,
            setIsRunning
        }}>
            {children}
        </TelemetryContext.Provider>
    );
};

export const useTelemetry = () => useContext(TelemetryContext);
