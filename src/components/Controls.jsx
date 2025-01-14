// src/components/Controls.jsx

import { invoke } from "@tauri-apps/api/core";
import { listen } from '@tauri-apps/api/event';
import { useState, useEffect, useCallback } from 'react';

/**
 * Example new hook name: useRtParsedStream
 */
export const useRtParsedStream = (setConsoleArray) => {
  const startRtParsedStream = async () => {
    try {
      setConsoleArray(prev => [...prev, "Starting RT Parsed Stream..."]);
      await invoke('rt_parsed_stream');
      setConsoleArray(prev => [...prev, "Data parser (rt_parsed_stream) started successfully"]);
      return { success: true };
    } catch (error) {
      setConsoleArray(prev => [...prev, `Failed to start RT parsed stream: ${error}`]);
      return { success: false, error };
    }
  };

  return { startRtParsedStream };
};

/**
 * This hook remains for listing ports, opening, closing, etc.
 * Notice that we no longer call `start_data_parser` anywhere below,
 * but `rt_parsed_stream` instead if we want to start parsing.
 */
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

  useEffect(() => {
    refreshPorts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

