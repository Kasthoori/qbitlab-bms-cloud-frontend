export interface HvacCurrentState {
    id: number;
    deviceId: number;
    unitName: string;
    temperature: number;
    setpoint: number;
    onState: boolean;
    fanSpeed: number;
    flowRate: number;
    fault: boolean;
    telemetryTime: string;
}