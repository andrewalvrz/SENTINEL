import { invoke } from "@tauri-apps/api/core";
import { useState, useEffect } from 'react';

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

    useEffect(() => {
        listPorts();
    }, []);

    return { ports, listPorts };
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
