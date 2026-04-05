import { useEffect, useMemo, useRef, useState, type FC } from "react";
import { Client, type IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";

import type { HvacCurrentState, HvacSiteDetailsDto } from "../../../types/hvac";
import { BACKEND_URL } from "../../../utils/config";
import { api } from "@/api/http";

type HvacWsTableProps = {
  tenantId: string;
  siteId: string;
};

const WS_ENDPOINT = `${BACKEND_URL}/ws`;

const normalize = (value?: string | null) => (value || "").trim().toLowerCase();

const HvacWsTable: FC<HvacWsTableProps> = ({ tenantId, siteId }) => {
  const [data, setData] = useState<HvacCurrentState[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clientRef = useRef<Client | null>(null);

  // canonical mapped device IDs for this site
  const mappedDeviceIdsRef = useRef<Set<string>>(new Set());

  // display order and names from mapped HVAC rows
  const mappedMetaRef = useRef<Map<string, HvacSiteDetailsDto>>(new Map());

  useEffect(() => {
    let cancelled = false;

    const loadMappedRowsOnce = async () => {
      if (!tenantId || !siteId) return;

      try {
        setLoading(true);
        setError(null);

        const rows = await api<HvacSiteDetailsDto[]>(
          `/api/tenants/${tenantId}/sites/${siteId}/hvacs/details`
        );

        if (cancelled) return;

        const mappedIds = new Set<string>();
        const metaMap = new Map<string, HvacSiteDetailsDto>();

        for (const row of Array.isArray(rows) ? rows : []) {
          const key = normalize(row.externalDeviceId);
          if (!key) continue;

          mappedIds.add(key);
          metaMap.set(key, row);
        }

        mappedDeviceIdsRef.current = mappedIds;
        mappedMetaRef.current = metaMap;

        // Start with current API values if available
        const initialData: HvacCurrentState[] = [];
        for (const row of Array.isArray(rows) ? rows : []) {
          const key = normalize(row.externalDeviceId);
          if (!key) continue;

          initialData.push({
            id: undefined,
            tenantId,
            siteId,
            deviceId: row.externalDeviceId ?? undefined,
            unitName: row.unitName || row.hvacName,
            temperature: row.temperature ?? 0,
            setpoint: row.setpoint ?? 0,
            onState: row.onState ?? false,
            fanSpeed: row.fanSpeed ?? 0,
            flowRate: row.flowRate ?? 0,
            fault: row.fault ?? false,
            telemetryTime: row.telemetryTime ?? "",
            source: undefined,
          });
        }

        setData(initialData);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load mapped HVAC rows.");
          setData([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadMappedRowsOnce();

    return () => {
      cancelled = true;
    };
  }, [tenantId, siteId]);

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
            const body = JSON.parse(message.body) as HvacCurrentState[];

            const mappedIds = mappedDeviceIdsRef.current;
            const metaMap = mappedMetaRef.current;

            // Only keep live rows for mapped devices
            const filtered = (Array.isArray(body) ? body : []).filter((row) =>
              mappedIds.has(normalize(row.deviceId))
            );

            // Preserve API order from mapped rows
            const liveById = new Map<string, HvacCurrentState>();
            for (const row of filtered) {
              liveById.set(normalize(row.deviceId), row);
            }

            const ordered: HvacCurrentState[] = [];

            for (const [deviceId, meta] of metaMap.entries()) {
              const live = liveById.get(deviceId);

              if (live) {
                ordered.push({
                  ...live,
                  unitName: meta.unitName || meta.hvacName || live.unitName,
                });
              } else {
                // keep previous known row if websocket snapshot missed this one
                const existing = data.find(
                  (d) => normalize(d.deviceId) === deviceId
                );

                if (existing) {
                  ordered.push(existing);
                } else {
                  ordered.push({
                    id: undefined,
                    tenantId,
                    siteId,
                    deviceId: meta.externalDeviceId ?? undefined,
                    unitName: meta.unitName || meta.hvacName,
                    temperature: meta.temperature ?? 0,
                    setpoint: meta.setpoint ?? 0,
                    onState: meta.onState ?? false,
                    fanSpeed: meta.fanSpeed ?? 0,
                    flowRate: meta.flowRate ?? 0,
                    fault: meta.fault ?? false,
                    telemetryTime: meta.telemetryTime ?? "",
                    source: undefined,
                  });
                }
              }
            }

            setData(ordered);
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
      setConnected(false);
    };
  }, [tenantId, siteId, data]);

  const activeUnits = useMemo(() => data.filter((row) => row.onState).length, [data]);
  const faultCount = useMemo(() => data.filter((row) => row.fault).length, [data]);

  const avgTemp = useMemo(() => {
    if (!data.length) return "-";
    const values = data.map((row) => row.temperature);
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    return `${avg.toFixed(1)}°C`;
  }, [data]);

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

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
        <p className="font-medium text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
          <div className="text-4xl font-bold text-slate-900">{avgTemp}</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-2 text-sm text-slate-500">Total Units</div>
          <div className="text-4xl font-bold text-slate-900">{data.length}</div>
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
              {data.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-400">
                    No mapped HVAC devices found for this site.
                  </td>
                </tr>
              ) : (
                data.map((row) => (
                  <tr key={row.deviceId ?? row.id} className="border-t border-slate-800 text-slate-100">
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium">
                      {row.unitName}
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
                      {`${formatNumber(row.fanSpeed, 0)}%`}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      {`${formatNumber(row.flowRate)} m³/h`}
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