import { invoke } from "@tauri-apps/api/core";

export const useMockDataFlow = (updateTelemetryData, setIsRunning) => {

    const initializeLaunchSequence = async () => {
        try {
            setIsRunning(true);
            const mockData = await invoke('mockdata', { count: 125 });
            updateTelemetryData(mockData);
            return mockData;
        } catch (error) {
            console.error('Error initializing launch sequence:', error);
            setIsRunning(false);
            return [];
        }
    };

    const systemCheck = async () => {
        // Add system check logic here
        return true;
    };

    return {
        initializeLaunchSequence,
        systemCheck
    };
};
