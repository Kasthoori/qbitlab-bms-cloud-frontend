export type Protocol = 'SIMULATOR' | 'BACNET' | 'MODBUS';

export interface HvacUnitConfig {
    id?: number;
    deviceId: string;
    unitName: string;
    building?: string;
    floor?: String;
    room?: string;
    protocol: Protocol;
    minTemp?: number;
    maxTemp?: number;
    defaultSetpoint?: number;
    modbusHost?: string;
    modbusPort?: number;
    modbusUnitId?: number;
    regTemp?: number;
    regSetpoint?: number;
    regOnoff?: number;
    regFanSpeed?: number;
    regFlowRate?: number;
    regFault?: number;
    enabled: boolean;
}