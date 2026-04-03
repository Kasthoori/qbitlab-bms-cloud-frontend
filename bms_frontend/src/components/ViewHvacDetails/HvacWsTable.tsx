import { useCallback, useEffect, useMemo, useRef, useState, type FC } from "react";
import { Client, type IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";

import type { HvacCurrentState, HvacSiteDetailsDto } from "../../types/hvac";
import { BACKEND_URL } from "../../utils/config";
import { api } from "@/api/http";

type HvacWsTableProps = {
  tenantId: string;
  siteId: string;
};

const WS_ENDPOINT = `${BACKEND_URL}/ws`;

const HvacWsTable: FC<HvacWsTableProps> = ({ tenantId, siteId }) => {
  const [rows, setRows] = useState<HvacSiteDetailsDto[]>([]);
  const [connected, setConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const clientRef = useRef<Client | null>(null);
  const rowsRef = useRef<HvacSiteDetailsDto[]>([]);
  const liveByDeviceIdRef = useRef<Map<string, HvacCurrentState>>(new Map());
  const hasLoadedOnceRef = useRef<boolean>(false);

  const mergeMappedRowsWithLiveData = useCallback(
    (mappedRows: HvacSiteDetailsDto[]): HvacSiteDetailsDto[] => {
      const liveByDeviceId = liveByDeviceIdRef.current;

      return mappedRows.map((mappedRow) => {
        const externalKey = (mappedRow.externalDeviceId || "").trim().toLowerCase();

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

  const updateRows = useCallback((updater: (current: HvacSiteDetailsDto[]) => HvacSiteDetailsDto[]) => {
    setRows((current) => {
      const next = updater(current);
      rowsRef.current = next;
      return next;
    });
  }, []);

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
        setError(err instanceof Error ? err.message : "Failed to load mapped HVAC rows.");

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
    setError(null);
    setLoading(true);

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

    const socketFactory = () => new SockJS(WS_ENDPOINT);

    const client = new Client({
      webSocketFactory: socketFactory as never,
      reconnectDelay: 5000,

      onConnect: () => {
        setConnected(true);

        const topic = `/topic/tenants/${tenantId}/sites/${siteId}/hvac`;

        client.subscribe(topic, (message: IMessage) => {
          try {
            const liveRows = JSON.parse(message.body) as HvacCurrentState[];

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
                const externalKey = (mappedRow.externalDeviceId || "").trim().toLowerCase();

                if (!externalKey) {
                  return mappedRow;
                }

                const live = nextLiveMap.get(externalKey);

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
            });
          } catch (parseError) {
            console.error("Error parsing websocket HVAC payload:", parseError);
          }
        });
      },

      onDisconnect: () => {
        setConnected(false);
      },

      onStompError: (frame) => {
        setConnected(false);
        console.error("Broker reported error:", frame.headers["message"]);
        console.error("Additional details:", frame.body);
      },

      onWebSocketError: (event) => {
        setConnected(false);
        console.error("WebSocket error observed:", event);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      clientRef.current?.deactivate();
      clientRef.current = null;
      setConnected(false);
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
    if (value === null || value === undefined || Number.isNaN(value)) return "-";
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
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-slate-600">Loading HVAC details...</p>
      </div>
    );
  }

  if (error && rows.length === 0) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
        <p className="font-medium text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && rows.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <p className="text-sm font-medium text-amber-700">
            Background refresh failed. Showing last known data.
          </p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-2 text-sm text-slate-500">Active Units</div>
          <div className="text-4xl font-bold text-slate-900">{activeUnits}</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-2 text-sm text-slate-500">Faults</div>
          <div className="text-4xl font-bold text-amber-600">{faultCount}</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-2 text-sm text-slate-500">Avg Temp</div>
          <div className="text-4xl font-bold text-slate-900">
            {avgTemp === "-" ? "-" : `${avgTemp}°C`}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-2 text-sm text-slate-500">Total Units</div>
          <div className="text-4xl font-bold text-slate-900">{rows.length}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">HVAC Details</h2>
            <p className="mt-1 text-sm text-slate-500">
              Live HVAC data for mapped devices only
            </p>
          </div>

          <span
            className={`rounded-full px-4 py-1 text-xs font-semibold ${
              connected ? "bg-green-700 text-green-50" : "bg-red-700 text-red-50"
            }`}
          >
            {connected ? "CONNECTED" : "DISCONNECTED"}
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="min-w-full border-collapse">
            <thead className="bg-slate-950">
              <tr className="text-left text-xs uppercase tracking-wider text-slate-300">
                <th className="px-4 py-3">Unit</th>
                <th className="px-4 py-3">Temp (°C)</th>
                <th className="px-4 py-3">Setpoint (°C)</th>
                <th className="px-4 py-3">On/Off</th>
                <th className="px-4 py-3">Fan (%)</th>
                <th className="px-4 py-3">Flow</th>
                <th className="px-4 py-3">Fault</th>
                <th className="px-4 py-3">Last Update</th>
              </tr>
            </thead>

            <tbody className="bg-[#020817]">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-400">
                    No mapped HVAC devices found for this site.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.hvacId} className="border-t border-slate-800 text-slate-100">
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium">
                      {row.unitName || row.hvacName}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      {formatNumber(row.temperature)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      {formatNumber(row.setpoint)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <span
                        className={`rounded px-3 py-1 text-xs font-semibold ${
                          row.onState
                            ? "bg-green-700 text-gray-50"
                            : "bg-gray-700 text-gray-200"
                        }`}
                      >
                        {row.onState ? "ON" : "OFF"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      {row.fanSpeed !== null && row.fanSpeed !== undefined
                        ? `${formatNumber(row.fanSpeed, 0)}%`
                        : "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      {row.flowRate !== null && row.flowRate !== undefined
                        ? `${formatNumber(row.flowRate)} m³/h`
                        : "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <span
                        className={`rounded px-3 py-1 text-xs font-semibold ${
                          row.fault
                            ? "bg-red-700 text-red-50"
                            : "bg-emerald-700 text-emerald-50"
                        }`}
                      >
                        {row.fault ? "FAULT" : "OK"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-400">
                      {formatTime(row.telemetryTime)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HvacWsTable;