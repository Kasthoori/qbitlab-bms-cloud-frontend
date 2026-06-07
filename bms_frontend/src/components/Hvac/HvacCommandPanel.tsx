/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BmsApi,
  type CurrentUserDto,
  type EdgeCommandResponse,
  type HvacCommandType,
  type HvacProtocol,
} from "@/api/bms";

import BmsDatePicker from "@/components/common/BmsDatePicker";
import BmsTimePicker from "@/components/common/BmsTimePicker";

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
  edgeControllerId: string;
  selectedHvac: SelectedHvac | null;
};

type CommandFilter = "ALL" | "ACTIVE" | "COMPLETED" | "REJECTED" | "EXPIRED";

type TimeFilter =
  | "ALL_TIME"
  | "LAST_1_HOUR"
  | "TODAY"
  | "LAST_24_HOURS"
  | "CUSTOM";

const MIN_SETPOINT = 16;
const MAX_SETPOINT = 30;

function normalizeRole(role: string): string {
  return role.startsWith("ROLE_") ? role.replace("ROLE_", "") : role;
}

function activeStatus(status?: string | null) {
  return status === "PENDING" || status === "PICKED_UP";
}

/**
 * Keeps the command panel inside the available page width.
 *
 * Left sidebar target width is 204px, matching the other stable pages.
 * This prevents the command console from widening the route and visually
 * shrinking the left navigation after an HVAC row is selected.
 */
const PANEL_SAFE_WIDTH =
  "w-full min-w-0 max-w-[calc(100vw-204px)] overflow-x-hidden";

export default function HvacCommandPanel({
  tenantId,
  siteId,
  edgeControllerId,
  selectedHvac,
}: Props) {
  const [onState, setOnState] = useState(true);
  const [setpoint, setSetpoint] = useState(22);

  const [recentCommands, setRecentCommands] = useState<EdgeCommandResponse[]>(
    []
  );

  const [commandFilter, setCommandFilter] = useState<CommandFilter>("ALL");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("ALL_TIME");

  const [customFromDate, setCustomFromDate] = useState("");
  const [customFromTime, setCustomFromTime] = useState("");
  const [customToDate, setCustomToDate] = useState("");
  const [customToTime, setCustomToTime] = useState("");

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [lastCommand, setLastCommand] = useState<EdgeCommandResponse | null>(
    null
  );
  const [currentUser, setCurrentUser] = useState<CurrentUserDto | null>(null);

  /**
   * Load current user once.
   * Used for role-based command visibility and audit visibility.
   */
  useEffect(() => {
    BmsApi.getCurrentUser()
      .then(setCurrentUser)
      .catch(() => setCurrentUser(null));
  }, []);

  const roles = useMemo(() => {
    return (currentUser?.roles ?? []).map(normalizeRole);
  }, [currentUser?.roles]);

  const isAdmin = useMemo(() => {
    return roles.includes("ADMIN") || roles.includes("BMS_ADMIN");
  }, [roles]);

  const isSiteManager = useMemo(() => {
    return roles.includes("SITE_MANAGER");
  }, [roles]);

  const isTechnician = useMemo(() => {
    return roles.includes("TECHNICIAN");
  }, [roles]);

  const canAuditCommands = useMemo(() => {
    return isAdmin || isSiteManager;
  }, [isAdmin, isSiteManager]);

  const isTechnicianOnly = useMemo(() => {
    return isTechnician && !canAuditCommands;
  }, [isTechnician, canAuditCommands]);

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

  const protocol = useMemo<HvacProtocol>(() => {
    return ((selectedHvac?.protocol ?? "SIMULATOR").toUpperCase() ||
      "SIMULATOR") as HvacProtocol;
  }, [selectedHvac?.protocol]);

  const isSimulator = protocol === "SIMULATOR";
  const isProduction = import.meta.env.PROD;

  const canSetSetpoint = isAdmin || isSiteManager || isTechnician;
  const canSetOnOff = isAdmin || isSiteManager || isTechnician;
  const canRestart = isAdmin || isSiteManager || isTechnician;

  const canSimulateFault = isAdmin && isSimulator && !isProduction;
  const canClearFault = (isAdmin || isSiteManager) && !isProduction;

  function buildCustomDateTime(
    date: string,
    time: string,
    isEndOfDay = false
  ) {
    if (!date) return null;

    const safeTime = time || (isEndOfDay ? "23:59" : "00:00");
    const value = new Date(`${date}T${safeTime}`);

    if (Number.isNaN(value.getTime())) {
      return null;
    }

    return value;
  }

  function isCommandInsideTimeFilter(
    command: EdgeCommandResponse,
    filter: TimeFilter
  ) {
    if (filter === "ALL_TIME") return true;
    if (!command.requestedAt) return false;

    const requestedAt = new Date(command.requestedAt);
    const now = new Date();

    if (Number.isNaN(requestedAt.getTime())) return false;

    if (filter === "LAST_1_HOUR") {
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      return requestedAt >= oneHourAgo;
    }

    if (filter === "LAST_24_HOURS") {
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      return requestedAt >= twentyFourHoursAgo;
    }

    if (filter === "TODAY") {
      return (
        requestedAt.getFullYear() === now.getFullYear() &&
        requestedAt.getMonth() === now.getMonth() &&
        requestedAt.getDate() === now.getDate()
      );
    }

    if (filter === "CUSTOM") {
      const fromDate = buildCustomDateTime(
        customFromDate,
        customFromTime,
        false
      );
      const toDate = buildCustomDateTime(customToDate, customToTime, true);

      if (fromDate && requestedAt < fromDate) return false;
      if (toDate && requestedAt > toDate) return false;

      return true;
    }

    return true;
  }

  const filteredCommands = useMemo(() => {
    const statusFiltered =
      commandFilter === "ALL"
        ? recentCommands
        : commandFilter === "ACTIVE"
          ? recentCommands.filter((command) => activeStatus(command.status))
          : recentCommands.filter((command) => command.status === commandFilter);

    return statusFiltered.filter((command) =>
      isCommandInsideTimeFilter(command, timeFilter)
    );
  }, [
    recentCommands,
    commandFilter,
    timeFilter,
    customFromDate,
    customFromTime,
    customToDate,
    customToTime,
  ]);

  const hasActiveCommands = useMemo(() => {
    const tableHasActiveCommand = recentCommands.some((command) =>
      activeStatus(command.status)
    );

    const bannerHasActiveCommand = activeStatus(lastCommand?.status);

    return tableHasActiveCommand || bannerHasActiveCommand;
  }, [recentCommands, lastCommand?.status]);

  /**
   * Keep local form controls aligned with selected HVAC live state.
   */
  useEffect(() => {
    if (!selectedHvac) return;

    setOnState(selectedHvac.onState ?? true);
    setSetpoint(Number(selectedHvac.setpoint ?? 22));
  }, [
    selectedHvac?.hvacId,
    selectedHvac?.externalDeviceId,
    selectedHvac?.onState,
    selectedHvac?.setpoint,
  ]);

  /**
   * Clear previous command banner when a different HVAC is selected.
   */
  useEffect(() => {
    setStatusMessage(null);
    setLastCommand(null);
  }, [selectedHvac?.hvacId, selectedHvac?.externalDeviceId]);

  const refreshRecentCommands = useCallback(async () => {
    if (!tenantId || !siteId) return;

    try {
      const data = await BmsApi.listHvacCommands(tenantId, siteId);
      setRecentCommands(data);
    } catch (error) {
      console.error("Failed to load recent HVAC commands", error);
      setRecentCommands([]);
    }
  }, [tenantId, siteId]);

  /**
   * Load recent commands when panel opens.
   */
  useEffect(() => {
    refreshRecentCommands();
  }, [refreshRecentCommands]);

  /**
   * Auto-refresh command lifecycle.
   * Active commands refresh faster because status changes from PENDING -> PICKED_UP -> COMPLETED/FAILED.
   */
  useEffect(() => {
    if (!tenantId || !siteId) return;

    const intervalMs = hasActiveCommands ? 2000 : 10000;

    const intervalId = window.setInterval(() => {
      refreshRecentCommands();
    }, intervalMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [tenantId, siteId, hasActiveCommands, refreshRecentCommands]);

  function getCommandMessage(command: EdgeCommandResponse) {
    if (command.status === "REJECTED") {
      return (
        command.rejectedReason ||
        command.errorMessage ||
        "Command rejected by backend safety layer."
      );
    }

    if (command.status === "FAILED") {
      return command.errorMessage || "Command failed.";
    }

    if (command.status === "EXPIRED") {
      return command.errorMessage || "Command expired before edge picked it up.";
    }

    if (command.status === "COMPLETED") {
      return (
        command.safetyCheckResult ||
        `Command completed successfully: ${command.commandType}`
      );
    }

    if (command.status === "PICKED_UP") {
      return `Command picked up by edge controller: ${command.commandType}`;
    }

    return (
      command.safetyCheckResult ||
      `Command queued successfully: ${command.commandType}`
    );
  }

  /**
   * Update the status banner when the last submitted command changes in the refreshed table.
   */
  useEffect(() => {
    if (!lastCommand?.commandId) return;

    const updatedCommand = recentCommands.find(
      (command) => command.commandId === lastCommand.commandId
    );

    if (!updatedCommand) return;

    if (
      updatedCommand.status !== lastCommand.status ||
      updatedCommand.completedAt !== lastCommand.completedAt ||
      updatedCommand.errorMessage !== lastCommand.errorMessage
    ) {
      setLastCommand(updatedCommand);
      setStatusMessage(getCommandMessage(updatedCommand));
    }
  }, [
    recentCommands,
    lastCommand?.commandId,
    lastCommand?.status,
    lastCommand?.completedAt,
    lastCommand?.errorMessage,
  ]);

  /**
   * Builds backend-compatible and edge-compatible payloads.
   *
   * Production target contract:
   * - SET_ON_OFF      -> { on: true/false }
   * - SET_SETPOINT    -> { setpoint: 22 }
   * - SIMULATE_FAULT  -> { fault: true, reason: "..." }
   * - CLEAR_FAULT     -> { fault: false }
   * - RESTART_HVAC    -> {}
   *
   * Current backend compatibility:
   * - value is also sent because the current backend validator still accepts/expects it.
   * - Once backend validation is permanently updated to semantic fields, remove value.
   */
  function buildCommandPayload(
    commandType: HvacCommandType,
    value?: boolean | number | string | null
  ): Record<string, unknown> {
    switch (commandType) {
      case "SET_ON_OFF": {
        const on = Boolean(value);

        return {
          value: on,
          on,
        };
      }

      case "SET_SETPOINT": {
        const setpointValue = Number(value);

        return {
          value: setpointValue,
          setpoint: setpointValue,
        };
      }

      case "SIMULATE_FAULT": {
        const reason = String(value ?? "Manual simulated fault");

        return {
          value: reason,
          fault: true,
          reason,
        };
      }

      case "CLEAR_FAULT":
        return {
          value: false,
          fault: false,
        };

      case "RESTART_HVAC":
        return {};

      default:
        return {};
    }
  }

  async function sendCommand(
    commandType: HvacCommandType,
    value?: boolean | number | string | null
  ) {
    if (!canSendCommand || !selectedHvac) {
      setStatusMessage(
        "Please select a mapped HVAC with hvacId, externalDeviceId, protocol, and edgeControllerId."
      );
      return;
    }

    if (commandType === "SIMULATE_FAULT" && !canSimulateFault) {
      setStatusMessage("You are not allowed to simulate faults.");
      return;
    }

    if (commandType === "CLEAR_FAULT" && !canClearFault) {
      setStatusMessage("You are not allowed to clear faults from this screen.");
      return;
    }

    if (commandType === "SET_SETPOINT" && !canSetSetpoint) {
      setStatusMessage("You are not allowed to change setpoint.");
      return;
    }

    if (commandType === "SET_ON_OFF" && !canSetOnOff) {
      setStatusMessage("You are not allowed to change on/off state.");
      return;
    }

    if (commandType === "RESTART_HVAC" && !canRestart) {
      setStatusMessage("You are not allowed to restart this HVAC.");
      return;
    }

    if (commandType === "SET_SETPOINT") {
      const setpointValue = Number(value);

      if (
        Number.isNaN(setpointValue) ||
        setpointValue < MIN_SETPOINT ||
        setpointValue > MAX_SETPOINT
      ) {
        setStatusMessage(
          `Setpoint must be between ${MIN_SETPOINT}°C and ${MAX_SETPOINT}°C.`
        );
        return;
      }
    }

    try {
      setLoading(true);
      setStatusMessage(null);
      setLastCommand(null);

      const payload = buildCommandPayload(commandType, value);

      const command = await BmsApi.createHvacCommand(tenantId, siteId, {
        edgeControllerId,
        hvacId: selectedHvac.hvacId!,
        externalDeviceId: selectedHvac.externalDeviceId!,
        protocol,
        commandType,
        payload,
      });

      setLastCommand(command);
      setStatusMessage(getCommandMessage(command));
      setRecentCommands((prev) => [command, ...prev]);

      await refreshRecentCommands();

      window.setTimeout(() => {
        refreshRecentCommands();
      }, 1200);
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

  function statusBadgeClass(status?: string) {
    switch (status) {
      case "COMPLETED":
        return "bg-emerald-500/10 text-emerald-200 border-emerald-400/20";
      case "PENDING":
      case "PICKED_UP":
        return "bg-cyan-500/10 text-cyan-200 border-cyan-400/20";
      case "EXPIRED":
        return "bg-amber-500/10 text-amber-200 border-amber-400/20";
      case "REJECTED":
      case "FAILED":
        return "bg-red-500/10 text-red-200 border-red-400/20";
      default:
        return "bg-slate-500/10 text-slate-300 border-slate-400/20";
    }
  }

  function formatDateTime(value?: string | null) {
    if (!value) return "-";
    return new Date(value).toLocaleString();
  }

  function formatPayload(payload?: Record<string, unknown>) {
    if (!payload || Object.keys(payload).length === 0) return "-";
    return JSON.stringify(payload);
  }

  function timeFilterLabel(filter: TimeFilter) {
    if (filter === "ALL_TIME") return "All Time";
    if (filter === "LAST_1_HOUR") return "1 Hour";
    if (filter === "TODAY") return "Today";
    if (filter === "LAST_24_HOURS") return "24 Hours";
    return "Custom";
  }

  const commandCounts = useMemo(() => {
    return {
      ALL: recentCommands.length,
      ACTIVE: recentCommands.filter((command) => activeStatus(command.status))
        .length,
      COMPLETED: recentCommands.filter(
        (command) => command.status === "COMPLETED"
      ).length,
      REJECTED: recentCommands.filter(
        (command) => command.status === "REJECTED"
      ).length,
      EXPIRED: recentCommands.filter((command) => command.status === "EXPIRED")
        .length,
    };
  }, [recentCommands]);

  if (!selectedHvac) {
    return (
      <div
        className={`${PANEL_SAFE_WIDTH} rounded-3xl border border-white/10 bg-white/5 p-5 text-slate-300 shadow-2xl backdrop-blur-xl`}
      >
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
    <div
      className={`${PANEL_SAFE_WIDTH} rounded-3xl border border-cyan-300/20 bg-slate-950/75 p-4 text-slate-100 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl sm:p-5`}
    >
      <div className="mb-5 min-w-0">
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

          <p className="mt-1 break-all text-xs text-slate-500">
            Protocol: {selectedHvac.protocol ?? "UNKNOWN"} · External ID:{" "}
            {selectedHvac.externalDeviceId ?? "N/A"}
          </p>

          <p className="mt-1 break-all text-xs text-slate-500">
            Edge Controller ID: {edgeControllerId || "Missing"}
          </p>

          {isTechnician && (
            <p className="mt-3 rounded-2xl border border-amber-300/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              Technician access: setpoint, on/off, restart, acknowledge, and
              maintenance workflow commands are allowed. Simulator-only and
              forced telemetry commands are blocked.
            </p>
          )}

          {!isSimulator && (
            <p className="mt-3 rounded-2xl border border-cyan-300/20 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100">
              Real device mode: BACnet/Modbus commands are limited to safe
              writable actions configured by backend safety rules.
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
        <div
          className={`mb-4 rounded-2xl border p-3 text-sm ${
            lastCommand?.status === "REJECTED" ||
            lastCommand?.status === "FAILED" ||
            lastCommand?.status === "EXPIRED"
              ? "border-red-300/20 bg-red-500/10 text-red-100"
              : lastCommand?.status === "COMPLETED"
                ? "border-emerald-300/20 bg-emerald-500/10 text-emerald-100"
                : "border-cyan-300/20 bg-cyan-500/10 text-cyan-100"
          }`}
        >
          <p>{statusMessage}</p>

          {lastCommand?.status && (
            <p className="mt-1 text-xs opacity-80">
              Status: {lastCommand.status}
            </p>
          )}

          {lastCommand?.expiresAt && (
            <p className="mt-1 text-xs opacity-80">
              Expires: {new Date(lastCommand.expiresAt).toLocaleString()}
            </p>
          )}

          {lastCommand?.completedAt && (
            <p className="mt-1 text-xs opacity-80">
              Completed: {new Date(lastCommand.completedAt).toLocaleString()}
            </p>
          )}
        </div>
      )}

      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <div className="min-w-0 rounded-2xl border border-white/10 bg-white/5 p-4">
          <h3 className="text-sm font-semibold text-white">Power Control</h3>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={loading || !canSendCommand || !canSetOnOff}
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
              disabled={loading || !canSendCommand || !canSetOnOff}
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

        <div className="min-w-0 rounded-2xl border border-white/10 bg-white/5 p-4">
          <h3 className="text-sm font-semibold text-white">Setpoint</h3>

          <div className="mt-4 flex min-w-0 gap-2">
            <input
              type="number"
              value={setpoint}
              min={MIN_SETPOINT}
              max={MAX_SETPOINT}
              step={0.5}
              onChange={(event) => setSetpoint(Number(event.target.value))}
              className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-300/50"
            />

            <button
              type="button"
              disabled={loading || !canSendCommand || !canSetSetpoint}
              onClick={() => sendCommand("SET_SETPOINT", Number(setpoint))}
              className="shrink-0 rounded-2xl border border-cyan-300/20 bg-cyan-400/15 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send
            </button>
          </div>

          <p className="mt-2 text-xs text-slate-500">
            Backend safety allows setpoint range {MIN_SETPOINT}°C to{" "}
            {MAX_SETPOINT}°C.
          </p>
        </div>

        <div className="min-w-0 rounded-2xl border border-white/10 bg-white/5 p-4">
          <h3 className="text-sm font-semibold text-white">Restart</h3>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={loading || !canSendCommand || !canRestart}
              onClick={() => sendCommand("RESTART_HVAC", null)}
              className="rounded-2xl border border-violet-300/20 bg-violet-400/15 px-4 py-2 text-sm font-medium text-violet-100 transition hover:bg-violet-400/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Restart HVAC
            </button>
          </div>

          <p className="mt-2 text-xs text-slate-500">
            Restart commands expire quickly if the edge controller is offline.
          </p>
        </div>

        <div className="min-w-0 rounded-2xl border border-white/10 bg-white/5 p-4">
          <h3 className="text-sm font-semibold text-white">Simulator / Dev</h3>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={loading || !canSendCommand || !canSimulateFault}
              onClick={() =>
                sendCommand("SIMULATE_FAULT", "Manual simulated fault")
              }
              className="rounded-2xl border border-red-300/20 bg-red-400/15 px-4 py-2 text-sm font-medium text-red-100 transition hover:bg-red-400/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Simulate Fault
            </button>

            <button
              type="button"
              disabled={loading || !canSendCommand || !canClearFault}
              onClick={() => sendCommand("CLEAR_FAULT", null)}
              className="rounded-2xl border border-emerald-300/20 bg-emerald-400/15 px-4 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-400/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Clear Fault
            </button>
          </div>

          {isProduction && (
            <p className="mt-2 text-xs text-amber-300">
              Simulator/dev commands are disabled in production.
            </p>
          )}

          {!isAdmin && (
            <p className="mt-2 text-xs text-amber-300">
              Simulator fault commands are admin-only.
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-white">
              {isTechnicianOnly ? "My Recent Commands" : "Recent Commands"}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              {isTechnicianOnly
                ? "Only commands created by you are shown. Backend filtering is active."
                : "Showing latest command lifecycle events. Use status and time filters to inspect command history."}
            </p>
          </div>

          <button
            type="button"
            onClick={refreshRecentCommands}
            className="shrink-0 rounded-xl border border-white/10 px-3 py-1 text-xs text-slate-300 transition hover:bg-white/10"
          >
            Refresh
          </button>
        </div>

        <div className="mb-3 flex min-w-0 flex-wrap items-center gap-2">
          {(["ALL", "ACTIVE", "COMPLETED", "REJECTED", "EXPIRED"] as const).map(
            (filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setCommandFilter(filter)}
                className={`rounded-xl border px-3 py-1 text-xs transition ${
                  commandFilter === filter
                    ? "border-cyan-300/40 bg-cyan-400/15 text-cyan-100"
                    : "border-white/10 text-slate-400 hover:bg-white/10"
                }`}
              >
                {filter}
                <span className="ml-1 opacity-70">
                  {commandCounts[filter]}
                </span>
              </button>
            )
          )}

          <div className="mx-1 hidden h-5 w-px bg-white/10 sm:block" />

          {(
            [
              "ALL_TIME",
              "LAST_1_HOUR",
              "TODAY",
              "LAST_24_HOURS",
              "CUSTOM",
            ] as const
          ).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setTimeFilter(filter)}
              className={`rounded-xl border px-3 py-1 text-xs transition ${
                timeFilter === filter
                  ? "border-violet-300/40 bg-violet-400/15 text-violet-100"
                  : "border-white/10 text-slate-400 hover:bg-white/10"
              }`}
            >
              {timeFilterLabel(filter)}
            </button>
          ))}
        </div>

        {timeFilter === "CUSTOM" && (
          <div className="mb-3 rounded-2xl border border-violet-300/10 bg-violet-500/5 p-3">
            <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
              <div className="grid gap-2 sm:grid-cols-2">
                <BmsDatePicker
                  label="From Date"
                  value={customFromDate}
                  onChange={setCustomFromDate}
                  helperText="Start date"
                />

                <BmsTimePicker
                  label="From Time"
                  value={customFromTime}
                  onChange={setCustomFromTime}
                  helperText="Defaults to 00:00"
                />
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <BmsDatePicker
                  label="To Date"
                  value={customToDate}
                  onChange={setCustomToDate}
                  helperText="End date"
                />

                <BmsTimePicker
                  label="To Time"
                  value={customToTime}
                  onChange={setCustomToTime}
                  helperText="Defaults to 23:59"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setCustomFromDate("");
                  setCustomFromTime("");
                  setCustomToDate("");
                  setCustomToTime("");
                }}
                className="self-end rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-300 transition hover:bg-white/10"
              >
                Clear Dates
              </button>
            </div>

            <p className="mt-2 text-xs text-slate-500">
              Date fields open the browser calendar picker. If time is empty,
              From uses 00:00 and To uses 23:59.
            </p>
          </div>
        )}

        <div className="max-h-80 w-full min-w-0 max-w-full overflow-x-auto overflow-y-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[860px] table-auto text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-900 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-3 py-2">Command</th>
                <th className="px-3 py-2">Payload</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Safety / Reason</th>
                <th className="px-3 py-2">Requested</th>
                <th className="px-3 py-2">Expires</th>
                <th className="px-3 py-2">Picked Up</th>
                <th className="px-3 py-2">Completed</th>
                {canAuditCommands && (
                  <th className="whitespace-nowrap px-2 py-2">
                    Requested By
                  </th>
                )}
              </tr>
            </thead>

            <tbody>
              {filteredCommands.length === 0 ? (
                <tr>
                  <td
                    colSpan={canAuditCommands ? 9 : 8}
                    className="px-3 py-4 text-center text-slate-500"
                  >
                    {isTechnicianOnly
                      ? "You have no commands for this filter."
                      : "No commands for this filter."}
                  </td>
                </tr>
              ) : (
                filteredCommands.slice(0, 20).map((command) => (
                  <tr
                    key={command.commandId}
                    className="border-t border-white/10 text-slate-300"
                  >
                    <td className="whitespace-nowrap px-3 py-2">
                      {command.commandType}
                    </td>

                    <td className="max-w-[140px] truncate px-3 py-2 text-xs text-slate-400">
                      {formatPayload(command.payload)}
                    </td>

                    <td className="whitespace-nowrap px-3 py-2">
                      <span
                        className={`rounded-full border px-2 py-1 text-xs ${statusBadgeClass(
                          command.status
                        )}`}
                      >
                        {command.status ?? "-"}
                      </span>
                    </td>

                    <td className="max-w-[250px] truncate px-3 py-2 text-xs text-slate-400">
                      {command.rejectedReason ||
                        command.errorMessage ||
                        command.safetyCheckResult ||
                        "-"}
                    </td>

                    <td className="whitespace-nowrap px-3 py-2 text-xs">
                      {formatDateTime(command.requestedAt)}
                    </td>

                    <td className="whitespace-nowrap px-3 py-2 text-xs">
                      {formatDateTime(command.expiresAt)}
                    </td>

                    <td className="whitespace-nowrap px-3 py-2 text-xs">
                      {formatDateTime(command.pickedUpAt)}
                    </td>

                    <td className="whitespace-nowrap px-3 py-2 text-xs">
                      {formatDateTime(command.completedAt)}
                    </td>

                    {canAuditCommands && (
                      <td className="max-w-[180px] truncate whitespace-nowrap px-2 py-2 text-xs text-slate-400">
                        {command.requestedByEmail ||
                          command.requestedByRole ||
                          "-"}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          {isTechnicianOnly
            ? "Commands are validated by backend safety rules. This view only shows your own command activity."
            : "Commands are validated by backend safety rules, queued, picked up by the Python edge controller, then completed or failed. Active commands auto-refresh faster."}
        </p>
      </div>
    </div>
  );
}