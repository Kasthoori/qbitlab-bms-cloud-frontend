import { useState, type ChangeEvent, type FC, type FormEvent } from "react";
import type { HvacUnitConfig, Protocol } from "../../types/HvacUnitConfig";
import { createHvacConfig } from "../../api/hvacConfigApi";

const numericFieldSet: Set<keyof HvacUnitConfig> = new Set([
    'modbusPort',
    'modbusUnitId',
    'regTemp',
    'regSetpoint',
    'regOnoff',
    'regFanSpeed',
    'regFlowRate',
    'regFault', 
    'bacnetDeviceInstance',
]);

const defaultConfig: HvacUnitConfig = {
    deviceId: '',
    unitName: '',
    building: '',
    floor: '',
    room: '',
    protocol: 'SIMULATOR',
    enabled: true,

    bacnetDeviceInstance: undefined
};

export const HvacConfigForm:FC = () => {

    const [form, setForm] = useState<HvacUnitConfig>(defaultConfig);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);


    const handleChange = (field: keyof HvacUnitConfig) => 
        (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {

           // const value = e.target.value;
            
            if (numericFieldSet.has(field)) {

                const input = e.target as HTMLInputElement;
                const n = input.valueAsNumber

                setForm(prev => ({
                    ...prev,
                    [field]: Number.isFinite(n) ? n : undefined,
                }));

                return;
            } 

            setForm(prev => ({
                ...prev,
                [field]: e.target.value,
            }));
        

    };

    const handleProtocolChange = (e: ChangeEvent<HTMLSelectElement>) => {
        setForm(prev => ({...prev, protocol: e.target.value as Protocol}))
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(null);
        try {
            await createHvacConfig(form);
            setSuccess('HVAC Unit configuration saved successfully.');
            setForm(defaultConfig);
        }catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Unknown error");
        }finally {
            setSaving(false);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="max-w-xl max-auto p-4 bg-slate-900 border border-slate-700 rounded-xl space-y-4"
        >
            <h2 className="text-xl font-semibold text-white">Add HVAC Unit</h2>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm text-slate-200">Device ID</label>
                    <input
                       className="w-full mt-1 rounded bg-slate-800 border border-slate-600 px-2 py-1 text-white"
                       value={form.deviceId}
                       onChange={handleChange('deviceId')}
                       required 
                    />
                </div>
                <div>
                    <label className="block text-sm text-slate-200">Unit Name</label>
                    <input
                       className="w-full mt-1 rounded bg-slate-800 border border-slate-600 px-2 py-1 text-white"
                       value={form.unitName}
                       onChange={handleChange('unitName')}
                       required 
                    />
                </div>

                <div>
                    <label className="block text-sm text-slate-200">Building</label>
                    <input
                       className="w-full mt-1 rounded bg-slate-800 border border-slate-600 px-2 py-1 text-white"
                       value={form.building ?? ''}
                       onChange={handleChange('building')}
                       required 
                    />
                </div>

                <div>
                    <label className="block text-sm text-slate-200">Room</label>
                    <input
                       className="w-full mt-1 rounded bg-slate-800 border border-slate-600 px-2 py-1 text-white"
                       value={form.room ?? ''}
                       onChange={handleChange('room')}
                    />
                </div>

                <div>
                    <label className="block text-sm text-slate-200">Protocol</label>
                    <select
                       className="w-full mt-1 rounded bg-slate-800 border border-slate-600 px-2 py-1 text-white"
                       value={form.protocol}
                       onChange={handleProtocolChange}
                    >
                        <option value="SIMULATOR">Simulator / JSON</option>
                        <option value="BACNET">BACnet</option>
                        <option value="MODBUS">Modbus</option>
                    </select>
                </div>
                </div>
                {/* BACnet fields if BACnet selected */}
                {form.protocol === 'BACNET' && (
                    <div className="border-t border-slate-700 pt-4 space-y-4">
                        <h3 className="text-sm font-semibold text-slate-200">
                            BACnet Configuration
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-slate-200">
                                    Device Instance
                                </label>
                                <input
                                    type="number"
                                    className="w-full mt-1 rounded bg-slate-800 border border-slate-600 px-2 py-1 text-white"
                                    value={form.bacnetDeviceInstance ?? ''}
                                    onChange={handleChange('bacnetDeviceInstance')}
                                />
                            </div>
                        </div>
                        
                    </div>
                )}

                {/* Modbus fields (optional now, required later for real HVAC units) */}
                {form.protocol === 'MODBUS' && (
                    <div className="border-t border-slate-700 pt-4 space-y-3">
                        <h3 className="text-sm font-semibold text-slate-200">
                            Modbus Configuration
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-slate-200">Host</label>
                                <input
                                    className="w-full mt-1 rounded bg-slate-800 border border-slate-600 px-2 py-1 text-white"
                                    value={form.modbusHost ?? ''}
                                    onChange={handleChange('modbusHost')}
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-slate-200">Port</label>
                                <input
                                    className="w-full mt-1 rounded bg-slate-800 border border-slate-600 px-2 py-1 text-white"
                                    value={form.modbusPort ?? ''}
                                    onChange={handleChange('modbusPort')}
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm text-slate-200">Unit ID</label>
                                <input
                                    className="w-full mt-1 rounded bg-slate-800 border border-slate-600 px-2 py-1 text-white"
                                    value={form.modbusUnitId ?? ''}
                                    onChange={handleChange('modbusUnitId')}
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-slate-200">Temp Reg</label>
                                <input
                                    className="w-full mt-1 rounded bg-slate-800 border border-slate-600 px-2 py-1 text-white"
                                    value={form.regTemp ?? ''}
                                    onChange={handleChange('regTemp')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-200">
                                    Setpoint Reg
                                </label>
                                <input
                                   type="number"
                                   min={0}
                                   step={1}
                                   className="w-full mt-1 rounded bg-slate-800 border border-slate-600 px-2 py-1 text-white"
                                   value={form.regSetpoint ?? ''}
                                   onChange={handleChange('regSetpoint')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-200">
                                    On/Off Reg
                                </label>
                                <input
                                   type="number"
                                   min={0}
                                   step={1}
                                   className="w-full mt-1 rounded bg-slate-800 border border-slate-600 px-2 py-1 text-white"
                                   value={form.regOnoff ?? ''}
                                   onChange={handleChange('regOnoff')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-200">
                                    Fan Speed Reg
                                </label>
                                <input
                                   type="number"
                                   min={0}
                                   step={1}
                                   className="w-full mt-1 rounded bg-slate-800 border border-slate-600 px-2 py-1 text-white"
                                   value={form.regFanSpeed ?? ''}
                                   onChange={handleChange('regFanSpeed')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-200">
                                    Flow Rate Reg
                                </label>
                                <input
                                   type="number"
                                   min={0}
                                   step={1}
                                   className="w-full mt-1 rounded bg-slate-800 border border-slate-600 px-2 py-1 text-white"
                                   value={form.regFlowRate ?? ''}
                                   onChange={handleChange('regFlowRate')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-200">
                                    Fault Reg
                                </label>
                                <input
                                   type="number"
                                   min={0}
                                   step={1}
                                   className="w-full mt-1 rounded bg-slate-800 border border-slate-600 px-2 py-1 text-white"
                                   value={form.regFault ?? ''}
                                   onChange={handleChange('regFault')}
                                />
                            </div>
                            
                            {/* Same pattern for regSetpoint, regOnoff, regFanSpeed, regFlowRate, regFault  */}
                        </div>
                     </div>
                    )}

                            {error && <p className="text-sm text-red-400">{error}</p>}
                            {success && <p className="text-sm text-emerald-400">{success}</p>}

                            <button
                                type="submit"
                                disabled={saving}
                                className="px-4 py-2 rounded bg-emerald-600 text-white text-sm disabled:opacity-50"
                            >
                                {saving ? 'Saving...' : 'Add HVAC'}
                        </button>
            
        </form>
    );
    
}