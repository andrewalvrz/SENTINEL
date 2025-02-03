// src/components/Controls.jsx

import { invoke } from "@tauri-apps/api/core";
import { listen } from '@tauri-apps/api/event';
import { useState, useEffect, useCallback, useRef } from 'react';

export const useLiveDataStream = (setIsRunning, setConsoleArray) => {
  const startLiveStream = async () => {
    try {
      setConsoleArray(prev => [...prev, "Starting live data stream..."]);
      await invoke('rt_parsed_stream');
      setConsoleArray(prev => [...prev, "Live data stream started successfully"]);
      setIsRunning(true);
      return { success: true };
    } catch (error) {
      setConsoleArray(prev => [...prev, `Failed to start live stream: ${error}`]);
      setIsRunning(false);
      return { success: false, error };
    }
  };

  const stopLiveStream = async () => {
    try {
      setConsoleArray(prev => [...prev, "Stopping live data stream..."]);
      await invoke('close_serial');
      setConsoleArray(prev => [...prev, "Live data stream stopped"]);
      setIsRunning(false);
      return { success: true };
    } catch (error) {
      setConsoleArray(prev => [...prev, `Failed to stop live stream: ${error}`]);
      return { success: false, error };
    }
  };

  const systemCheck = async () => {
    try {
      setConsoleArray(prev => [...prev, "Running system diagnostics..."]);
      // Add any system check logic here
      setConsoleArray(prev => [...prev, "System check completed"]);
      return { success: true };
    } catch (error) {
      setConsoleArray(prev => [...prev, `System check failed: ${error}`]);
      return { success: false, error };
    }
  };

  return { startLiveStream, stopLiveStream, systemCheck };
};

/**
 * This hook remains for listing ports, opening, closing, etc.
 * Notice that we no longer call `start_data_parser` anywhere below,
 * but `rt_parsed_stream` instead if we want to start parsing.
 */
export const useSerialPorts = (setConsoleArray, isRunning) => {
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

  const refreshPorts = useCallback(async () => {
    if (isRunning) {
      setConsoleArray(prev => [...prev, "Cannot refresh ports while system is running"]);
      return { success: false, error: "System is running" };
    }
    
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
  }, [setConsoleArray, selectedPort, isRunning]);

  /**
   * Instead of calling 'open_serial' then 'start_data_parser', 
   * we can just open the port and then call 'rt_parsed_stream'
   * if we want to unify logic. 
   */
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
      // Now kick off the parser thread
      await invoke('rt_parsed_stream');
      return { success: true };
    } catch (error) {
      setConsoleArray(prev => [...prev, `Failed to open port: ${error}`]);
      return { success: false, error };
    }
  };

  /**
   * Once this is called, the parser thread should stop
   * (because the loop in rt_parsed_stream will break when the port is closed).
   */
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

  return { 
    ports,
    selectedPort,
    setSelectedPort,
    refreshPorts,  // Now this needs to be called manually once
    openPort,
    closePort,
    parsedData
  };
};

