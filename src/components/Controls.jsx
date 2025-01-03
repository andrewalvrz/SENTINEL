import { invoke } from "@tauri-apps/api/core";

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
        return true;
    };

    return {
        initializeLaunchSequence,
        systemCheck
    };
};
