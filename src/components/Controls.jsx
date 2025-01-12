import { invoke } from "@tauri-apps/api/core";
import { useState, useEffect, useRef, useCallback } from 'react';

export const useSerialPorts = () => {
    const [ports, setPorts] = useState([]);

    const listPorts = async () => {
        try {
            const response = await invoke('list_ports');
            if (response.success) {
                setPorts(response.ports);  // Use actual ports from response
            }
            return response;
        } catch (error) {
            console.error('Error listing ports:', error);
            setPorts([]);
            return { success: false, message: error.toString(), ports: [] };
        }
    };

    const openPort = async (portName, baudRate = 9600) => {
        try {
            const response = await invoke('open_port', { portName, baudRate });
            return response;
        } catch (error) {
            console.error('Error opening port:', error);
            return { success: false, message: error.toString() };
        }
    };

    const closePort = async () => {
        try {
            const response = await invoke('close_port');
            return response;
        } catch (error) {
            console.error('Error closing port:', error);
            return { success: false, message: error.toString() };
        }
    };

    useEffect(() => {
        listPorts();
    }, []);

    return { ports, listPorts, openPort, closePort };
};

export const useMockDataFlow = (setIsRunning) => {
    const initializeLaunchSequence = async () => {
        try {
            await invoke('stream_telemetry');   // invoking the stream_telemetry function in backend to start the telemetry stream (will always start from 0 and go to 125 unless changed)
            return true;
        } catch (error) {
            console.error('Error in launch sequence:', error);
            setIsRunning(false);
            return false;
        }
    };

    const systemCheck = async () => {
        // Add system check logic here
        await invoke('serial_port');
        return true;
    };

    return {
        initializeLaunchSequence,
        systemCheck
    };
};

export function useSerialMonitor() {
    const [isMonitoring, setIsMonitoring] = useState(false);
    const monitorInterval = useRef(null);
    const errorCount = useRef(0);

    const toggleMonitoring = useCallback(async (enabled) => {
        if (enabled) {
            errorCount.current = 0;
            monitorInterval.current = setInterval(async () => {
                try {
                    const response = await invoke('monitor_port');
                    if (response.success) {
                        errorCount.current = 0;
                        if (response.message !== "No data available") {
                            console.log(response.message);
                        }
                    }
                } catch (error) {
                    errorCount.current += 1;
                    console.error('Monitor error:', error);
                    
                    // Only stop monitoring if we get multiple consecutive errors
                    if (errorCount.current > 5) {
                        setIsMonitoring(false);
                        clearInterval(monitorInterval.current);
                    }
                }
            }, 100);
            setIsMonitoring(true);
        } else {
            if (monitorInterval.current) {
                clearInterval(monitorInterval.current);
                monitorInterval.current = null;
            }
            setIsMonitoring(false);
        }
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (monitorInterval.current) {
                clearInterval(monitorInterval.current);
            }
        };
    }, []);

    return { isMonitoring, toggleMonitoring };
}
