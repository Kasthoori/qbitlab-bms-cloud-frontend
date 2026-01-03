import { useEffect, useRef, useState, type FC } from "react";
import type { HvacCurrentState } from "../types/hvac";
import { Client, type IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";



const WE_ENDPOINT = "http://192.168.68.58:8084/ws";
const TOPIC = "/topic/hvac";

const HvacWsTable:FC = () => {

    const [data, setData] = useState<HvacCurrentState[]>([]);
    const [connected, setConnected] = useState<boolean>(false);
    const clientRef = useRef<Client | null>(null);
    console.log("HvacWsTable Start");

    useEffect(() => {
        const socketFactory = () => new SockJS(WE_ENDPOINT);

        const client = new Client({
                webSocketFactory: socketFactory as any,
                reconnectDelay: 5000, // auto-reconnect delay 5sec

                debug: (msg: string) => {
                    console.log('[STOMP DEBUG]', msg);
                },

                onConnect: () => {
                    setConnected(true);
                    console.log("Connected to WebSocket");

                     client.subscribe(TOPIC, (message: IMessage) => {
                      try {
                          const body = JSON.parse(message.body) as HvacCurrentState[];
                          setData(body);
                    
                      } catch (error) {
                          console.error("Error parsing message body:", error);
                      }
                  });   
                },

                onDisconnect: () => {
                    setConnected(false);
                    console.log("Disconnected from WebSocket");
                },

                onStompError: (frame) => {
                    console.error("Broker reported error: " + frame.headers["message"]);
                    console.error("Additional details: " + frame.body);
                },

                onWebSocketError: (event) => {
                    console.error("WebSocket error observed:", event);
                },
            
        });

        client.activate();
        clientRef.current = client;
        return () => {
            if (clientRef.current) {
                clientRef.current.deactivate();
            }
        };
        
    }, []);
    console.log("Rendering data:");
    console.log("Connected:", connected);
    return (
        <><div>
        </div><div className="p-4">
                <div className="mb-2 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-white">HVAC Live (WebSocket)</h2>
                    <span
                        className={'rounded-full px-3 text-xs font-semibold' +
                            (connected ? ' bg-green-700 text-green-50' : ' bg-red-700 text-red-50')}
                    >
                        {connected ? 'CONNECTED' : 'DISCONNECTED'}
                    </span>
                </div>
                <div className="overflow-x-auto rounded-lg border border-gray-700">
                    <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-900">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                                    Unit
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                                    Temp (°C)
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                                    Setpoint (°C)
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                                    On/Off
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                                    Fan (%)
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                                    Flow
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                                    Fault
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                                    Last Update
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800 bg-gray-950">
                            {data.map((row) => (
                                <tr key={row.id}>
                                    <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-100">
                                        {row.unitName}
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-100">
                                        {row.temperature.toFixed(2)}
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-100">
                                        {row.setpoint.toFixed(2)}
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-2 text-sm">
                                        <span
                                            className={
                                                'rounded px-2 py-1 text-sm font-semibold' +
                                                (row.onState
                                                    ? 'bg-green-700 text-gray-50 ring-1 ring-green-400 shadow-green-500/20'
                                                    : 'bg-gray-700 text-gray-200 ring-1 ring-gray-300 shadow-gray-500/20'

                                                )
                                            }
                                        >
                                            {row.onState ? 'ON' : 'OFF'}
                                            
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-100">
                                        {row.fanSpeed.toFixed(0)}%
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-100">
                                        {row.flowRate.toFixed(2)} m³/h
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-2 text-sm">
                                        <span
                                            className={
                                                'rounced px-2 py-1 text-sm font-semibold' +
                                                (row.fault
                                                    ? 'bg-red-700 text-red-50 ring-1 ring-red-400 shadow-red-500/20'
                                                    : 'bg-emerald-700 text-emerald-50 ring-1 ring-emerald-400 shadow-emerald-500/20'

                                                )
                                            }
                                        >
                                            {row.fault ? 'FAULT' : 'OK'}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-400">
                                        {new Date(row.telemetryTime).toLocaleTimeString()}
                                    </td>
                                </tr>
                            ))}
                            {data.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-4 py-4 text-center text-sm  text-gray-400">
                                        No data available
                                    </td>
                                </tr>
                            )}
                        </tbody>

                    </table>

                </div>

            </div></>
    );
}

export default HvacWsTable; 