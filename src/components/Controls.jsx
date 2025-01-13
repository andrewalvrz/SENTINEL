import { invoke } from "@tauri-apps/api/core";
import { listen } from '@tauri-apps/api/event';
import { useState, useEffect, useCallback } from 'react';

export const useSerialPorts = (setConsoleArray) => {
    const [ports, setPorts] = useState([]);
    const [parsedData, setParsedData] = useState(null);
    const [selectedPort, setSelectedPort] = useState('');

    useEffect(() => {
        const unlisten = listen('telemetry-update', (event) => {
            setParsedData(event.payload);
        });

        return () => {
            unlisten.then(f => f());
        };
    }, []);

    const refreshPorts = async () => {
        setConsoleArray(prev => [...prev, "Refreshing available ports..."]);
        try {
            const ports = await invoke('list_serial_ports');
            setPorts(ports);
            if (ports.length > 0 && !selectedPort) {
                setSelectedPort(ports[0]);
            }
            setConsoleArray(prev => [...prev, `Found ${ports.length} ports`]);
            return { success: true, ports };
        } catch (error) {
            setConsoleArray(prev => [...prev, `Failed to refresh ports: ${error}`]);
            setPorts([]);
            return { success: false, error };
        }
    };

    const openPort = async () => {
        if (!selectedPort) {
            setConsoleArray(prev => [...prev, "No port selected"]);
            return { success: false };
        }
        try {
            const result = await invoke('open_serial', { 
                portName: selectedPort, 
                baudRate: 115200 
            });
            setConsoleArray(prev => [...prev, result]);
            // Start the data parser after opening the port
            await invoke('start_data_parser');
            return { success: true };
        } catch (error) {
            setConsoleArray(prev => [...prev, `Failed to open port: ${error}`]);
            return { success: false, error };
        }
    };

    const closePort = async () => {
        try {
            const result = await invoke('close_serial');
            setConsoleArray(prev => [...prev, result]);
            return { success: true };
        } catch (error) {
            setConsoleArray(prev => [...prev, `Failed to close port: ${error}`]);
            return { success: false, error };
        }
    };

    useEffect(() => {
        refreshPorts();
    }, []);

    return { 
        ports,
        selectedPort,
        setSelectedPort,
        refreshPorts,
        openPort,
        closePort,
        parsedData
    };
};

export const useDataParser = (setConsoleArray) => {
    const startDataParsing = async () => {
        try {
            setConsoleArray(prev => [...prev, "Starting data parser..."]);
            await invoke('start_data_parser');
            setConsoleArray(prev => [...prev, "Data parser started successfully"]);
            return { success: true };
        } catch (error) {
            setConsoleArray(prev => [...prev, `Failed to start data parser: ${error}`]);
            return { success: false, error };
        }
    };

    return { startDataParsing };
};

export const useMockDataFlow = (setIsRunning, setConsoleArray, isRunning) => {
    const initializeLaunchSequence = async () => {
        if (isRunning) {
            setConsoleArray(prev => [...prev, "Launch sequence already running..."]);
            return false;
        }
        try {
            setConsoleArray(prev => [...prev, "Initializing launch sequence..."]);
            await invoke('stream_telemetry');
            setIsRunning(true);
            setConsoleArray(prev => [...prev, "Launch sequence started successfully"]);
            return true;
        } catch (error) {
            setConsoleArray(prev => [...prev, `Launch sequence failed: ${error}`]);
            setIsRunning(false);
            return false;
        }
    };

    return { initializeLaunchSequence };
};
