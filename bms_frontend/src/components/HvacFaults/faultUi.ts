import type { HvacFaultProtocol, HvacFaultSeverity } from "@/api/hvacFaults";

export function humanize(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}

export function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export function cleanOptional(value?: string | null) {
  const cleaned = value?.trim();
  return cleaned ? cleaned : undefined;
}

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected HVAC fault request failure.";
}

export function severityClasses(severity: HvacFaultSeverity) {
  if (severity === "CRITICAL") return "border-rose-400/35 bg-rose-500/10 text-rose-100";
  if (severity === "WARNING") return "border-amber-400/35 bg-amber-500/10 text-amber-100";
  return "border-cyan-400/35 bg-cyan-500/10 text-cyan-100";
}

export const PROTOCOL_HELP: Record<HvacFaultProtocol, { example: string; help: string }> = {
  SIMULATOR: { example: "fanFault", help: "Supported demo references include fanFault, filterAlarm, compressorFault, sensorFault and vfdFault." },
  BACNET: { example: "binaryInput:9", help: "Use objectType:instance, for example binaryValue:12, multiStateInput:3 or analogInput:20." },
  MODBUS: { example: "holdingRegister:40021:uint16:bit=3", help: "Use coil/discreteInput/holdingRegister/inputRegister:address:type with optional :bit=n." },
  MODBUS_RTU: { example: "discreteInput:12:bool", help: "Uses the same reference syntax as Modbus TCP; device connection details remain in the Edge Controller configuration." },
};

export function validateProtocolRef(protocol: HvacFaultProtocol, value: string): string | null {
  const ref = value.trim();
  if (!ref) return "Protocol Ref is required.";
  if (ref.length > 150) return "Protocol Ref must be 150 characters or fewer.";

  if (protocol === "SIMULATOR") {
    return /^[A-Za-z][A-Za-z0-9_-]*$/.test(ref)
      ? null
      : "Simulator references must start with a letter and contain only letters, numbers, underscore or hyphen.";
  }

  if (protocol === "BACNET") {
    return /^(binaryInput|binaryValue|multiStateInput|multiStateValue|analogInput|analogValue):\d+$/i.test(ref)
      ? null
      : "Use BACnet objectType:instance, for example binaryInput:9.";
  }

  return /^(coil|discreteInput|holdingRegister|inputRegister):\d+:(bool|uint16|int16|uint32|int32|float32)(:bit=(?:[0-9]|1[0-5]))?$/i.test(ref)
    ? null
    : "Use registerType:address:dataType with optional :bit=0..15.";
}
