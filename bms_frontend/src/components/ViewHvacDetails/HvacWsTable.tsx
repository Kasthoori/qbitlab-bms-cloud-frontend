/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FC,
} from "react";
import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import {
  Activity,
  AlertCircle,
  Fan,
  Gauge,
  Thermometer,
  //Wifi,
  //WifiOff,
  Wind,
  TriangleAlert,
  Boxes,
} from "lucide-react";

import type { HvacCurrentState, HvacSiteDetailsDto } from "../../types/hvac";
import { api } from "@/api/http";

import type { HvacDto } from "@/api/bms";
import HvacCommandPanel from "@/components/Hvac/HvacCommandPanel";

function resolveExternalDeviceId(row: any): string | undefined {
  if (row.externalDeviceId) return row.externalDeviceId;
  if (row.deviceId) return row.deviceId;
  if (row.device_id) return row.device_id;

  const match = row.unitName?.match(/HVAC-(\d+)/i);
  if (match?.[1]) return `hvac-${match[1]}`;

  return undefined;
}

/**
 * SockJS expects an HTTP/HTTPS endpoint, not ws:// or wss://.
 *
 * For your current setup:
 *   frontend: https://localhost:5173
 *   backend:  http://192.168.68.64:8084
 *
 * Use:
 *   VITE_WS_BASE_URL=http://192.168.68.64:8084/ws
 */
function resolveSockJsEndpoint(): string {
  const envUrl = import.meta.env.VITE_WS_BASE_URL?.trim();

  if (envUrl) {
    return envUrl;
  }

  return "http://192.168.68.64:8084/ws";
}

type HvacWsTableProps = {
  tenantId: string;
  siteId: string;

  /**
   * Required because backend hvac_commands table stores edge_controller_id.
   * Temporary testing: you can pass this as hardcoded value from parent page.
   * Production: fetch from edge_site_assignments for this tenant/site.
   */
  edgeControllerId: string;

  onSelectHvac?: (hvac: HvacDto) => void;
  selectedHvacId?: string;
};

const glassCard =
  "rounded-3xl border border-white/10 bg-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl";

const HvacWsTable: FC<HvacWsTableProps> = ({
  tenantId,
  siteId,
  edgeControllerId,
  onSelectHvac,
  selectedHvacId,
}) => {
  const [rows, setRows] = useState<HvacSiteDetailsDto[]>([]);
  const [selectedHvac, setSelectedHvac] = useState<any | null>(null);

  //const [connected, setConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const clientRef = useRef<Client | null>(null);
  const subscriptionRef = useRef<StompSubscription | null>(null);

  const rowsRef = useRef<HvacSiteDetailsDto[]>([]);
  const liveByDeviceIdRef = useRef<Map<string, HvacCurrentState>>(new Map());
  const hasLoadedOnceRef = useRef<boolean>(false);

  /**
   * Used to avoid showing "closed" as an error when React unmounts/remounts
   * the component during normal lifecycle or Vite dev refresh.
   */
  const manuallyClosingRef = useRef<boolean>(false);

  const mergeMappedRowsWithLiveData = useCallback(
    (mappedRows: HvacSiteDetailsDto[]): HvacSiteDetailsDto[] => {
      const liveByDeviceId = liveByDeviceIdRef.current;

      return mappedRows.map((mappedRow) => {
        const externalKey = (mappedRow.externalDeviceId || "")
          .trim()
          .toLowerCase();

        if (!externalKey) {
          return mappedRow;
        }

        const live = liveByDeviceId.get(externalKey);

        if (!live) {
          return mappedRow;
        }

        return {
          ...mappedRow,
          unitName: mappedRow.unitName || live.unitName || mappedRow.hvacName,
          temperature: live.temperature,
          setpoint: live.setpoint,
          onState: live.onState,
          fanSpeed: live.fanSpeed,
          flowRate: live.flowRate,
          fault: live.fault,
          telemetryTime: live.telemetryTime,
        };
      });
    },
    []
  );

  const updateRows = useCallback(
    (updater: (current: HvacSiteDetailsDto[]) => HvacSiteDetailsDto[]) => {
      setRows((current) => {
        const next = updater(current);
        rowsRef.current = next;
        return next;
      });
    },
    []
  );

  const loadMappedRows = useCallback(
    async (showInitialLoader = false) => {
      if (!tenantId || !siteId) return;

      try {
        if (showInitialLoader) {
          setLoading(true);
        }

        setError(null);

        const data = await api<HvacSiteDetailsDto[]>(
          `/api/tenants/${tenantId}/sites/${siteId}/hvacs/details`
        );

        const mappedRows = Array.isArray(data) ? data : [];
        const mergedRows = mergeMappedRowsWithLiveData(mappedRows);

        rowsRef.current = mergedRows;
        setRows(mergedRows);
        hasLoadedOnceRef.current = true;
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load mapped HVAC rows."
        );

        if (!hasLoadedOnceRef.current) {
          rowsRef.current = [];
          setRows([]);
        }
      } finally {
        if (showInitialLoader) {
          setLoading(false);
        }
      }
    },
    [tenantId, siteId, mergeMappedRowsWithLiveData]
  );

  useEffect(() => {
    hasLoadedOnceRef.current = false;
    liveByDeviceIdRef.current = new Map();
    rowsRef.current = [];

    setRows([]);
    setSelectedHvac(null);
    setError(null);
    setLoading(true);
    //setConnected(false);

    loadMappedRows(true);
  }, [tenantId, siteId, loadMappedRows]);

  useEffect(() => {
    if (!tenantId || !siteId) return;

    const interval = window.setInterval(() => {
      loadMappedRows(false);
    }, 15000);

    return () => window.clearInterval(interval);
  }, [tenantId, siteId, loadMappedRows]);

  useEffect(() => {
    if (!tenantId || !siteId) return;

    const wsEndpoint = resolveSockJsEndpoint();
    const topic = `/topic/tenants/${tenantId}/sites/${siteId}/hvac`;

    manuallyClosingRef.current = false;

    /**
     * Clean up any previous client before creating a new one.
     * This prevents duplicate connections when tenant/site changes.
     */
    if (clientRef.current) {
      manuallyClosingRef.current = true;
      subscriptionRef.current?.unsubscribe();
      subscriptionRef.current = null;
      clientRef.current.deactivate();
      clientRef.current = null;
      //setConnected(false);
      manuallyClosingRef.current = false;
    }

    const client = new Client({
      webSocketFactory: () => {
        console.log("[HVAC WS] SockJS endpoint:", wsEndpoint);
        return new SockJS(wsEndpoint) as unknown as WebSocket;
      },

      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,

      debug: (message) => {
        console.log("[HVAC STOMP]", message);
      },

      onConnect: () => {
        console.log("[HVAC WS] Connected");
        console.log("[HVAC WS] Subscribing to:", topic);

        //setConnected(true);

        subscriptionRef.current?.unsubscribe();

        subscriptionRef.current = client.subscribe(topic, (message: IMessage) => {
          try {
            const parsed = JSON.parse(message.body);

            /**
             * Backend may send:
             * 1. an array of HVAC current states
             * 2. a single HVAC current state object
             */
            const liveRows = Array.isArray(parsed)
              ? (parsed as HvacCurrentState[])
              : ([parsed] as HvacCurrentState[]);

            const nextLiveMap = new Map(liveByDeviceIdRef.current);

            for (const row of liveRows) {
              const key = (row.deviceId || "").trim().toLowerCase();

              if (key) {
                nextLiveMap.set(key, row);
              }
            }

            liveByDeviceIdRef.current = nextLiveMap;

            updateRows((currentRows) => {
              if (!currentRows.length) return currentRows;

              return currentRows.map((mappedRow) => {
                const externalKey = (mappedRow.externalDeviceId || "")
                  .trim()
                  .toLowerCase();

                if (!externalKey) {
                  return mappedRow;
                }

                const live = nextLiveMap.get(externalKey);

                if (!live) {
                  return mappedRow;
                }

                return {
                  ...mappedRow,
                  unitName:
                    mappedRow.unitName || live.unitName || mappedRow.hvacName,
                  temperature: live.temperature,
                  setpoint: live.setpoint,
                  onState: live.onState,
                  fanSpeed: live.fanSpeed,
                  flowRate: live.flowRate,
                  fault: live.fault,
                  telemetryTime: live.telemetryTime,
                };
              });
            });

            /**
             * Keep command panel selected HVAC fresh when live telemetry arrives.
             */
            setSelectedHvac((current: any | null) => {
              if (!current) return current;

              const currentKey = (
                current.externalDeviceId ||
                current.deviceId ||
                ""
              )
                .trim()
                .toLowerCase();

              if (!currentKey) return current;

              const live = nextLiveMap.get(currentKey);

              if (!live) return current;

              return {
                ...current,
                unitName: current.unitName || live.unitName || current.hvacName,
                temperature: live.temperature,
                setpoint: live.setpoint,
                onState: live.onState,
                fanSpeed: live.fanSpeed,
                flowRate: live.flowRate,
                fault: live.fault,
                telemetryTime: live.telemetryTime,
              };
            });
          } catch (parseError) {
            console.error("[HVAC WS] Error parsing payload:", parseError);
            console.error("[HVAC WS] Raw message body:", message.body);
          }
        });
      },

      onDisconnect: () => {
        console.log("[HVAC WS] Disconnected");
        //setConnected(false);
      },

      onStompError: (frame) => {
        //setConnected(false);
        console.error("[HVAC WS] STOMP error:", frame.headers["message"]);
        console.error("[HVAC WS] STOMP details:", frame.body);
      },

      onWebSocketError: (event) => {
        //setConnected(false);
        console.error("[HVAC WS] WebSocket error:", event);
      },

      onWebSocketClose: (event) => {
        //setConnected(false);

        if (manuallyClosingRef.current) {
          console.log("[HVAC WS] WebSocket closed during cleanup.");
          return;
        }

        console.warn("[HVAC WS] WebSocket closed:", event);
      },
    });

    clientRef.current = client;
    client.activate();

    return () => {
      manuallyClosingRef.current = true;

      subscriptionRef.current?.unsubscribe();
      subscriptionRef.current = null;

      client.deactivate();
      clientRef.current = null;

      //setConnected(false);
    };
  }, [tenantId, siteId, updateRows]);

  useEffect(() => {
    const handleFocus = () => {
      loadMappedRows(false);
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [loadMappedRows]);

  const activeUnits = useMemo(
    () => rows.filter((row) => row.onState).length,
    [rows]
  );

  const faultCount = useMemo(
    () => rows.filter((row) => row.fault).length,
    [rows]
  );

  const avgTemp = useMemo(() => {
    const values = rows
      .map((row) => row.temperature)
      .filter((v): v is number => v !== null && v !== undefined);

    if (!values.length) return "-";

    return (values.reduce((sum, v) => sum + v, 0) / values.length).toFixed(1);
  }, [rows]);

  const formatNumber = (value?: number | null, digits = 2) => {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return "-";
    }

    return value.toFixed(digits);
  };

  const formatTime = (value?: string | null) => {
    if (!value) return "-";

    try {
      return new Date(value).toLocaleTimeString();
    } catch {
      return value;
    }
  };

  if (loading) {
    return (
      <div className={`${glassCard} p-6`}>
        <p className="text-slate-300">Loading HVAC details...</p>
      </div>
    );
  }

  if (error && rows.length === 0) {
    return (
      <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        <p className="font-medium text-rose-300">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && rows.length > 0 && (
        <div className="flex items-start gap-3 rounded-3xl border border-amber-400/20 bg-amber-500/10 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.20)] backdrop-blur-xl">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
          <p className="text-sm font-medium text-amber-300">
            Background refresh failed. Showing last known data.
          </p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className={`${glassCard} p-5`}>
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-400">
            <Activity className="h-4 w-4 text-emerald-300" />
            Active Units
          </div>
          <div className="text-4xl font-bold text-white">{activeUnits}</div>
        </div>

        <div className={`${glassCard} p-5`}>
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-400">
            <TriangleAlert className="h-4 w-4 text-amber-300" />
            Faults
          </div>
          <div className="text-4xl font-bold text-amber-300">
            {faultCount}
          </div>
        </div>

        <div className={`${glassCard} p-5`}>
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-400">
            <Thermometer className="h-4 w-4 text-cyan-300" />
            Avg Temp
          </div>
          <div className="text-4xl font-bold text-white">
            {avgTemp === "-" ? "-" : `${avgTemp}°C`}
          </div>
        </div>

        <div className={`${glassCard} p-5`}>
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-400">
            <Boxes className="h-4 w-4 text-blue-300" />
            Total Units
          </div>
          <div className="text-4xl font-bold text-white">{rows.length}</div>
        </div>
      </div>

      <div className={`${glassCard} p-6`}>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">
              <SparkLine />
              Live Telemetry
            </div>

            <h2 className="mt-3 text-2xl font-bold text-white">
              HVAC Details
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Live HVAC data for mapped devices only. Click a row to send
              commands.
            </p>
          </div>

          {/* <span
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold ${
              connected
                ? "border border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
                : "border border-rose-400/20 bg-rose-500/10 text-rose-300"
            }`}
          >
            {connected ? (
              <Wifi className="h-3.5 w-3.5" />
            ) : (
              <WifiOff className="h-3.5 w-3.5" />
            )}
            {connected ? "CONNECTED" : "DISCONNECTED"}
          </span> */}
        </div>

        <div className="overflow-x-auto rounded-3xl border border-white/10">
          <table className="min-w-full border-collapse">
            <thead className="bg-white/5">
              <tr className="text-left text-xs uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3">Unit</th>
                <th className="px-4 py-3">Temp</th>
                <th className="px-4 py-3">Setpoint</th>
                <th className="px-4 py-3">On/Off</th>
                <th className="px-4 py-3">Fan</th>
                <th className="px-4 py-3">Flow</th>
                <th className="px-4 py-3">Fault</th>
                <th className="px-4 py-3">Last Update</th>
              </tr>
            </thead>

            <tbody className="bg-slate-950/30">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center">
                    <div className="mx-auto max-w-md rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-slate-400">
                      No mapped HVAC devices found for this site.
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => {
                  const externalDeviceId = resolveExternalDeviceId(row);
                  const isSelected =
                    selectedHvac?.hvacId === row.hvacId ||
                    selectedHvac?.externalDeviceId === externalDeviceId ||
                    selectedHvacId === row.hvacId;

                  return (
                    <tr
                      key={
                        row.hvacId ??
                        row.externalDeviceId ??
                        `${row.hvacName}-${index}`
                      }
                      onClick={() => {
                        const selected = {
                          hvacId: row.hvacId,
                          deviceId: externalDeviceId,
                          externalDeviceId,
                          hvacName: row.hvacName,
                          unitName: row.unitName,
                          protocol: row.protocol ?? "SIMULATOR",
                          temperature: row.temperature,
                          setpoint: row.setpoint,
                          onState: row.onState,
                          fanSpeed: row.fanSpeed,
                          flowRate: row.flowRate,
                          fault: row.fault,
                          telemetryTime: row.telemetryTime ?? undefined,
                        };

                        console.log("[HVAC TABLE] Row clicked:", row);
                        console.log("[HVAC TABLE] Selected command HVAC:", selected);

                        setSelectedHvac(selected);
                        onSelectHvac?.(selected as HvacDto);
                      }}
                      className={`cursor-pointer border-t border-white/10 text-slate-100 transition ${
                        isSelected ? "bg-cyan-500/15" : "hover:bg-white/5"
                      }`}
                    >
                      <td className="whitespace-nowrap px-4 py-4 text-sm font-medium">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 ${
                              row.fault
                                ? "bg-rose-500/10 text-rose-300"
                                : row.onState
                                  ? "bg-cyan-500/10 text-cyan-300"
                                  : "bg-white/5 text-slate-400"
                            }`}
                          >
                            <div
                              className={row.onState ? "animate-spin" : ""}
                              style={
                                row.onState
                                  ? { animationDuration: "1.2s" }
                                  : undefined
                              }
                            >
                              <Fan className="h-5 w-5" />
                            </div>
                          </div>

                          <div>
                            <p className="text-white">
                              {row.unitName || row.hvacName}
                            </p>
                            <p className="text-xs text-slate-500">
                              {row.externalDeviceId || row.hvacId || "No ID"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-sm">
                        <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-300">
                          <Thermometer className="h-3.5 w-3.5" />
                          {formatNumber(row.temperature)}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-sm">
                        <span className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-300">
                          <Gauge className="h-3.5 w-3.5" />
                          {formatNumber(row.setpoint)}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-sm">
                        <span
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                            row.onState
                              ? "border border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
                              : "border border-white/10 bg-white/5 text-slate-300"
                          }`}
                        >
                          {row.onState ? "ON" : "OFF"}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-200">
                        {row.fanSpeed !== null && row.fanSpeed !== undefined
                          ? `${formatNumber(row.fanSpeed, 0)}%`
                          : "-"}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-sm">
                        <span className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-300">
                          <Wind className="h-3.5 w-3.5" />
                          {row.flowRate !== null && row.flowRate !== undefined
                            ? `${formatNumber(row.flowRate)} m³/h`
                            : "-"}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-sm">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
                            row.fault
                              ? "border border-rose-400/20 bg-rose-500/10 text-rose-300"
                              : "border border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
                          }`}
                        >
                          <TriangleAlert className="h-3.5 w-3.5" />
                          {row.fault ? "FAULT" : "OK"}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-400">
                        {formatTime(row.telemetryTime)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <HvacCommandPanel
        tenantId={tenantId}
        siteId={siteId}
        edgeControllerId={edgeControllerId}
        selectedHvac={selectedHvac}
      />
    </div>
  );
};

function SparkLine() {
  return (
    <span className="inline-flex items-center">
      <span className="h-1.5 w-1.5 rounded-full bg-blue-300" />
      <span className="mx-1 h-1.5 w-1.5 rounded-full bg-cyan-300" />
      <span className="h-1.5 w-1.5 rounded-full bg-purple-300" />
    </span>
  );
}

export default HvacWsTable;