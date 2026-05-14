/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BmsApi,
  type CurrentUserDto,
  type EdgeCommandResponse,
  type HvacCommandType,
} from "@/api/bms";

type SelectedHvac = {
  hvacId?: string | null;
  externalDeviceId?: string | null;
  hvacName?: string | null;
  unitName?: string | null;
  protocol?: string | null;

  temperature?: number | null;
  setpoint?: number | null;
  onState?: boolean | null;
  fanSpeed?: number | null;
  flowRate?: number | null;
  fault?: boolean | null;
};

type Props = {
  tenantId: string;
  siteId: string;

  /**
   * Kept here because your page already passes this value.
   * The current backend command endpoint only needs:
   * - tenantId
   * - siteId
   * - hvacId
   * - commandType
   * - value
   *
   * Edge assignment is handled by backend / edge command polling flow.
   */
  edgeControllerId: string;

  selectedHvac: SelectedHvac | null;
};

export default function HvacCommandPanel({
  tenantId,
  siteId,
  edgeControllerId,
  selectedHvac,
}: Props) {
  const [onState, setOnState] = useState(true);
  const [setpoint, setSetpoint] = useState(22);
  const [fanSpeed, setFanSpeed] = useState(30);
  const [flowRate, setFlowRate] = useState(100);
  const [ambientTemp, setAmbientTemp] = useState(21);

  const [recentCommands, setRecentCommands] = useState<EdgeCommandResponse[]>(
    []
  );

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUserDto | null>(null);

  useEffect(() => {
    BmsApi.getCurrentUser()
      .then(setCurrentUser)
      .catch(() => setCurrentUser(null));
  }, []);

  const isTechnician = useMemo(() => {
    return currentUser?.roles?.includes("ROLE_TECHNICIAN") ?? false;
  }, [currentUser?.roles]);

  const disableAdvancedTechnicianCommands = isTechnician;

  const canSendCommand = useMemo(() => {
    return Boolean(
      tenantId &&
        siteId &&
        edgeControllerId &&
        selectedHvac?.hvacId &&
        selectedHvac?.externalDeviceId &&
        selectedHvac?.protocol
    );
  }, [
    tenantId,
    siteId,
    edgeControllerId,
    selectedHvac?.hvacId,
    selectedHvac?.externalDeviceId,
    selectedHvac?.protocol,
  ]);

  useEffect(() => {
    if (!selectedHvac) return;

    setOnState(selectedHvac.onState ?? true);
    setSetpoint(Number(selectedHvac.setpoint ?? 22));
    setFanSpeed(Number(selectedHvac.fanSpeed ?? 30));
    setFlowRate(Number(selectedHvac.flowRate ?? 100));
  }, [
    selectedHvac?.hvacId,
    selectedHvac?.externalDeviceId,
    selectedHvac?.onState,
    selectedHvac?.setpoint,
    selectedHvac?.fanSpeed,
    selectedHvac?.flowRate,
  ]);

  useEffect(() => {
    setStatusMessage(null);
  }, [selectedHvac?.hvacId, selectedHvac?.externalDeviceId]);

  const refreshRecentCommands = useCallback(async () => {
    if (!tenantId || !siteId) return;

    try {
      const data = await BmsApi.listReadableHvacCommands(tenantId, siteId);
      setRecentCommands(data);
    } catch (error) {
      console.error("Failed to load recent HVAC commands", error);
      setRecentCommands([]);
    }
  }, [tenantId, siteId]);

  useEffect(() => {
    refreshRecentCommands();
  }, [refreshRecentCommands]);

  async function sendCommand(
    commandType: HvacCommandType,
    value?: boolean | number | null
  ) {
    if (!canSendCommand || !selectedHvac) {
      setStatusMessage(
        "Please select a mapped HVAC with hvacId, externalDeviceId, protocol, and edgeControllerId."
      );
      return;
    }

    /**
     * UI-level protection.
     * Backend should also enforce this rule for production security.
     */
    const technicianBlockedCommands: HvacCommandType[] = [
      "SET_FAN_SPEED",
      "SET_FLOW_RATE",
      "SET_AMBIENT_TEMP",
    ];

    if (isTechnician && technicianBlockedCommands.includes(commandType)) {
      setStatusMessage(`Technician users cannot send ${commandType} commands.`);
      return;
    }

    try {
      setLoading(true);
      setStatusMessage(null);

      /**
       * IMPORTANT:
       * Backend HvacCommandRequest expects:
       *
       * {
       *   "commandType": "SET_ON_OFF",
       *   "value": false
       * }
       *
       * Do not send:
       * {
       *   "payload": { "on": false }
       * }
       */
      await BmsApi.createReadableHvacCommand(
        tenantId,
        siteId,
        selectedHvac.hvacId!,
        {
          commandType,
          value,
        }
      );

      setStatusMessage(`Command queued successfully: ${commandType}`);

      await refreshRecentCommands();
    } catch (error: any) {
      console.error(error);

      setStatusMessage(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Failed to queue command"
      );
    } finally {
      setLoading(false);
    }
  }

  if (!selectedHvac) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-slate-300 shadow-2xl backdrop-blur-xl">
        <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">
          BMS Control
        </p>

        <h2 className="mt-2 text-xl font-semibold text-white">
          HVAC Commands
        </h2>

        <p className="mt-2 text-sm text-slate-400">
          Select a HVAC row to send available commands.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-cyan-300/20 bg-slate-950/75 p-5 text-slate-100 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl">
      <div className="mb-5">
        <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">
          BMS Control
        </p>

        <h2 className="mt-2 text-xl font-semibold text-white">
          HVAC Command Console
        </h2>

        <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-slate-300">
            Selected HVAC:{" "}
            <span className="font-semibold text-cyan-200">
              {selectedHvac.unitName ||
                selectedHvac.hvacName ||
                selectedHvac.externalDeviceId}
            </span>
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Protocol: {selectedHvac.protocol ?? "UNKNOWN"} · External ID:{" "}
            {selectedHvac.externalDeviceId ?? "N/A"}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Edge Controller ID: {edgeControllerId || "Missing"}
          </p>

          {isTechnician && (
            <p className="mt-3 rounded-2xl border border-amber-300/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              Technician access: Fan speed, flow rate, and ambient temperature
              simulation commands are disabled.
            </p>
          )}
        </div>
      </div>

      {!canSendCommand && (
        <div className="mb-4 rounded-2xl border border-amber-300/20 bg-amber-500/10 p-3 text-sm text-amber-100">
          Missing required data. Check selected HVAC has hvacId,
          externalDeviceId, protocol, and edgeControllerId.
        </div>
      )}

      {statusMessage && (
        <div className="mb-4 rounded-2xl border border-cyan-300/20 bg-cyan-500/10 p-3 text-sm text-cyan-100">
          {statusMessage}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <h3 className="text-sm font-semibold text-white">Power Control</h3>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={loading || !canSendCommand}
              onClick={() => {
                setOnState(true);
                sendCommand("SET_ON_OFF", true);
              }}
              className="rounded-2xl border border-emerald-300/20 bg-emerald-400/15 px-4 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-400/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Turn On
            </button>

            <button
              type="button"
              disabled={loading || !canSendCommand}
              onClick={() => {
                setOnState(false);
                sendCommand("SET_ON_OFF", false);
              }}
              className="rounded-2xl border border-red-300/20 bg-red-400/15 px-4 py-2 text-sm font-medium text-red-100 transition hover:bg-red-400/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Turn Off
            </button>
          </div>

          <p className="mt-3 text-xs text-slate-500">
            Selected value: {String(onState)}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <h3 className="text-sm font-semibold text-white">Setpoint</h3>

          <div className="mt-4 flex gap-2">
            <input
              type="number"
              value={setpoint}
              onChange={(event) => setSetpoint(Number(event.target.value))}
              className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-300/50"
            />

            <button
              type="button"
              disabled={loading || !canSendCommand}
              onClick={() => sendCommand("SET_SETPOINT", Number(setpoint))}
              className="rounded-2xl border border-cyan-300/20 bg-cyan-400/15 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <h3 className="text-sm font-semibold text-white">Fan Speed</h3>

          <div className="mt-4 flex gap-2">
            <input
              type="number"
              value={fanSpeed}
              onChange={(event) => setFanSpeed(Number(event.target.value))}
              disabled={disableAdvancedTechnicianCommands}
              className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-300/50 disabled:cursor-not-allowed disabled:opacity-50"
            />

            <button
              type="button"
              disabled={
                loading || !canSendCommand || disableAdvancedTechnicianCommands
              }
              onClick={() => sendCommand("SET_FAN_SPEED", Number(fanSpeed))}
              className="rounded-2xl border border-cyan-300/20 bg-cyan-400/15 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send
            </button>
          </div>

          {isTechnician && (
            <p className="mt-2 text-xs text-amber-300">
              Fan speed control is disabled for technician users.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <h3 className="text-sm font-semibold text-white">Flow Rate</h3>

          <div className="mt-4 flex gap-2">
            <input
              type="number"
              value={flowRate}
              onChange={(event) => setFlowRate(Number(event.target.value))}
              disabled={disableAdvancedTechnicianCommands}
              className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-300/50 disabled:cursor-not-allowed disabled:opacity-50"
            />

            <button
              type="button"
              disabled={
                loading || !canSendCommand || disableAdvancedTechnicianCommands
              }
              onClick={() => sendCommand("SET_FLOW_RATE", Number(flowRate))}
              className="rounded-2xl border border-cyan-300/20 bg-cyan-400/15 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send
            </button>
          </div>

          {isTechnician && (
            <p className="mt-2 text-xs text-amber-300">
              Flow rate control is disabled for technician users.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <h3 className="text-sm font-semibold text-white">
            Ambient Temperature
          </h3>

          <div className="mt-4 flex gap-2">
            <input
              type="number"
              value={ambientTemp}
              onChange={(event) => setAmbientTemp(Number(event.target.value))}
              disabled={disableAdvancedTechnicianCommands}
              className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-300/50 disabled:cursor-not-allowed disabled:opacity-50"
            />

            <button
              type="button"
              disabled={
                loading || !canSendCommand || disableAdvancedTechnicianCommands
              }
              onClick={() =>
                sendCommand("SET_AMBIENT_TEMP", Number(ambientTemp))
              }
              className="rounded-2xl border border-cyan-300/20 bg-cyan-400/15 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send
            </button>
          </div>

          {isTechnician && (
            <p className="mt-2 text-xs text-amber-300">
              Ambient temperature simulation is disabled for technician users.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <h3 className="text-sm font-semibold text-white">Fault / Reset</h3>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={loading || !canSendCommand}
              onClick={() => sendCommand("SIMULATE_FAULT", null)}
              className="rounded-2xl border border-red-300/20 bg-red-400/15 px-4 py-2 text-sm font-medium text-red-100 transition hover:bg-red-400/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Simulate Fault
            </button>

            <button
              type="button"
              disabled={loading || !canSendCommand}
              onClick={() => sendCommand("CLEAR_FAULT", null)}
              className="rounded-2xl border border-emerald-300/20 bg-emerald-400/15 px-4 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-400/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Clear Fault
            </button>

            <button
              type="button"
              disabled={loading || !canSendCommand}
              onClick={() => sendCommand("RESTART_HVAC", null)}
              className="rounded-2xl border border-violet-300/20 bg-violet-400/15 px-4 py-2 text-sm font-medium text-violet-100 transition hover:bg-violet-400/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Restart HVAC
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Recent Commands</h3>

          <button
            type="button"
            onClick={refreshRecentCommands}
            className="rounded-xl border border-white/10 px-3 py-1 text-xs text-slate-300 transition hover:bg-white/10"
          >
            Refresh
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-3 py-2">Command</th>
                <th className="px-3 py-2">Device</th>
                <th className="px-3 py-2">Protocol</th>
              </tr>
            </thead>

            <tbody>
              {recentCommands.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-3 py-4 text-center text-slate-500"
                  >
                    No recent commands.
                  </td>
                </tr>
              ) : (
                recentCommands.slice(0, 10).map((command) => (
                  <tr
                    key={command.commandId}
                    className="border-t border-white/10 text-slate-300"
                  >
                    <td className="px-3 py-2">{command.commandType}</td>
                    <td className="px-3 py-2">
                      {command.externalDeviceId ?? "-"}
                    </td>
                    <td className="px-3 py-2">{command.protocol ?? "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          Commands are queued first. The Python edge controller must be running
          to pick them up and execute them.
        </p>
      </div>
    </div>
  );
}